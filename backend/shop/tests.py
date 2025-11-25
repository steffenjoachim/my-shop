from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Order


class ShippingOrderViewSetTests(TestCase):
    """Verifiziert Status-/Versandupdates für Shipping-Mitarbeiter."""

    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="shipper",
            email="shipper@example.com",
            password="secret123",
        )
        shipping_group, _ = Group.objects.get_or_create(name="shipping")
        self.user.groups.add(shipping_group)

        self.client = APIClient()
        self.client.force_authenticate(self.user)

        self.order = Order.objects.create(
            user=self.user,
            total=Decimal("99.90"),
            paid=True,
            status="pending",
            name="Max Mustermann",
            street="Musterstr. 1",
            zip="12345",
            city="Berlin",
            payment_method="paypal",
        )

    def test_ready_to_ship_requires_shipping_information(self):
        """Status 'ready_to_ship' darf nicht ohne Versanddaten gesetzt werden."""
        url = reverse("shipping-order-detail", args=[self.order.id])
        response = self.client.patch(url, {"status": "ready_to_ship"}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("Versanddienst", response.data["error"])
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "pending")

    def test_ready_to_ship_with_shipping_information_succeeds(self):
        """Mit Carrier + Tracking kann der Status erfolgreich gesetzt werden."""
        url = reverse("shipping-order-detail", args=[self.order.id])
        payload = {
            "status": "ready_to_ship",
            "shipping_carrier": "dhl",
            "tracking_number": "DHL-123456789",
        }

        response = self.client.patch(url, payload, format="json")

        self.assertEqual(response.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "ready_to_ship")
        self.assertEqual(self.order.shipping_carrier, "dhl")
        self.assertEqual(self.order.tracking_number, "DHL-123456789")
