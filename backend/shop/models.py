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

    # ✅ fehlerhafte slug-Zeile ENTFERNT
    def __str__(self):
        return f"{self.name} ({self.min_days}-{self.max_days} Tage)"


class Product(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=False, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    main_image = models.ImageField(upload_to="products/", blank=True, null=True)
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

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # ✅ Automatische Slug-Generierung
        if not self.slug:
            generated = slugify(self.title)
            self.slug = generated or f"product-{self.id or ''}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    @property
    def image_url(self):
        """Gibt das korrekte Bild zurück — lokal oder extern."""
        if self.main_image:
            return self.main_image.url
        if self.external_image:
            return self.external_image
        return "/media/default.png"

    @property
    def stock_total(self):
        return sum((v.stock or 0) for v in self.variations.all())


class ProductImage(models.Model):
    """Zusätzliche Bilder zu einem Produkt"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")

    def __str__(self):
        return f"Image for {self.product.title}"


class AttributeType(models.Model):
    """Art des Attributs (z. B. Farbe, Größe)"""
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class AttributeValue(models.Model):
    """Möglicher Wert eines Attributs (z. B. Rot, M, XL)"""
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
        """Ein stabiler Key für Varianten-Vergleiche."""
        return "|".join([f"{k}:{v}" for k, v in self.attributes_dict.items()])


class Order(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("shipped", "Shipped"),
        ("cancelled", "Cancelled"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    created_at = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    paid = models.BooleanField(default=False)

    # 🏠 Liefer-/Rechnungsadresse
    name = models.CharField(max_length=150, blank=True, null=True)
    street = models.CharField(max_length=200, blank=True, null=True)
    zip = models.CharField(max_length=20, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)

    # 💳 Zahlungsart
    payment_method = models.CharField(max_length=50, default="paypal")

    def __str__(self):
        return f"Order #{self.pk} by {self.user}"


class OrderItem(models.Model):
    """Einzelposition in einer Bestellung (inkl. Produktdaten zum Zeitpunkt der Bestellung)"""
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
    """Produktbewertung (1-5 Sterne)"""
    product = models.ForeignKey(Product, related_name="reviews", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="product_reviews")
    order = models.ForeignKey(Order, null=True, blank=True, on_delete=models.SET_NULL)
    rating = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)
    approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

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

    if product.rating_count != cnt or float(product.rating_avg) != float(avg):
        product.rating_count = cnt
        product.rating_avg = round(float(avg) if avg is not None else 0.0, 2)
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
