from django.shortcuts import get_object_or_404
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action

from .models import (
    Product,
    DeliveryTime,
    Review,
    Order,
    OrderItem,
    OrderReturn,
)
from .serializers import (
    ProductSerializer,
    DeliveryTimeSerializer,
    ReviewSerializer,
    OrderSerializer,
    OrderReturnSerializer,
)


# ✅ PRODUKTE (nur lesen)
class ProductViewSet(ModelViewSet):
    queryset = Product.objects.select_related("category", "delivery_time")
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    http_method_names = ["get"]


# ✅ LIEFERZEITEN
class DeliveryTimeViewSet(ModelViewSet):
    queryset = DeliveryTime.objects.all()
    serializer_class = DeliveryTimeSerializer
    permission_classes = [permissions.AllowAny]
    http_method_names = ["get"]


# ✅ REVIEWS
class ReviewViewSet(ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Review.objects.filter(approved=True).select_related("product", "user")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ✅ BESTELLUNG ABSCHLIESSEN
class PlaceOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        cart_items = request.data.get("cartItems", [])

        if not cart_items:
            return Response({"error": "Warenkorb leer"}, status=400)

        with transaction.atomic():
            order = Order.objects.create(
                user=request.user,
                total=0,
                paid=False,
                status="pending",
            )

            total = 0

            for item in cart_items:
                pid = item["id"]
                qty = item["quantity"]

                product = Product.objects.get(pk=pid)

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_title=product.title,
                    price=product.price,
                    quantity=qty,
                )

                total += float(product.price) * qty

            order.total = total
            order.save()

            return Response(
                {"message": "Bestellung erstellt", "order_id": order.id},
                status=201
            )


# ✅ USER BESTELLUNGEN
class OrderViewSet(ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related("items")

    # ✅ BESTELLUNG STORNIEREN
    @action(detail=True, methods=["patch"])
    def cancel(self, request, pk=None):
        order = self.get_object()

        if order.status != "pending":
            return Response(
                {"error": "Nicht mehr stornierbar"},
                status=400
            )

        order.status = "cancelled"
        order.save()

        return Response(OrderSerializer(order).data)

    # ✅ RETOUR ANLEGEN
    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def request_return(self, request, pk=None):
        order = self.get_object()
        user = request.user

        item_id = request.data.get("item_id")
        reason = request.data.get("reason")
        other_reason = request.data.get("other_reason", "")
        comments = request.data.get("comments", "")

        if not item_id or not reason:
            return Response(
                {"error": "Ungültige Retourdaten"},
                status=400
            )

        item = get_object_or_404(
            OrderItem,
            pk=item_id,
            order=order
        )

        retour = OrderReturn.objects.create(
            order=order,
            item=item,
            user=user,
            reason=reason,
            other_reason=other_reason if reason == "sonstiges" else "",
            comments=comments,
        )

        serializer = OrderReturnSerializer(retour)
        return Response(serializer.data, status=201)


# ✅ SHIPPING: ALLE BESTELLUNGEN FÜR VERSAND
class ShippingOrdersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # ✅ Nur Shipping-Mitarbeiter
        if not request.user.groups.filter(name="shipping").exists():
            return Response({"detail": "Nicht erlaubt"}, status=403)

        orders = Order.objects.exclude(status="cancelled").order_by("-created_at")
        serializer = OrderSerializer(orders, many=True, context={"request": request})
        return Response(serializer.data)


# ✅ CSRF TOKEN (für Angular Login & POST Requests)
def get_csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})
