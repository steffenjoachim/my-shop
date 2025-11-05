from rest_framework import serializers
from urllib.parse import unquote

from .models import (
    Product,
    Category,
    ProductImage,
    AttributeType,
    AttributeValue,
    ProductVariation,
    DeliveryTime,
    Review,
    Order,
    OrderItem,
)

# ============================================================
# 🖼️ Produktbilder
# ============================================================

class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image"]

    def get_image(self, obj):
        if not obj.image:
            return None

        request = self.context.get("request")
        url = obj.image.url

        return request.build_absolute_uri(url) if request else url


# ============================================================
# 🎨 Attribute (Farbe, Größe)
# ============================================================

class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_type = serializers.StringRelatedField()

    class Meta:
        model = AttributeValue
        fields = ["id", "value", "attribute_type"]


# ============================================================
# 🧩 Produktvariationen
# ============================================================

class ProductVariationSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True)

    class Meta:
        model = ProductVariation
        fields = ["id", "attributes", "stock"]


# ============================================================
# 🏷️ Kategorie
# ============================================================

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


# ============================================================
# 🚚 Lieferzeit
# ============================================================

class DeliveryTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryTime
        fields = ["id", "name", "min_days", "max_days", "is_default"]


# ============================================================
# 🛍️ Produkt
# ============================================================

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variations = ProductVariationSerializer(many=True, read_only=True)
    delivery_time = DeliveryTimeSerializer(read_only=True)

    # ✅ Wichtig: eigene korrekt berechnete Felder
    main_image = serializers.SerializerMethodField()
    external_image = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    rating_avg = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    rating_count = serializers.IntegerField(read_only=True)
    recent_reviews = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "price",
            "category",
            "main_image",
            "external_image",
            "image_url",           # ✅ wichtigste Ausgabe!
            "images",
            "variations",
            "delivery_time",
            "rating_avg",
            "rating_count",
            "recent_reviews",
        ]

    # ✅ Bild #1: Hauptbild aus MEDIA
    def get_main_image(self, obj):
        if not obj.main_image:
            return None

        request = self.context.get("request")

        try:
            url = obj.main_image.url
        except:
            return None

        return request.build_absolute_uri(url) if request else url

    # ✅ Bild #2: externe URL immer korrekt ohne "/"
    def get_external_image(self, obj):
        if not obj.external_image:
            return None

        url = str(obj.external_image).lstrip("/")
        return url

    # ✅ Bild #3: universelle Bildausgabe → Angular nutzt dieses Feld!
    def get_image_url(self, obj):

        # Vorrang 1: Lokales Bild
        if obj.main_image:
            try:
                return obj.main_image.url
            except:
                pass

        # Vorrang 2: Externes Bild
        if obj.external_image:
            url = str(obj.external_image).lstrip("/")
            return url

        # Fallback
        return None

    def get_recent_reviews(self, obj):
        qs = obj.reviews.filter(approved=True).order_by("-created_at")[:3]
        return ReviewSerializer(qs, many=True).data


# ============================================================
# 🗨️ Bewertungen
# ============================================================

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = Review
        fields = [
            "id",
            "product",
            "user",
            "rating",
            "title",
            "body",
            "approved",
            "created_at"
        ]
        read_only_fields = ["id", "user", "approved", "created_at"]


# ============================================================
# 🧾 Bestellung → Einzelposition
# ============================================================

class OrderItemSerializer(serializers.ModelSerializer):
    variation_details = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "variation",
            "variation_details",
            "product_title",
            "product_image",
            "price",
            "quantity",
        ]

    def get_variation_details(self, obj):
        if not obj.variation:
            return None

        return {
            "id": obj.variation.id,
            "attributes": AttributeValueSerializer(obj.variation.attributes.all(), many=True).data,
        }


# ============================================================
# 🧾 Bestellung (lesen)
# ============================================================

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    user = serializers.StringRelatedField()

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "created_at",
            "total",
            "status",
            "paid",
            "name",
            "street",
            "zip",
            "city",
            "payment_method",
            "items",
        ]
