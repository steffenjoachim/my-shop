from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Product(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    main_image = models.ImageField(upload_to="products/", blank=True, null=True)
    external_image = models.URLField(max_length=500, blank=True, null=True)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="products"
    )

    def __str__(self):
        return self.title


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="products/")

    def __str__(self):
        return f"Image for {self.product.title}"


class AttributeType(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class AttributeValue(models.Model):
    value = models.CharField(max_length=50)
    attribute_type = models.ForeignKey(
        AttributeType, on_delete=models.CASCADE, related_name="values"
    )

    def __str__(self):
        return f"{self.attribute_type.name}: {self.value}"


class ProductAttribute(models.Model):
    """
    Bindet ein Produkt an einen Attributwert (z. B. Farbe = Rot, Größe = M)
    und enthält zusätzlich den Lagerbestand.
    """
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="product_attributes"
    )
    value = models.ForeignKey(AttributeValue, on_delete=models.CASCADE)
    stock = models.PositiveIntegerField(default=0)  # ✅ Keine Null-Werte erlaubt

    class Meta:
        unique_together = ("product", "value")

    def __str__(self):
        return f"{self.product.title} - {self.value.value} ({self.stock} Stück)"
