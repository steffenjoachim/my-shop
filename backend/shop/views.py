from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Product
from django.shortcuts import get_object_or_404
from rest_framework.viewsets import ModelViewSet
from .serializers import ProductSerializer
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Product

class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class AddToCartView(APIView):
    def post(self, request, product_id):
        cart = request.session.get('cart', {})
        cart[str(product_id)] = cart.get(str(product_id), 0) + 1
        request.session['cart'] = cart
        request.session.modified = True
        return Response({'cart': cart}, status=status.HTTP_200_OK)

class CartView(APIView):
    def get(self, request):
        cart = request.session.get('cart', {})
        items = []
        for pid, quantity in cart.items():
            product = get_object_or_404(Product, id=pid)
            items.append({
                "id": product.id,
                "title": product.title,
                "price": str(product.price),
                "image": product.image,
                "quantity": quantity
            })
        return Response(items)

class RemoveFromCartView(APIView):
    def delete(self, request, product_id):
        cart = request.session.get('cart', {})
        if str(product_id) in cart:
            del cart[str(product_id)]
            request.session['cart'] = cart
            request.session.modified = True
        return Response({'cart': cart}, status=status.HTTP_200_OK)

class UpdateCartItemView(APIView):
    def post(self, request, product_id):
        quantity = request.data.get('quantity')
        if quantity is None or int(quantity) < 1:
            return Response({'error': 'Ungültige Menge'}, status=status.HTTP_400_BAD_REQUEST)

        cart = request.session.get('cart', {})
        cart[str(product_id)] = int(quantity)
        request.session['cart'] = cart
        request.session.modified = True
        return Response({'cart': cart}, status=status.HTTP_200_OK)
    
@method_decorator(csrf_exempt, name='dispatch')
class PlaceOrderView(APIView):
    def post(self, request):
        cart = request.session.get('cart', {})
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
                        "stock": product.stock
                    })
                else:
                    return Response({"error": f"Nicht genug Lager für {product.title}"}, status=400)
            except Product.DoesNotExist:
                continue

        request.session['cart'] = {}
        request.session.modified = True

        return Response({
            "message": "Bestellung erfolgreich",
            "updated_products": updated_products
        }, status=200)