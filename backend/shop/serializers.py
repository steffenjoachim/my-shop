from rest_framework import serializers
from .models import Product, Category, ProductImage, ProductVariation


# ------------------------------------------------------------
# 🖼️ Produktbilder
# ------------------------------------------------------------
class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image"]

    def get_image(self, obj):
        url = str(obj.image)
        if url.startswith("https:/") and not url.startswith("https://"):
            url = url.replace("https:/", "https://")
        if url.startswith("http://") or url.startswith("https://"):
            return url
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


# ------------------------------------------------------------
# 🎨 Varianten (Farbe / Größe / Bestand)
# ------------------------------------------------------------
class ProductVariationSerializer(serializers.ModelSerializer):
    color = serializers.CharField(source="color.value", allow_null=True)
    size = serializers.CharField(source="size.value", allow_null=True)
    stock = serializers.IntegerField()

    class Meta:
        model = ProductVariation
        fields = ["id", "color", "size", "stock"]


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
        ]
