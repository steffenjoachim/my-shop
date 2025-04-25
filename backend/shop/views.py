from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Product
from django.shortcuts import get_object_or_404
from rest_framework.viewsets import ModelViewSet
from .serializers import ProductSerializer

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