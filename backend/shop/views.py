from django.db.models import Prefetch
from rest_framework import viewsets, permissions, status, generics, views
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from .models import (
    Product,
    DeliveryTime,
    Review,
    Order,
    OrderItem,
    OrderReturn,   # original class name in models
    ReturnRequest, # alias you added
)
from .serializers import (
    ProductSerializer,
    ReviewSerializer,
    OrderSerializer,
    ReturnRequestSerializer,
)


# --- Product ---
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]


# --- DeliveryTime (simple serializer inline to avoid cross-edit) ---
from rest_framework import serializers as _serializers
class DeliveryTimeSerializer(_serializers.ModelSerializer):
    class Meta:
        model = DeliveryTime
        fields = ("id", "name", "min_days", "max_days", "is_default")

class DeliveryTimeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DeliveryTime.objects.all()
    serializer_class = DeliveryTimeSerializer
    permission_classes = [permissions.AllowAny]


# --- Reviews ---
class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


# --- Simple PlaceOrderView stub (implement real logic later) ---
class PlaceOrderView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        # Placeholder: implement real ordering logic later.
        return Response({"detail": "Place order endpoint not implemented in this dev snapshot."},
                        status=status.HTTP_501_NOT_IMPLEMENTED)


# --- CSRF token endpoint used by frontend ---
@api_view(["GET"])
def get_csrf_token(request):
    # The framework will set the cookie; frontend only needs 200
    return Response({"detail": "csrf ok"})


# --- Shipping / Returns views for admin/shipping UI (basic) ---
class ShippingOrdersView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Order.objects.filter(status__in=["ready_to_ship", "paid", "pending"])
        data = OrderSerializer(qs, many=True, context={"request": request}).data
        return Response(data)


class ShippingReturnsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = ReturnRequest.objects.all()
        data = ReturnRequestSerializer(qs, many=True, context={"request": request}).data
        return Response(data)


class ShippingReturnDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk=None):
        try:
            obj = ReturnRequest.objects.get(pk=pk)
        except ReturnRequest.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ReturnRequestSerializer(obj, context={"request": request}).data)

    def patch(self, request, pk=None):
        """
        Aktualisiert den Status einer Retour-Anfrage.
        Sendet eine E-Mail-Benachrichtigung an den Kunden, wenn die Retour genehmigt wird.
        """
        try:
            obj = ReturnRequest.objects.select_related('user', 'order', 'item').get(pk=pk)
        except ReturnRequest.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        # Status-Update validieren
        new_status = request.data.get("status")
        if not new_status:
            return Response(
                {"error": "Status ist erforderlich."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Valide Status-Werte prüfen
        valid_statuses = [choice[0] for choice in ReturnRequest.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Ungültiger Status. Erlaubt: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = obj.status
        obj.status = new_status
        obj.save()

        # Debug-Ausgabe
        print(f"\n[DEBUG] Status-Update: Retour #{obj.id}")
        print(f"[DEBUG] Alter Status: {old_status}")
        print(f"[DEBUG] Neuer Status: {new_status}")
        print(f"[DEBUG] Soll E-Mail gesendet werden? {new_status == 'approved' and old_status != 'approved'}\n")

        # E-Mail-Benachrichtigung senden, wenn Status auf "approved" geändert wird
        if new_status == "approved" and old_status != "approved":
            print("[DEBUG] E-Mail-Funktion wird aufgerufen...")
            try:
                from .services.email_service import send_return_approval_email
                send_return_approval_email(obj)
                print("[DEBUG] E-Mail-Funktion erfolgreich aufgerufen.")
            except Exception as e:
                print(f"[DEBUG] Fehler beim Aufruf der E-Mail-Funktion: {e}")
                import traceback
                traceback.print_exc()

        serializer = ReturnRequestSerializer(obj, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserReturnsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = ReturnRequest.objects.filter(user=request.user)
        data = ReturnRequestSerializer(qs, many=True, context={"request": request}).data
        return Response(data)


# --- Orders (adjusted to use 'returns' related_name / item field) ---
class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Order.objects.all().select_related("user").prefetch_related(
            Prefetch("items"),
            Prefetch("returns"),   # uses related_name defined in OrderReturn
        )
        if not self.request.user.is_staff:
            qs = qs.filter(user=self.request.user)
        return qs

    @action(detail=True, methods=["post"], url_path="request_return")
    def request_return(self, request, pk=None):
        order = self.get_object()

        if not (request.user == order.user or request.user.is_staff):
            raise PermissionDenied("Du kannst nur für eigene Bestellungen Retour beantragen.")

        if order.status != "shipped":
            return Response(
                {"error": "Retour kann nur für versandte Bestellungen beantragt werden."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item_id = request.data.get("item_id")
        reason = request.data.get("reason")
        other_reason = request.data.get("other_reason", "")
        comments = request.data.get("comments", "")

        if not item_id or not reason:
            return Response(
                {"error": "item_id und reason sind erforderlich."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order_item = OrderItem.objects.get(id=item_id, order=order)
        except OrderItem.DoesNotExist:
            return Response(
                {"error": "Artikel nicht in dieser Bestellung gefunden."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_reasons = [choice[0] for choice in ReturnRequest.REASON_CHOICES]
        if reason not in valid_reasons:
            return Response(
                {"error": f"Ungültiger Grund. Erlaubt: {', '.join(valid_reasons)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reason == "sonstiges" and not (other_reason and other_reason.strip()):
            return Response(
                {"error": "Bitte geben Sie einen Grund an, wenn 'Sonstiges' gewählt wurde."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create using the real model field 'item' (OrderReturn defines `item` FK)
        return_request = ReturnRequest.objects.create(
            order=order,
            item=order_item,
            reason=reason,
            other_reason=other_reason.strip() if reason == "sonstiges" else None,
            comments=comments.strip() if comments else None,
            status="pending",
            user=request.user,
        )

        serializer = ReturnRequestSerializer(return_request, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)