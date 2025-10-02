from rest_framework import serializers
from .models import Product, ProductImage, ProductAttribute, AttributeValue, AttributeType

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
        fields = ["id", "value", "stock"]   # ✅ stock hinzugefügt

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image"]

class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
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
            "images",
            "attributes",     # Attribute inkl. stock
        ]
