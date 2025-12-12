from django.db import models
from django.conf import settings
from django.db.models import Avg, Count
from django.dispatch import receiver
from django.db.models.signals import post_save, post_delete
from django.utils.text import slugify


class Category(models.Model):
    """Produktkategorie (z. B. Kleidung, Elektronik etc.)"""
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class DeliveryTime(models.Model):
    name = models.CharField(max_length=100)
    min_days = models.PositiveIntegerField()
    max_days = models.PositiveIntegerField()
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.min_days}-{self.max_days} Tage)"


class Product(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=False, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    # SPEICHERUNG als CharField → KEIN .url !!!
    main_image = models.CharField(max_length=500, blank=True, null=True)
    external_image = models.URLField(blank=True, null=True)

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name="products"
    )
    delivery_time = models.ForeignKey(
        DeliveryTime,
        on_delete=models.SET_NULL,
        null=True,
        related_name="products"
    )

    # Bewertungsfelder
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    rating_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            generated = slugify(self.title)
            self.slug = generated or f"product-{self.id or ''}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    @property
    def image_url(self):
        """
        Gibt eine korrekte Bild-URL zurück,
        egal ob main_image ein relativer Pfad oder eine vollständige URL ist.
        """

        # Vollständige URL?
        if self.main_image and (
            self.main_image.startswith("http://")
            or self.main_image.startswith("https://")
        ):
            return self.main_image

        # Lokaler Pfad wie "products/img1.jpg" oder "/media/img1.jpg"
        if self.main_image:
            if self.main_image.startswith("/"):
                return self.main_image  # schon ein vollständiger Pfad
            return f"{settings.MEDIA_URL}{self.main_image}"

        # Externes Bild
        if self.external_image:
            return self.external_image

        # Fallback
        return "/media/default.png"

    @property
    def stock_total(self):
        return sum((v.stock or 0) for v in self.variations.all())


class ProductImage(models.Model):
    """Zusätzliche Bilder zu einem Produkt"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")

    # Wieder CharField → KEIN .url !!!
    image = models.CharField(max_length=500)

    def __str__(self):
        return f"Image for {self.product.title}"

    @property
    def image_url(self):
        """Wie beim Produkt — volle oder relative URL korrekt zurückgeben"""

        if self.image.startswith("http://") or self.image.startswith("https://"):
            return self.image

        if self.image.startswith("/"):
            return self.image

        return f"{settings.MEDIA_URL}{self.image}"


class AttributeType(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class AttributeValue(models.Model):
    attribute_type = models.ForeignKey(AttributeType, on_delete=models.CASCADE, related_name="values")
    value = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.attribute_type.name}: {self.value}"


class ProductVariation(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="variations"
    )
    attributes = models.ManyToManyField(AttributeValue, related_name="variations")
    stock = models.PositiveIntegerField(default=0)

    def __str__(self):
        attrs = ", ".join([f"{a.attribute_type.name}: {a.value}" for a in self.attributes.all()])
        return f"{self.product.title} ({attrs})"

    @property
    def attributes_dict(self):
        return {
            a.attribute_type.name.lower(): a.value.lower()
            for a in self.attributes.all()
        }

    @property
    def is_in_stock(self):
        return self.stock > 0

    @property
    def variation_key(self):
        return "|".join([f"{k}:{v}" for k, v in self.attributes_dict.items()])


class Order(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("ready_to_ship", "Versandbereit"),
        ("shipped", "Versandt"),
        ("cancelled", "Storniert"),
    )

    SHIPPING_CARRIER_CHOICES = (
        ("dhl", "DHL"),
        ("hermes", "Hermes"),
        ("ups", "UPS"),
        ("post", "Deutsche Post"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    created_at = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    paid = models.BooleanField(default=False)

    name = models.CharField(max_length=150, blank=True, null=True)
    street = models.CharField(max_length=200, blank=True, null=True)
    zip = models.CharField(max_length=20, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)

    payment_method = models.CharField(max_length=50, default="paypal")
    shipping_carrier = models.CharField(
        max_length=20,
        choices=SHIPPING_CARRIER_CHOICES,
        blank=True,
        null=True,
    )
    tracking_number = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Order #{self.pk} by {self.user}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variation = models.ForeignKey(ProductVariation, null=True, blank=True, on_delete=models.PROTECT)

    product_title = models.CharField(max_length=200, blank=True, null=True)
    product_image = models.CharField(max_length=500, blank=True, null=True)

    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.quantity} × {self.product_title} (Order #{self.order_id})"


class Review(models.Model):
    product = models.ForeignKey(Product, related_name="reviews", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="product_reviews")
    order = models.ForeignKey(Order, null=True, blank=True, on_delete=models.SET_NULL)
    rating = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)
    approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["product", "rating"]),
        ]

    def __str__(self):
        return f"Review {self.rating}★ for {self.product.title} by {self.user}"


def _recalculate_product_rating(product: Product):
    agg = product.reviews.filter(approved=True).aggregate(
        avg=Avg("rating"),
        cnt=Count("id")
    )
    avg = agg["avg"] or 0
    cnt = agg["cnt"] or 0

    product.rating_count = cnt
    product.rating_avg = round(float(avg), 2)
    product.save(update_fields=["rating_avg", "rating_count"])


@receiver(post_save, sender=Review)
def review_saved(sender, instance: Review, **kwargs):
    try:
        _recalculate_product_rating(instance.product)
    except Exception:
        pass


@receiver(post_delete, sender=Review)
def review_deleted(sender, instance: Review, **kwargs):
    try:
        _recalculate_product_rating(instance.product)
    except Exception:
        pass
    
class OrderReturn(models.Model):
    REASON_CHOICES = (
        ("defekt", "Defekt / beschädigt"),
        ("falscher_artikel", "Falscher Artikel"),
        ("falsche_groesse", "Falsche Größe"),
        ("nicht_gewuenscht", "Nicht mehr gewünscht"),
        ("sonstiges", "Sonstiges"),
    )

    STATUS_CHOICES = (
        ("pending", "Offen"),
        ("approved", "Genehmigt"),
        ("rejected", "Abgelehnt"),
        ("received", "Eingetroffen"),
        ("refunded", "Erstattet"),
    )
    
    order = models.ForeignKey(
        "Order",                 
        on_delete=models.CASCADE,
        related_name="returns"
    )

    item = models.ForeignKey(
        "OrderItem",             
        on_delete=models.CASCADE,
        related_name="returns"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    other_reason = models.CharField(max_length=255, blank=True, null=True)
    comments = models.TextField(blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Retour #{self.id} für Order #{self.order_id} – {self.status}"
    
# Kompatibilitäts-Alias: ReturnRequest wird an vielen Stellen erwartet
ReturnRequest = OrderReturn