from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from django.middleware.csrf import get_token

from .models import Product, ProductAttribute
from .serializers import ProductSerializer


class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all().prefetch_related("product_attributes", "images", "category")
    serializer_class = ProductSerializer


class AddToCartView(APIView):
    """
    Erwartet POST-Daten:
    {
      "productId": 1,
      "quantity": 2,
      "selectedAttributes": {"RAM": "8 GB", "Farbe": "Rot"}
    }
    """
    def post(self, request, product_id=None):
        cart = request.session.get("cart", {})

        if product_id:  # alte Variante: /cart/add/<product_id>/
            key = str(product_id)
            cart[key] = cart.get(key, 0) + 1
        else:  # neue Variante: /cart/add/
            product_id = request.data.get("productId")
            quantity = int(request.data.get("quantity", 1))
            selected_attributes = request.data.get("selectedAttributes", {})

            # Schlüssel eindeutig machen: id|attributes(JSON)
            key = f"{product_id}|{str(selected_attributes)}"
            cart[key] = cart.get(key, 0) + quantity

        request.session["cart"] = cart
        request.session.modified = True
        return Response({"cart": cart}, status=status.HTTP_200_OK)


class CartView(APIView):
    def get(self, request):
        cart = request.session.get("cart", {})
        items = []
        for key, quantity in cart.items():
            # Schlüssel aufteilen
            parts = key.split("|", 1)
            product_id = parts[0]
            selected_attributes = eval(parts[1]) if len(parts) > 1 else {}

            product = get_object_or_404(Product, id=product_id)

            # Gesamtbestand über Varianten berechnen
            total_stock = sum(attr.stock for attr in product.product_attributes.all())

            items.append({
                "id": product.id,
                "title": product.title,
                "price": str(product.price),
                "main_image": product.main_image.url if product.main_image else None,
                "stock": total_stock,
                "quantity": quantity,
                "selectedAttributes": selected_attributes,
            })
        return Response(items)


class RemoveFromCartView(APIView):
    """
    Erwartet DELETE mit body:
    { "productId": 1, "selectedAttributes": {"RAM": "8 GB"} }
    """
    def delete(self, request, product_id=None):
        cart = request.session.get("cart", {})

        if product_id:  # alte Variante
            key = str(product_id)
        else:  # neue Variante mit Attributen
            pid = request.data.get("productId")
            selected_attributes = request.data.get("selectedAttributes", {})
            key = f"{pid}|{str(selected_attributes)}"

        if key in cart:
            del cart[key]
            request.session["cart"] = cart
            request.session.modified = True
        return Response({"cart": cart}, status=status.HTTP_200_OK)


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

        if product_id:  # alte Variante
            key = str(product_id)
            quantity = request.data.get("quantity")
        else:  # neue Variante
            pid = request.data.get("productId")
            quantity = int(request.data.get("quantity", 1))
            selected_attributes = request.data.get("selectedAttributes", {})
            key = f"{pid}|{str(selected_attributes)}"

        if quantity is None or int(quantity) < 1:
            return Response({"error": "Ungültige Menge"}, status=status.HTTP_400_BAD_REQUEST)

        cart[key] = int(quantity)
        request.session["cart"] = cart
        request.session.modified = True
        return Response({"cart": cart}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class PlaceOrderView(APIView):
    def post(self, request):
        cart = request.session.get("cart", {})
        updated_products = []

        for key, qty in cart.items():
            pid, attributes = key.split("|", 1)
            product = get_object_or_404(Product, pk=pid)

            # Falls Variante existiert → konkretes Stock-Feld prüfen
            variant = None
            try:
                selected_attributes = eval(attributes)
                variant = product.product_attributes.filter(
                    value__value__in=selected_attributes.values()
                ).first()
            except Exception:
                pass

            if variant and variant.stock >= qty:
                variant.stock -= qty
                variant.save()
                updated_products.append({
                    "id": product.id,
                    "variant": variant.value.value,
                    "stock": variant.stock,
                })
            elif not variant:
                return Response({"error": f"Variante nicht gefunden für {product.title}"}, status=400)
            else:
                return Response({"error": f"Nicht genug Lager für {product.title}"}, status=400)

        request.session["cart"] = {}
        request.session.modified = True

        return Response(
            {"message": "Bestellung erfolgreich", "updated_products": updated_products},
            status=200,
        )


# CSRF-Cookie-Setz-Endpunkt für Angular
@ensure_csrf_cookie
def get_csrf_token(request):
    token = get_token(request)
    return JsonResponse({"csrfToken": token}, status=200)
