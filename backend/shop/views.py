from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from django.middleware.csrf import get_token
from rest_framework import permissions, viewsets
from .models import Product, ProductVariation, Category, AttributeValue, DeliveryTime, Review, Order
from .serializers import ProductSerializer, DeliveryTimeSerializer, ReviewSerializer, OrderSerializer
import ast
from django.db import transaction

# ------------------------------------------------------------
# 🟩 Produkte abrufen
# ------------------------------------------------------------
class ProductViewSet(ModelViewSet):
    # Queryset mit select_related, damit category und delivery_time sauber geladen werden
    queryset = Product.objects.select_related("category", "delivery_time").all()
    serializer_class = ProductSerializer
    # optional: pagination_class = None

# ------------------------------------------------------------
# 🚚 Lieferzeit anzeigen
# ------------------------------------------------------------   
class DeliveryTimeViewSet(ModelViewSet):
    queryset = DeliveryTime.objects.all()
    serializer_class = DeliveryTimeSerializer

# ------------------------------------------------------------
# 🟨 Produkt in den Warenkorb legen
# ------------------------------------------------------------
class AddToCartView(APIView):
    """
    Erwartet POST-Daten:
    {
      "productId": 1,
      "quantity": 2,
      "selectedAttributes": {"Größe": "L", "Farbe": "Rot"}
    }
    """

    def post(self, request, product_id=None):
        cart = request.session.get("cart", {})

        if product_id:
            # Direkter Aufruf mit product_id
            product_id = int(product_id)
            quantity = int(request.data.get("quantity", 1))
            selected_attributes = request.data.get("selectedAttributes", {})
        else:
            # Body-basierter Aufruf
            product_id = request.data.get("productId")
            quantity = int(request.data.get("quantity", 1))
            selected_attributes = request.data.get("selectedAttributes", {})

        # Key für Session: productId|{selectedAttributes}
        key = f"{product_id}|{str(selected_attributes)}"
        cart[key] = cart.get(key, 0) + quantity

        request.session["cart"] = cart
        request.session.modified = True
        return Response({"cart": cart}, status=status.HTTP_200_OK)

# ------------------------------------------------------------
# 🛒 Warenkorb abrufen
# ------------------------------------------------------------
class CartView(APIView):
    def get(self, request):
        cart = request.session.get("cart", {})
        items = []

        for key, quantity in cart.items():
            parts = key.split("|", 1)
            product_id = parts[0]
            selected_attributes = eval(parts[1]) if len(parts) > 1 else {}

            product = get_object_or_404(Product, id=product_id)
            total_stock = sum((v.stock or 0) for v in product.variations.all())

            items.append({
                "id": product.id,
                "title": product.title,
                "price": str(product.price),
                "main_image": str(product.main_image) if product.main_image else None,
                "stock": total_stock,
                "quantity": quantity,
                "selectedAttributes": selected_attributes,
            })

        return Response(items)

# ------------------------------------------------------------
# 🔴 Produkt aus Warenkorb entfernen
# ------------------------------------------------------------
class RemoveFromCartView(APIView):
    """
    Erwartet DELETE mit body:
    { "productId": 1, "selectedAttributes": {"RAM": "8 GB"} }
    """

    def delete(self, request, product_id=None):
        cart = request.session.get("cart", {})

        if product_id:
            # Direkter Aufruf mit product_id
            product_id = int(product_id)
            selected_attributes = request.data.get("selectedAttributes", {})
            key = f"{product_id}|{str(selected_attributes)}"
        else:
            # Body-basierter Aufruf
            pid = request.data.get("productId")
            selected_attributes = request.data.get("selectedAttributes", {})
            key = f"{pid}|{str(selected_attributes)}"

        if key in cart:
            del cart[key]
            request.session["cart"] = cart
            request.session.modified = True

        return Response({"cart": cart}, status=status.HTTP_200_OK)

# ------------------------------------------------------------
# 🟦 Menge im Warenkorb ändern
# ------------------------------------------------------------
class UpdateCartItemView(APIView):
    """
    Erwartet POST:
    {
      "productId": 1,
      "quantity": 3,
      "selectedAttributes": {"RAM": "8 GB"}
    }
    """

    def post(self, request, product_id=None):
        cart = request.session.get("cart", {})

        if product_id:
            # Direkter Aufruf mit product_id
            product_id = int(product_id)
            quantity = int(request.data.get("quantity", 1))
            selected_attributes = request.data.get("selectedAttributes", {})
            key = f"{product_id}|{str(selected_attributes)}"
        else:
            # Body-basierter Aufruf
            pid = request.data.get("productId")
            quantity = int(request.data.get("quantity", 1))
            selected_attributes = request.data.get("selectedAttributes", {})
            key = f"{pid}|{str(selected_attributes)}"

        if quantity < 1:
            return Response({"error": "Ungültige Menge"}, status=status.HTTP_400_BAD_REQUEST)

        cart[key] = quantity
        request.session["cart"] = cart
        request.session.modified = True
        return Response({"cart": cart}, status=status.HTTP_200_OK)

# ------------------------------------------------------------
# 🟩 Bestellung abschließen & Lagerbestand reduzieren
# ------------------------------------------------------------

@method_decorator(csrf_exempt, name="dispatch")
class PlaceOrderView(APIView):
    """
    Erzeugt eine Order + OrderItems, reduziert Bestände atomar und leert den Session‑Warenkorb.
    Erwartet optional address/paymentMethod im Body. User muss angemeldet sein (Order.user FK).
    """

    def post(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        address = request.data.get("address", {})
        payment_method = request.data.get("paymentMethod", "")

        cart = request.session.get("cart", {})
        if not cart:
            return Response({"error": "Warenkorb ist leer"}, status=status.HTTP_400_BAD_REQUEST)

        updated_products = []
        try:
            with transaction.atomic():
                # Order anlegen (minimal)
                order = Order.objects.create(user=request.user, total=0, paid=False, status="pending")

                total = 0
                for key, qty in cart.items():
                    try:
                        pid, attributes = key.split("|", 1)
                        pid = int(pid)
                        selected_attributes = ast.literal_eval(attributes)
                    except Exception:
                        transaction.set_rollback(True)
                        return Response({"error": "Ungültiger Warenkorb‑Eintrag"}, status=400)

                    product = get_object_or_404(Product, pk=pid)

                    # 🔍 passende Variante anhand AttributeValue suchen
                    variant = None
                    for v in product.variations.prefetch_related("attributes__attribute_type"):
                        v_attrs = {a.attribute_type.name.strip().lower(): a.value.strip().lower() for a in v.attributes.all()}
                        selected_attrs_normalized = {k.strip().lower(): str(vv).strip().lower() for k, vv in selected_attributes.items()}

                        matches = (
                            v_attrs == selected_attrs_normalized
                            and len(v_attrs) == len(selected_attrs_normalized)
                        )
                        if matches:
                            variant = v
                            break

                    if not variant:
                        transaction.set_rollback(True)
                        return Response({"error": f"Variante nicht gefunden für {product.title}"}, status=400)

                    if (variant.stock or 0) < qty:
                        transaction.set_rollback(True)
                        return Response({"error": f"Nicht genug Lager für {product.title}"}, status=400)

                    # Bestand reduzieren und OrderItem anlegen
                    variant.stock -= qty
                    variant.save(update_fields=["stock"])

                    price = product.price
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        variation=variant,
                        price=price,
                        quantity=qty,
                    )

                    total += float(price) * int(qty)

                    updated_products.append({
                        "id": product.id,
                        "variant_id": variant.id,
                        "remaining_stock": variant.stock,
                        "ordered_quantity": qty,
                    })

                # Order total setzen
                order.total = total
                order.save(update_fields=["total"])

                # Warenkorb leeren
                request.session["cart"] = {}
                request.session.modified = True

                return Response({
                    "message": "Bestellung erfolgreich",
                    "order_id": order.id,
                    "updated_products": updated_products
                }, status=status.HTTP_200_OK)

        except Exception as exc:
            # Sicherstellen, dass bei Fehlern zurückgerollt wird
            return Response({"error": "Fehler beim Erstellen der Bestellung", "detail": str(exc)}, status=500)
        
# ------------------------------------------------------------
# 🟩 Bewertungen
# ------------------------------------------------------------
class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related("product", "user").all()
    serializer_class = ReviewSerializer

    def get_queryset(self):
        qs = super().get_queryset().filter(approved=True)
        product_id = self.request.query_params.get("product")
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs

    def perform_create(self, serializer):
        # set user from request (require auth in production)
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            # in dev: reject or allow anonymous by setting None (prefer to require auth)
            raise permissions.exceptions.NotAuthenticated()
        
# ------------------------------------------------------------
# 🟩 Bestellungen (Rechnung)
# --------------------------------------------------------------
class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Order.objects.prefetch_related("items__product").all()
    serializer_class = OrderSerializer

    def get_queryset(self):
        # users only see their orders (superusers see all)
        user = self.request.user
        if user.is_authenticated and not user.is_staff:
            return self.queryset.filter(user=user)
        return self.queryset

# ------------------------------------------------------------
# 🔐 CSRF Cookie für Angular
# ------------------------------------------------------------
@ensure_csrf_cookie
def get_csrf_token(request):
    token = get_token(request)
    return JsonResponse({"csrfToken": token}, status=200)