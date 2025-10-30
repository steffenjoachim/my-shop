from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet,
    CartView,
    AddToCartView,
    RemoveFromCartView,
    UpdateCartItemView,
    PlaceOrderView,
    DeliveryTimeViewSet,
    get_csrf_token,
    ReviewViewSet,
    OrderViewSet,
)

# Router für REST-ViewSets
router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")
router.register(r"delivery-times", DeliveryTimeViewSet, basename="deliverytime")
router.register(r"reviews", ReviewViewSet, basename="review")
router.register(r"orders", OrderViewSet, basename="order")  

urlpatterns = [
    # REST-Routen
    path("", include(router.urls)),

    # Cart-API (separate Endpunkte)
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/add/", AddToCartView.as_view(), name="add_to_cart"),
    path("cart/remove/", RemoveFromCartView.as_view(), name="remove_from_cart"),
    path("cart/update/", UpdateCartItemView.as_view(), name="update_cart"),

    # Bestellung aus Warenkorb auslösen
    path("order/place/", PlaceOrderView.as_view(), name="place_order"),

    # CSRF-Token für Frontend
    path("cart/csrf/", get_csrf_token, name="get_csrf_token_legacy"),
]
