from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from django.middleware.csrf import get_token

from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class AddToCartView(APIView):
    """
    Erwartet POST-Daten:
    {
      "productId": 1,
      "quantity": 2,
      "selectedColor": "Red",
      "selectedSize": "M"
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
            color = request.data.get("selectedColor") or ""
            size = request.data.get("selectedSize") or ""

            # Schlüssel eindeutig machen: id|color|size
            key = f"{product_id}|{color}|{size}"
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
            parts = key.split("|")
            product_id = parts[0]
            color = parts[1] if len(parts) > 1 else ""
            size = parts[2] if len(parts) > 2 else ""

            product = get_object_or_404(Product, id=product_id)
            items.append({
                "id": product.id,
                "title": product.title,
                "price": str(product.price),
                "main_image": product.main_image,
                "stock": product.stock,
                "quantity": quantity,
                "selectedColor": color,
                "selectedSize": size,
            })
        return Response(items)


class RemoveFromCartView(APIView):
    """
    Erwartet DELETE mit body:
    { "productId": 1, "color": "Red", "size": "M" }
    """
    def delete(self, request, product_id=None):
        cart = request.session.get("cart", {})

        if product_id:  # alte Variante
            key = str(product_id)
        else:  # neue Variante mit Attributen
            pid = request.data.get("productId")
            color = request.data.get("color") or ""
            size = request.data.get("size") or ""
            key = f"{pid}|{color}|{size}"

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
      "color": "Red",
      "size": "M"
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
            color = request.data.get("color") or ""
            size = request.data.get("size") or ""
            key = f"{pid}|{color}|{size}"

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
            pid = key.split("|")[0]  # Produkt-ID extrahieren
            try:
                product = Product.objects.get(pk=pid)
                if product.stock >= qty:
                    product.stock -= qty
                    product.save()
                    updated_products.append({
                        "id": product.id,
                        "title": product.title,
                        "stock": product.stock,
                    })
                else:
                    return Response(
                        {"error": f"Nicht genug Lager für {product.title}"},
                        status=400,
                    )
            except Product.DoesNotExist:
                continue

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
