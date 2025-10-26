from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from rest_framework.viewsets import ModelViewSet
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from django.middleware.csrf import get_token
from rest_framework import permissions, viewsets
from django.db import transaction
import ast

from .models import (
    Product,
    ProductVariation,
    Category,
    AttributeValue,
    DeliveryTime,
    Review,
    Order,
    OrderItem,
)
from .serializers import (
    ProductSerializer,
    DeliveryTimeSerializer,
    ReviewSerializer,
    OrderSerializer,
)

# ------------------------------------------------------------
# 🟩 Produkte abrufen
# ------------------------------------------------------------
class ProductViewSet(ModelViewSet):
    queryset = Product.objects.select_related("category", "delivery_time").all()
    serializer_class = ProductSerializer


# ------------------------------------------------------------
# 🚚 Lieferzeiten abrufen
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
            product_id = int(product_id)
            quantity = int(request.data.get("quantity", 1))
            selected_attributes = request.data.get("selectedAttributes", {})
        else:
            product_id = request.data.get("productId")
            quantity = int(request.data.get("quantity", 1))
            selected_attributes = request.data.get("selectedAttributes", {})

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
            product_id = int(product_id)
            selected_attributes = request.data.get("selectedAttributes", {})
            key = f"{product_id}|{str(selected_attributes)}"
        else:
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
            product_id = int(product_id)
            quantity = int(request.data.get("quantity", 1))
            selected_attributes = request.data.get("selectedAttributes", {})
            key = f"{product_id}|{str(selected_attributes)}"
        else:
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
    Erzeugt eine Order + OrderItems, reduziert Bestände atomar und leert den Session-Warenkorb.
    Erwartet optional address/paymentMethod im Body.
    """

    def post(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        address = request.data.get("address", {})
        payment_method = request.data.get("paymentMethod", "paypal")

        cart = request.session.get("cart", {})
        if not cart:
            return Response({"error": "Warenkorb ist leer"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # 🧾 Bestellung anlegen inkl. Adresse und Zahlungsart
                order = Order.objects.create(
                    user=request.user,
                    total=0,
                    paid=False,
                    status="pending",
                    name=address.get("name", ""),
                    street=address.get("street", ""),
                    zip=address.get("zip", ""),
                    city=address.get("city", ""),
                    payment_method=payment_method,
                )

                total = 0
                for key, qty in cart.items():
                    try:
                        pid, attributes = key.split("|", 1)
                        pid = int(pid)
                        selected_attributes = ast.literal_eval(attributes)
                    except Exception:
                        transaction.set_rollback(True)
                        return Response({"error": "Ungültiger Warenkorb-Eintrag"}, status=400)

                    product = get_object_or_404(Product, pk=pid)

                    # 🔍 Variante ermitteln
                    variant = None
                    for v in product.variations.prefetch_related("attributes__attribute_type"):
                        v_attrs = {a.attribute_type.name.strip().lower(): a.value.strip().lower() for a in v.attributes.all()}
                        selected_attrs_normalized = {k.strip().lower(): str(vv).strip().lower() for k, vv in selected_attributes.items()}

                        if v_attrs == selected_attrs_normalized and len(v_attrs) == len(selected_attrs_normalized):
                            variant = v
                            break

                    if not variant:
                        transaction.set_rollback(True)
                        return Response({"error": f"Variante nicht gefunden für {product.title}"}, status=400)

                    if (variant.stock or 0) < qty:
                        transaction.set_rollback(True)
                        return Response({"error": f"Nicht genug Lager für {product.title}"}, status=400)

                    # 🏷️ Bestand reduzieren & OrderItem speichern
                    variant.stock -= qty
                    variant.save(update_fields=["stock"])

                    image = product.main_image.url if product.main_image else product.external_image

                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        variation=variant,
                        product_title=product.title,
                        product_image=image,
                        price=product.price,
                        quantity=qty,
                    )

                    total += float(product.price) * int(qty)

                # 💰 Gesamtsumme speichern
                order.total = total
                order.save(update_fields=["total"])

                # 🧹 Warenkorb leeren
                request.session["cart"] = {}
                request.session.modified = True

                return Response({
                    "message": "Bestellung erfolgreich erstellt",
                    "order_id": order.id,
                    "total": total,
                }, status=status.HTTP_201_CREATED)

        except Exception as exc:
            transaction.set_rollback(True)
            return Response(
                {"error": "Fehler beim Erstellen der Bestellung", "detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            raise permissions.exceptions.NotAuthenticated()


# ------------------------------------------------------------
# 🧾 Bestellungen anzeigen (User oder Admin)
# ------------------------------------------------------------
class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Zeigt alle Bestellungen an:
      - normale Nutzer: nur eigene Bestellungen
      - Admins: alle
    """
    queryset = Order.objects.prefetch_related("items__product").all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and not user.is_staff:
            return self.queryset.filter(user=user).order_by("-created_at")
        return self.queryset.order_by("-created_at")
    
class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Nur Bestellungen des eingeloggten Benutzers anzeigen
        user = self.request.user
        return Order.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# ------------------------------------------------------------
# 🔐 CSRF Cookie für Angular (Initial-Request)
# ------------------------------------------------------------
@ensure_csrf_cookie
def get_csrf_token(request):
    token = get_token(request)
    return JsonResponse({"csrfToken": token}, status=200)
