from rest_framework import serializers
from .models import (
    Product,
    Category,
    ProductImage,
    AttributeType,
    AttributeValue,
    ProductAttribute,
)


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image"]

    def get_image(self, obj):
        url = str(obj.image)

        # 🩹 Automatische Korrektur bei https:/ statt https://
        if url.startswith("https:/") and not url.startswith("https://"):
            url = url.replace("https:/", "https://")

        # Externe URLs direkt durchlassen
        if url.startswith("http://") or url.startswith("https://"):
            return url

        # Lokale Datei → absolute URL erzeugen
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


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
        fields = ["id", "value", "stock"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    main_image = serializers.SerializerMethodField()
    product_attributes = ProductAttributeSerializer(many=True, read_only=True)
    stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "description",
            "price",
            "main_image",
            "category",
            "images",
            "product_attributes",
            "stock",
        ]

    def get_stock(self, obj):
        """Summiert den Bestand über alle Varianten."""
        return sum(attr.stock or 0 for attr in obj.product_attributes.all())

    def get_main_image(self, obj):
        url = str(obj.main_image)

        if url.startswith("https:/") and not url.startswith("https://"):
            url = url.replace("https:/", "https://")

        if url.startswith("http://") or url.startswith("https://"):
            return url

        if obj.main_image:
            request = self.context.get("request")
            return (
                request.build_absolute_uri(obj.main_image.url)
                if request
                else obj.main_image.url
            )

        return None
