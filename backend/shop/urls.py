from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet,
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

    # Bestellung aus Warenkorb auslösen
    path("order/place/", PlaceOrderView.as_view(), name="place_order"),

    # CSRF-Token für Frontend
    path("cart/csrf/", get_csrf_token, name="get_csrf_token_legacy"),
]
