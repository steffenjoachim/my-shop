from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ProductViewSet,
    DeliveryTimeViewSet,
    ReviewViewSet,
    OrderViewSet,
    PlaceOrderView,
    get_csrf_token,
)

router = DefaultRouter()
router.register("products", ProductViewSet, basename="products")
router.register("delivery-times", DeliveryTimeViewSet, basename="delivery-times")
router.register("reviews", ReviewViewSet, basename="reviews")
router.register("orders", OrderViewSet, basename="orders")

urlpatterns = [
    path("", include(router.urls)),                 
    path("order/place/", PlaceOrderView.as_view()), 
    path("csrf/", get_csrf_token),                  
]
