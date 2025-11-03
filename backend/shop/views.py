from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.db import transaction
import ast
from urllib.parse import unquote

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
# 💬 Produktbewertungen (Reviews)
# ------------------------------------------------------------
class ReviewViewSet(ModelViewSet):
    queryset = Review.objects.select_related("product", "user").all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ------------------------------------------------------------
# 🟨 Produkt in den Warenkorb legen
# ------------------------------------------------------------
class AddToCartView(APIView):
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
    def post(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=401)

        # ✅ Frontend sendet cartItems im Body → Session Cart wird ignoriert
        cart_items = request.data.get("cartItems", [])
        address = request.data.get("address", {})
        payment_method = request.data.get("paymentMethod", "paypal")

        if not cart_items:
            return Response({"error": "cartItems missing"}, status=400)

        try:
            with transaction.atomic():

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

                for item in cart_items:
                    pid = item.get("product") or item.get("id")
                    qty = int(item.get("quantity", 1))
                    selected_attributes = item.get("selectedAttributes", {})

                    if not pid:
                        raise ValueError("Product ID missing in cart item")

                    product = get_object_or_404(Product, pk=pid)

                    # ✅ Variante anhand der Attribute suchen
                    variant = None
                    selected_norm = {
                        str(k).strip().lower(): str(v).strip().lower()
                        for k, v in selected_attributes.items()
                    }

                    for v in product.variations.prefetch_related("attributes__attribute_type"):
                        attrs = {
                            a.attribute_type.name.strip().lower(): a.value.strip().lower()
                            for a in v.attributes.all()
                        }
                        if attrs == selected_norm:
                            variant = v
                            break

                    if not variant:
                        raise ValueError(f"Variante nicht gefunden für {product.title}")

                    if (variant.stock or 0) < qty:
                        raise ValueError(f"Nicht genug Lager für {product.title}")

                    # ✅ Lagerbestand reduzieren
                    variant.stock -= qty
                    variant.save(update_fields=["stock"])

                    # ✅ Produktbild übernehmen
                    image = item.get("product_image")
                    if image:
                        image = unquote(image).lstrip("/")
                    else:
                        if product.main_image:
                            image = request.build_absolute_uri(product.main_image.url)
                        elif product.external_image:
                            image = unquote(product.external_image).lstrip("/")

                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        variation=variant,
                        product_title=product.title,
                        product_image=image,
                        price=product.price,
                        quantity=qty,
                    )

                    total += float(product.price) * qty

                order.total = total
                order.save(update_fields=["total"])

                # ✅ LocalStorage Cart bleibt unberührt → Angular löscht ihn selbst
                return Response(
                    {"message": "Bestellung erfolgreich erstellt", "order_id": order.id},
                    status=201,
                )

        except Exception as exc:
            return Response({"error": str(exc)}, status=500)

# ------------------------------------------------------------
# 🧾 Bestellungen anzeigen
# ------------------------------------------------------------
class OrderViewSet(ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return (
                Order.objects.filter(user=user)
                .prefetch_related("items__product")
                .select_related("user")
                .order_by("-created_at")
            )
        return Order.objects.none()

    def retrieve(self, request, *args, **kwargs):
        user = request.user
        order = get_object_or_404(Order, pk=kwargs["pk"])
        if order.user != user:
            raise PermissionDenied("Du hast keinen Zugriff auf diese Bestellung.")
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=200)


# ------------------------------------------------------------
# 🔐 CSRF Cookie
# ------------------------------------------------------------
@ensure_csrf_cookie
def get_csrf_token(request):
    token = get_token(request)
    return JsonResponse({"csrfToken": token}, status=200)
