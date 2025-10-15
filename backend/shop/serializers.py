from rest_framework import serializers
from .models import (
    Product,
    Category,
    ProductImage,
    AttributeType,
    AttributeValue,
    ProductVariation,
)


# ------------------------------------------------------------
# 🖼️ Produktbilder
# ------------------------------------------------------------
class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image"]

    def get_image(self, obj):
        """
        Sorgt dafür, dass externe und lokale Bilder korrekt angezeigt werden.
        """
        if not obj.image:
            return None
        url = str(obj.image)
        if url.startswith("https:/") and not url.startswith("https://"):
            url = url.replace("https:/", "https://")
        if url.startswith("http://") or url.startswith("https://"):
            return url
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


# ------------------------------------------------------------
# 🎨 Attributwerte (z. B. Farbe: Rot)
# ------------------------------------------------------------
class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_type = serializers.StringRelatedField()

    class Meta:
        model = AttributeValue
        fields = ["id", "value", "attribute_type"]


# ------------------------------------------------------------
# 🧩 Produktvariationen (z. B. T-Shirt Rot M, Bestand)
# ------------------------------------------------------------
class ProductVariationSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True, read_only=True)
    stock = serializers.IntegerField()

    class Meta:
        model = ProductVariation
        fields = ["id", "attributes", "stock"]


# ------------------------------------------------------------
# 🏷️ Kategorie
# ------------------------------------------------------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


# ------------------------------------------------------------
# 🛍️ Produkt
# ------------------------------------------------------------
class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variations = ProductVariationSerializer(many=True, read_only=True)
    main_image = serializers.SerializerMethodField()
    external_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "description",
            "price",
            "category",
            "main_image",
            "external_image",
            "images",
            "variations",
            "delivery_time",
        ]

    def get_main_image(self, obj):
        """
        Korrigiert URLs, sodass auch externe Bilder mit 'https' korrekt angezeigt werden.
        """
        if not obj.main_image and obj.external_image:
            return obj.external_image

        if obj.main_image:
            url = str(obj.main_image)
            if url.startswith("https:/") and not url.startswith("https://"):
                url = url.replace("https:/", "https://")
            if url.startswith("http://") or url.startswith("https://"):
                return url
            request = self.context.get("request")
            return request.build_absolute_uri(obj.main_image.url) if request else obj.main_image.url

        return None

    def get_external_image(self, obj):
        """
        Gibt saubere externe Bild-URLs zurück (ohne 404 im Backend).
        """
        if obj.external_image:
            url = str(obj.external_image)
            if url.startswith("https:/") and not url.startswith("https://"):
                url = url.replace("https:/", "https://")
            return url
        return None
