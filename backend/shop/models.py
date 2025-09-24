from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class AttributeType(models.Model):
    category = models.ForeignKey(
        Category,
        related_name="attribute_types",
        on_delete=models.CASCADE
    )
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ("category", "name")

    def __str__(self):
        return f"{self.category.name} - {self.name}"


class AttributeValue(models.Model):
    attribute_type = models.ForeignKey(
        AttributeType,
        related_name="values",
        on_delete=models.CASCADE
    )
    value = models.CharField(max_length=100)

    class Meta:
        unique_together = ("attribute_type", "value")

    def __str__(self):
        return f"{self.attribute_type.name}: {self.value}"


class Product(models.Model):
    category = models.ForeignKey(
        Category,
        related_name="products",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField()

    # Hauptbild (optional)
    main_image = models.URLField(blank=True)

    def __str__(self):
        return self.title


class ProductAttribute(models.Model):
    product = models.ForeignKey(
        Product,
        related_name="attributes",
        on_delete=models.CASCADE
    )
    value = models.ForeignKey(
        AttributeValue,
        related_name="product_attributes",
        on_delete=models.CASCADE
    )

    def __str__(self):
        return f"{self.product.title}: {self.value}"


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        related_name="images",
        on_delete=models.CASCADE
    )
    image = models.URLField()
    is_primary = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "is_primary"],
                condition=models.Q(is_primary=True),
                name="unique_primary_image_per_product"
            )
        ]

    def __str__(self):
        return f"Image for {self.product.title}"
