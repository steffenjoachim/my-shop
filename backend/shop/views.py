from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.db import transaction
from django.contrib.auth.models import Group
import ast
from urllib.parse import unquote

from .models import (
    Product,
    ProductVariation,
    Category,
    AttributeValue,
    DeliveryTime,
    Review,
    Order,
    OrderItem,
)
from .serializers import (
    ProductSerializer,
    DeliveryTimeSerializer,
    ReviewSerializer,
    OrderSerializer,
)

# ------------------------------------------------------------
# 🟩 Produkte abrufen
# ------------------------------------------------------------
class ProductViewSet(ModelViewSet):
    queryset = Product.objects.select_related("category", "delivery_time").all()
    serializer_class = ProductSerializer


# ------------------------------------------------------------
# 🚚 Lieferzeiten abrufen
# ------------------------------------------------------------
class DeliveryTimeViewSet(ModelViewSet):
    queryset = DeliveryTime.objects.all()
    serializer_class = DeliveryTimeSerializer


# ------------------------------------------------------------
# 💬 Produktbewertungen (Reviews)
# ------------------------------------------------------------
class ReviewViewSet(ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Review.objects.filter(user=user).select_related("product", "user").order_by("-created_at")
        return Review.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        # Sicherstellen, dass nur der Besitzer die Review aktualisieren kann
        instance = self.get_object()
        if instance.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Sie können nur Ihre eigenen Bewertungen bearbeiten.")
        serializer.save()

# ------------------------------------------------------------
# 🟩 Bestellung abschließen & Lagerbestand reduzieren
# ------------------------------------------------------------
@method_decorator(csrf_exempt, name="dispatch")
class PlaceOrderView(APIView):
    """
    POST /api/order/place/

    Erwartet:
    {
        "address": {...},
        "paymentMethod": "paypal",
        "cartItems": [
            {
                "id": 3,
                "quantity": 2,
                "selectedAttributes": {
                    "farbe": "schwarz",
                    "größe": "L"
                },
                "product_image": "...optional..."
            }
        ]
    }
    """

    def post(self, request):
        # ✅ Benutzer muss eingeloggt sein
        if not request.user or not request.user.is_authenticated:
            return Response(
                {"error": "Login erforderlich"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        cart_items = request.data.get("cartItems", [])
        address = request.data.get("address", {})
        payment_method = request.data.get("paymentMethod", "paypal")

        # ✅ Validierung 1: cartItems vorhanden?
        if not cart_items:
            return Response(
                {"error": "cartItems fehlt oder ist leer"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Validierung 2: Adresse korrekt?
        required_fields = ["name", "street", "zip", "city"]
        missing = [f for f in required_fields if not address.get(f)]

        if missing:
            return Response(
                {"error": f"Folgende Felder fehlen: {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():

                # ✅ Bestellung erstellen
                order = Order.objects.create(
                    user=request.user,
                    total=0,
                    paid=False,
                    status="pending",
                    name=address["name"],
                    street=address["street"],
                    zip=address["zip"],
                    city=address["city"],
                    payment_method=payment_method,
                )

                total = 0
                errors = []

                for item in cart_items:
                    pid = item.get("id") or item.get("product")
                    qty = item.get("quantity")
                    selected_attributes = item.get("selectedAttributes", {})

                    # ✅ Validierung pro Produkt
                    if not pid or not qty:
                        errors.append({"item": item, "error": "ID oder quantity fehlt"})
                        continue

                    # ✅ Produkt laden
                    product = Product.objects.filter(pk=pid).first()
                    if not product:
                        errors.append({"id": pid, "error": "Produkt existiert nicht"})
                        continue

                    # ✅ Variante suchen
                    variant = self.find_variant(product, selected_attributes)
                    if not variant:
                        errors.append({
                            "product": product.title,
                            "selected": selected_attributes,
                            "error": "Keine passende Variante gefunden"
                        })
                        continue

                    # ✅ Lager prüfen
                    if (variant.stock or 0) < qty:
                        errors.append({
                            "product": product.title,
                            "lager": variant.stock,
                            "gewünscht": qty,
                            "error": "Nicht genug Lagerbestand"
                        })
                        continue

                    # ✅ Bestand reduzieren
                    variant.stock -= qty
                    variant.save(update_fields=["stock"])

                    # ✅ Bild wählen
                    image = item.get("product_image")
                    if not image:
                        if product.main_image:
                            image = request.build_absolute_uri(product.main_image.url)
                        elif product.external_image:
                            image = unquote(product.external_image).lstrip("/")

                    # ✅ Order Item erstellen
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        variation=variant,
                        product_title=product.title,
                        product_image=image,
                        price=product.price,
                        quantity=qty,
                    )

                    total += float(product.price) * qty

                # ✅ Total aktualisieren
                order.total = total
                order.save()

                # ✅ Wenn Fehler → Bestellprozess abbrechen
                if errors:
                    transaction.set_rollback(True)
                    return Response(
                        {"error": "Bestellung konnte nicht abgeschlossen werden", "details": errors},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # ✅ Erfolg
                return Response(
                    {"message": "Bestellung erfolgreich erstellt", "order_id": order.id},
                    status=status.HTTP_201_CREATED
                )

        except Exception as exc:
            return Response(
                {"error": "Interner Fehler", "details": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ✅ Verbesserte Variantensuche
    def find_variant(self, product, selected_attributes: dict):
        """
        Vergleicht ausgewählte Attribute des Frontends mit der Variantentabelle im Backend.
        Vergleich ist case-insensitive und whitespace-insensitive.
        """

        if not selected_attributes:
            return None

        selected_norm = {
            str(k).strip().lower(): str(v).strip().lower()
            for k, v in selected_attributes.items()
        }

        for variant in product.variations.prefetch_related("attributes__attribute_type"):
            variant_attrs = {
                a.attribute_type.name.strip().lower(): a.value.strip().lower()
                for a in variant.attributes.all()
            }

            if variant_attrs == selected_norm:
                return variant

        return None

# ------------------------------------------------------------
# 🧾 Bestellungen anzeigen
# ------------------------------------------------------------
class OrderViewSet(ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=["patch"], url_path="cancel")
    def cancel(self, request, pk=None):
        """
        PATCH /api/orders/{pk}/cancel/
        Setzt status auf 'cancelled' falls Berechtigung und order pending ist.
        """
        order = self.get_object()

        # einfache Berechtigungsprüfung: Eigentümer oder staff
        if not (request.user.is_authenticated and (request.user == order.user or request.user.is_staff)):
            return Response({"error": "Kein Zugriff"}, status=status.HTTP_403_FORBIDDEN)

        if order.status != "pending":
            return Response({"error": "Bestellung kann nicht storniert werden"}, status=status.HTTP_400_BAD_REQUEST)

        order.status = "cancelled"
        order.save(update_fields=["status"])

        ser = OrderSerializer(order, context={"request": request})
        return Response(ser.data, status=status.HTTP_200_OK)

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return (
                Order.objects.filter(user=user)
                .prefetch_related("items__product")
                .select_related("user")
                .order_by("-created_at")
            )
        return Order.objects.none()

    def retrieve(self, request, *args, **kwargs):
        user = request.user
        order = get_object_or_404(Order, pk=kwargs["pk"])
        if order.user != user:
            raise PermissionDenied("Du hast keinen Zugriff auf diese Bestellung.")
        serializer = self.get_serializer(order, context={"request": request})
        return Response(serializer.data, status=200)


# ------------------------------------------------------------
# 🚚 Shipping-Mitarbeiter: Bestellungen verwalten
# ------------------------------------------------------------
def is_shipping_staff(user):
    """Prüft, ob der User in der 'shipping' Group ist."""
    if not user or not user.is_authenticated:
        return False
    return user.groups.filter(name="shipping").exists()


class ShippingOrderViewSet(ModelViewSet):
    """
    ViewSet für Shipping-Mitarbeiter.
    Zeigt nur relevante Orders (pending / ready_to_ship) an.
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    visible_statuses = ("pending", "ready_to_ship")

    def get_queryset(self):
        user = self.request.user
        if not is_shipping_staff(user):
            return Order.objects.none()
        
        queryset = (
            Order.objects.filter(status__in=self.visible_statuses)
            .prefetch_related("items__product")
            .select_related("user")
            .order_by("-created_at")
        )
        
        # Suche nach Auftragsnummer
        search = self.request.query_params.get("search", None)
        if search:
            try:
                order_id = int(search)
                queryset = queryset.filter(id=order_id)
            except ValueError:
                # Wenn keine Zahl, dann keine Ergebnisse
                queryset = queryset.none()
        
        return queryset

    def update(self, request, *args, **kwargs):
        """Status- und Versand-Updates für Shipping-Mitarbeiter."""
        if not is_shipping_staff(request.user):
            raise PermissionDenied("Nur Shipping-Mitarbeiter können Bestellungen aktualisieren.")

        order = self.get_object()
        payload = request.data or {}

        new_status = payload.get("status", order.status)
        valid_statuses = [choice[0] for choice in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Ungültiger Status. Erlaubt: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        carrier_key_present = "shipping_carrier" in payload
        tracking_key_present = "tracking_number" in payload

        carrier_raw = payload.get("shipping_carrier")
        tracking_raw = payload.get("tracking_number")

        carrier = (
            str(carrier_raw).strip().lower()
            if carrier_raw not in (None, "")
            else None
        )
        tracking_number = (
            str(tracking_raw).strip()
            if tracking_raw is not None
            else None
        )
        tracking_number = tracking_number or None

        allowed_carriers = [choice[0] for choice in Order.SHIPPING_CARRIER_CHOICES]
        if carrier_key_present and carrier is not None and carrier not in allowed_carriers:
            return Response(
                {
                    "error": (
                        "Ungültiger Versanddienst. Erlaubt: "
                        f"{', '.join(dict(Order.SHIPPING_CARRIER_CHOICES).values())}"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        requires_shipping_data = new_status in ("ready_to_ship", "shipped")
        existing_carrier = carrier if carrier_key_present else order.shipping_carrier
        existing_tracking = (
            tracking_number if tracking_key_present else order.tracking_number
        )

        if requires_shipping_data and not existing_carrier:
            return Response(
                {
                    "error": (
                        "Bitte wählen Sie einen Versanddienst, um den Status "
                        "'Versandbereit' oder 'Versandt' zu setzen."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if requires_shipping_data and not existing_tracking:
            return Response(
                {
                    "error": (
                        "Bitte hinterlegen Sie eine Tracking-Nummer, "
                        "um den Versandstatus zu aktualisieren."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        fields_to_update = []
        if new_status != order.status:
            order.status = new_status
            fields_to_update.append("status")

        if carrier_key_present:
            order.shipping_carrier = carrier
            fields_to_update.append("shipping_carrier")

        if tracking_key_present:
            order.tracking_number = tracking_number
            fields_to_update.append("tracking_number")

        # Falls keine expliziten neuen Felder gesendet wurden, aber Status Shipping-Daten erfordert,
        # wurden oben bereits Fehlermeldungen geworfen falls Daten fehlen.
        if fields_to_update:
            order.save(update_fields=fields_to_update)
        elif requires_shipping_data and not fields_to_update:
            # Status unverändert, aber ggf. vorhandene Daten schon gesetzt -> nichts zu speichern
            pass

        serializer = self.get_serializer(order, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        """PATCH-Update für Status-Änderung."""
        return self.update(request, *args, **kwargs)


# ------------------------------------------------------------
# 🔐 CSRF Cookie
# ------------------------------------------------------------
@ensure_csrf_cookie
def get_csrf_token(request):
    token = get_token(request)
    return JsonResponse({"csrfToken": token}, status=200)
