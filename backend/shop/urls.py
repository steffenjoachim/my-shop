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

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")
router.register(r"delivery-times", DeliveryTimeViewSet)
router.register(r"reviews", ReviewViewSet, basename="review")
router.register(r"orders", OrderViewSet, basename="order")

urlpatterns = [
    # Produkte (RESTful über Router)
    path("", include(router.urls)),

    # Cart-API
    path("cart/", CartView.as_view(), name="cart"),

    # Neue Variante mit Attributen (POST ohne ID in URL, Body enthält alles)
    path("cart/add/", AddToCartView.as_view(), name="add_to_cart_new"),
    path("cart/remove/", RemoveFromCartView.as_view(), name="remove_from_cart_new"),
    path("cart/update/", UpdateCartItemView.as_view(), name="update_cart_item_new"),

    # Alte Variante (nur Produkt-ID in URL, ohne Attribute)
    path("cart/add/<int:product_id>/", AddToCartView.as_view(), name="add_to_cart"),
    path("cart/remove/<int:product_id>/", RemoveFromCartView.as_view(), name="remove_from_cart"),
    path("cart/update/<int:product_id>/", UpdateCartItemView.as_view(), name="update_cart_item"),

    # Bestellung
    path("cart/place-order/", PlaceOrderView.as_view(), name="place-order"),

    # CSRF-Token für Frontend
    path("cart/csrf/", get_csrf_token, name="get-csrf-token"),
]
