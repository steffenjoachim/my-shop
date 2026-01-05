from django.db.models import Prefetch
from rest_framework import viewsets, permissions, status, generics, views
from django.utils import timezone
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from decimal import Decimal

from .models import (
    Product,
    DeliveryTime,
    Review,
    Order,
    OrderItem,
    OrderReturn,   # original class name in models
    ReturnRequest, # alias you added
    Category,
)
from .serializers import (
    ProductSerializer,
    CategorySerializer,
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


# --- Categories ---
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


# --- Simple PlaceOrderView stub (implement real logic later) ---
class PlaceOrderView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Create an Order and its OrderItems from frontend payload.

        Expected payload shape:
        {
            "cartItems": [{"product": <id>, "quantity": <int>, "product_image": "...", ...}, ...],
            "address": {"name":"","street":"","zip":"","city":""},
            "paymentMethod": "paypal"|"creditcard"|"invoice"
        }
        """

        user = request.user
        data = request.data or {}
        cart_items = data.get("cartItems") or []

        if not cart_items:
            return Response({"error": "cartItems is required."}, status=status.HTTP_400_BAD_REQUEST)

        address = data.get("address", {})
        payment_method = data.get("paymentMethod", "paypal")

        total = Decimal("0.00")
        products_cache = {}

        # Calculate total and load products
        for it in cart_items:
            pid = it.get("product")
            qty = int(it.get("quantity", 1) or 1)
            if not pid:
                return Response({"error": "product id missing in cart item."}, status=status.HTTP_400_BAD_REQUEST)

            if pid not in products_cache:
                try:
                    products_cache[pid] = Product.objects.get(pk=pid)
                except Product.DoesNotExist:
                    return Response({"error": f"Product {pid} not found."}, status=status.HTTP_400_BAD_REQUEST)

            prod = products_cache[pid]
            price = Decimal(str(prod.price))
            total += price * qty

        # Create order
        order = Order.objects.create(
            user=user,
            name=address.get("name"),
            street=address.get("street"),
            zip=address.get("zip"),
            city=address.get("city"),
            payment_method=payment_method,
            total=total,
            paid=(payment_method in ("paypal", "creditcard")),
            status=("paid" if payment_method in ("paypal", "creditcard") else "pending"),
        )

        # Create items
        for it in cart_items:
            pid = it.get("product")
            qty = int(it.get("quantity", 1) or 1)
            prod = products_cache[pid]
            OrderItem.objects.create(
                order=order,
                product=prod,
                product_title=prod.title,
                product_image=it.get("product_image") or prod.main_image,
                price=prod.price,
                quantity=qty,
            )

        serializer = OrderSerializer(order, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


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
        # Alle Retouren abrufen (inkl. abgelehnte), damit diese im Tab "Geschlossene Retouren" angezeigt werden
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
        Sendet eine E-Mail-Benachrichtigung an den Kunden, wenn die Retour eingetroffen ist.
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

        # Wenn Status auf "rejected" gesetzt wird, Ablehnungsgrund validieren
        if new_status == "rejected":
            rejection_reason = request.data.get("rejection_reason")
            if not rejection_reason:
                return Response(
                    {"error": "Ablehnungsgrund ist erforderlich."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Valide Ablehnungsgründe prüfen
            valid_rejection_reasons = [choice[0] for choice in ReturnRequest.REJECTION_REASON_CHOICES]
            if rejection_reason not in valid_rejection_reasons:
                return Response(
                    {"error": f"Ungültiger Ablehnungsgrund. Erlaubt: {', '.join(valid_rejection_reasons)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Wenn "sonstiges" gewählt wurde, muss ein Kommentar vorhanden sein
            if rejection_reason == "sonstiges":
                rejection_comment = request.data.get("rejection_comment", "").strip()
                if not rejection_comment:
                    return Response(
                        {"error": "Bei 'Sonstiges' ist eine Erläuterung erforderlich."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Ablehnungsgrund speichern
            obj.rejection_reason = rejection_reason
            obj.rejection_comment = request.data.get("rejection_comment", "").strip() or None
            # Zeitpunkt der Ablehnung setzen
            obj.rejection_date = timezone.now()

        old_status = obj.status
        obj.status = new_status
        obj.save()

        # Debug-Ausgabe
        print(f"\n[DEBUG] Status-Update: Retour #{obj.id}")
        print(f"[DEBUG] Alter Status: {old_status}")
        print(f"[DEBUG] Neuer Status: {new_status}")
        print(f"[DEBUG] Soll E-Mail gesendet werden? {new_status == 'approved' and old_status != 'approved'}\n")

        # E-Mail-Benachrichtigung senden
        if new_status == "approved" and old_status != "approved":
            print("[DEBUG] E-Mail-Funktion wird aufgerufen (Genehmigung)...")
            try:
                from .services.email_service import send_return_approval_email
                send_return_approval_email(obj)
                print("[DEBUG] E-Mail-Funktion erfolgreich aufgerufen.")
            except Exception as e:
                print(f"[DEBUG] Fehler beim Aufruf der E-Mail-Funktion: {e}")
                import traceback
                traceback.print_exc()
        elif new_status == "rejected" and old_status != "rejected":
            print("[DEBUG] E-Mail-Funktion wird aufgerufen (Ablehnung)...")
            try:
                from .services.email_service import send_return_rejection_email
                send_return_rejection_email(obj)
                print("[DEBUG] E-Mail-Funktion erfolgreich aufgerufen.")
            except Exception as e:
                print(f"[DEBUG] Fehler beim Aufruf der E-Mail-Funktion: {e}")
                import traceback
                traceback.print_exc()
        elif new_status == "received" and old_status != "received":
            print("[DEBUG] E-Mail-Funktion wird aufgerufen (Retour eingetroffen)...")
            try:
                from .services.email_service import send_return_received_email
                send_return_received_email(obj)
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