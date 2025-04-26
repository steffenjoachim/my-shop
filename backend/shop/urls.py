from django.urls import path
from .views import (
    CartView,
    AddToCartView,
    RemoveFromCartView,
    UpdateCartItemView,
    ProductViewSet,
)
from rest_framework.routers import DefaultRouter
from django.urls import include

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    # API für Produkte (List, Retrieve, Create, ...)
    path('', include(router.urls)),

    # Session-basierter Warenkorb
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/add/<int:product_id>/', AddToCartView.as_view(), name='add_to_cart'),
    path('cart/remove/<int:product_id>/', RemoveFromCartView.as_view(), name='remove_from_cart'),
    path('cart/update/<int:product_id>/', UpdateCartItemView.as_view(), name='update_cart_item'),
]
