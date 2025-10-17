from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from django.middleware.csrf import get_token

from .models import Product, ProductVariation, Category, AttributeValue, DeliveryTime
from .serializers import ProductSerializer, DeliveryTimeSerializer

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
    def post(self, request):
        # Akzeptiere zusätzliche Felder (z.B. address, paymentMethod) ohne sie zu verwenden
        address = request.data.get("address", {})
        payment_method = request.data.get("paymentMethod", "")

        cart = request.session.get("cart", {})
        updated_products = []

        for key, qty in cart.items():
            pid, attributes = key.split("|", 1)
            product = get_object_or_404(Product, pk=pid)
            selected_attributes = eval(attributes)

            # 🔍 passende Variante anhand AttributeValue suchen
            variant = None
            for v in product.variations.prefetch_related("attributes__attribute_type"):
                # Vergleiche Keys und Values normalized (klein, getrimmt)
                v_attrs = {a.attribute_type.name.strip().lower(): a.value.strip().lower() for a in v.attributes.all()}
                selected_attrs_normalized = {k.strip().lower(): v.strip().lower() for k, v in selected_attributes.items()}

                # Debug-Ausgaben (optional, für Entwicklung)
                # print("selected_attrs_normalized:", selected_attrs_normalized)
                # print("variant attrs:", v_attrs)

                matches = (
                    v_attrs == selected_attrs_normalized
                    and len(v_attrs) == len(selected_attrs_normalized)
                )

                if matches:
                    variant = v
                    break

            # 🧮 Bestand prüfen und reduzieren
            if variant and (variant.stock or 0) >= qty:
                variant.stock -= qty
                variant.save()
                updated_products.append({
                    "id": product.id,
                    "variant_id": variant.id,
                    "remaining_stock": variant.stock,
                })
            elif not variant:
                return Response(
                    {"error": f"Variante nicht gefunden für {product.title}"},
                    status=400,
                )
            else:
                return Response(
                    {"error": f"Nicht genug Lager für {product.title}"},
                    status=400,
                )

        # 🧹 Warenkorb leeren
        request.session["cart"] = {}
        request.session.modified = True

        return Response(
            {"message": "Bestellung erfolgreich", "updated_products": updated_products},
            status=200,
        )

# ------------------------------------------------------------
# 🔐 CSRF Cookie für Angular
# ------------------------------------------------------------
@ensure_csrf_cookie
def get_csrf_token(request):
    token = get_token(request)
    return JsonResponse({"csrfToken": token}, status=200)