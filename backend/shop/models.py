from django.db import models


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

    def save(self, *args, **kwargs):
        if self.is_default:
            DeliveryTime.objects.exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.min_days}-{self.max_days} Tage)"


class Product(models.Model):
    """Hauptprodukt (z. B. T-Shirt)"""
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    main_image = models.ImageField(upload_to="products/", blank=True, null=True)
    external_image = models.URLField(max_length=500, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    delivery_time = models.ForeignKey(
        DeliveryTime,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="products",
    )

    def __str__(self):
        return self.title


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
    """Kombination von Attributen für ein bestimmtes Produkt (z. B. T-Shirt Rot M)"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variations")
    attributes = models.ManyToManyField(AttributeValue, related_name="product_variations")
    stock = models.PositiveIntegerField(default=0)

    def __str__(self):
        attrs = ", ".join([v.value for v in self.attributes.all()])
        return f"{self.product.title} ({attrs}) - {self.stock} Stück"
