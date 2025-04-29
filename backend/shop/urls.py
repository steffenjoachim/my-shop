from django.urls import path, include
from .views import (
    CartView,
    AddToCartView,
    PlaceOrderView,
    RemoveFromCartView,
    UpdateCartItemView,
    ProductViewSet,
    get_csrf_token,
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),

    # Cart-API
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/add/<int:product_id>/', AddToCartView.as_view(), name='add_to_cart'),
    path('cart/remove/<int:product_id>/', RemoveFromCartView.as_view(), name='remove_from_cart'),
    path('cart/update/<int:product_id>/', UpdateCartItemView.as_view(), name='update_cart_item'),
    path('cart/place-order/', PlaceOrderView.as_view(), name='place-order'),

    # ✅ Neuer CSRF-Endpunkt
    path('cart/csrf/', get_csrf_token, name='get-csrf-token'),
]
