from rest_framework import serializers
from .models import (
    Product,
    Category,
    ProductImage,
    ProductAttribute,
    AttributeType,
    AttributeValue,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image"]


class AttributeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeType
        fields = ["id", "name"]


class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_type = AttributeTypeSerializer(read_only=True)

    class Meta:
        model = AttributeValue
        fields = ["id", "value", "attribute_type"]


class ProductAttributeSerializer(serializers.ModelSerializer):
    value = AttributeValueSerializer(read_only=True)

    class Meta:
        model = ProductAttribute
        fields = ["id", "value"]


class ProductSerializer(serializers.ModelSerializer):
    # Kategorie wird als Objekt im Response zurückgegeben (read_only)
    category = CategorySerializer(read_only=True)

    # Kategorie kann beim POST/PUT über `category_id` gesetzt werden
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        write_only=True
    )

    # Bilder eines Produkts
    images = ProductImageSerializer(many=True, read_only=True)

    # Attribute des Produkts (z. B. Farben, Größen, ...)
    attributes = ProductAttributeSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "description",
            "price",
            "stock",
            "main_image",
            "category",       # für Ausgabe
            "category_id",    # für Eingabe
            "images",         # zusätzliche Bilder
            "attributes",     # Attribute (Color, Size, ...)
        ]
