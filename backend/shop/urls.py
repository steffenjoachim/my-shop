from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ProductViewSet,
    DeliveryTimeViewSet,
    ReviewViewSet,
    OrderViewSet,
    CategoryViewSet,
    PlaceOrderView,
    get_csrf_token,
    ShippingOrdersView,   
    ShippingReturnsView,
    ShippingReturnDetailView,
    UserReturnsView
)

router = DefaultRouter()
router.register("products", ProductViewSet, basename="products")
router.register("delivery-times", DeliveryTimeViewSet, basename="delivery-times")
router.register("reviews", ReviewViewSet, basename="reviews")
router.register("orders", OrderViewSet, basename="orders")
router.register("categories", CategoryViewSet, basename="categories")

urlpatterns = [                
    path("order/place/", PlaceOrderView.as_view()), 
    path("csrf/", get_csrf_token),                  

    # ✅ SHIPPING API
    path("shipping/orders/", ShippingOrdersView.as_view()),
    path("shipping/returns/", ShippingReturnsView.as_view()),
    path("shipping/returns/<int:pk>/", ShippingReturnDetailView.as_view()),
    
     # USER RETURNS 
    path("orders/my-returns/", UserReturnsView.as_view()),
    
    path("", include(router.urls)), 
]
