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
    def post(self, request, product_id):
        cart = request.session.get("cart", {})
        cart[str(product_id)] = cart.get(str(product_id), 0) + 1
        request.session["cart"] = cart
        request.session.modified = True
        return Response({"cart": cart}, status=status.HTTP_200_OK)


class CartView(APIView):
    def get(self, request):
        cart = request.session.get("cart", {})
        items = []
        for pid, quantity in cart.items():
            product = get_object_or_404(Product, id=pid)
            items.append({
                "id": product.id,
                "title": product.title,
                "price": str(product.price),
                "main_image": product.main_image,
                "stock": product.stock,
                "quantity": quantity,
            })
        return Response(items)


class RemoveFromCartView(APIView):
    def delete(self, request, product_id):
        cart = request.session.get("cart", {})
        if str(product_id) in cart:
            del cart[str(product_id)]
            request.session["cart"] = cart
            request.session.modified = True
        return Response({"cart": cart}, status=status.HTTP_200_OK)


class UpdateCartItemView(APIView):
    def post(self, request, product_id):
        quantity = request.data.get("quantity")
        if quantity is None or int(quantity) < 1:
            return Response({"error": "Ungültige Menge"}, status=status.HTTP_400_BAD_REQUEST)

        cart = request.session.get("cart", {})
        cart[str(product_id)] = int(quantity)
        request.session["cart"] = cart
        request.session.modified = True
        return Response({"cart": cart}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class PlaceOrderView(APIView):
    def post(self, request):
        cart = request.session.get("cart", {})
        updated_products = []

        for pid, qty in cart.items():
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


# ✅ CSRF-Cookie-Setz-Endpunkt für Angular
@ensure_csrf_cookie
def get_csrf_token(request):
    token = get_token(request)
    return JsonResponse({"csrfToken": token}, status=200)
