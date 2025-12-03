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
    OrderReturn,
)


# -------------------------------------------------------------------
# Hilfsfunktion: sichere request-abhängige URL-Erzeugung für lokale Pfade
# -------------------------------------------------------------------
def _build_media_url(request, path):
    if not path:
        return None
    p = str(path).lstrip("/")
    # externe URL unverändert zurückgeben
    if p.startswith("http://") or p.startswith("https://"):
        return p
    url = "/media/" + p
    return request.build_absolute_uri(url) if request else url


# ----------------------------
# ProductImageSerializer
# ----------------------------
class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image"]

    def get_image(self, obj):
        request = self.context.get("request")
        return _build_media_url(request, obj.image)


# ----------------------------
# AttributeValueSerializer
# ----------------------------
class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_type = serializers.StringRelatedField()

    class Meta:
        model = AttributeValue
        fields = ["id", "value", "attribute_type"]


# ----------------------------
# ProductVariationSerializer
# ----------------------------
class ProductVariationSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True, read_only=True)

    class Meta:
        model = ProductVariation
        fields = ["id", "attributes", "stock"]


# ----------------------------
# CategorySerializer
# ----------------------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


# ----------------------------
# DeliveryTimeSerializer
# ----------------------------
class DeliveryTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryTime
        fields = ["id", "name", "min_days", "max_days", "is_default"]


# ----------------------------
# ProductSerializer
# ----------------------------
class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variations = ProductVariationSerializer(many=True, read_only=True)
    delivery_time = DeliveryTimeSerializer(read_only=True)

    # verschiedene Bild-Felder (für unterschiedliche Frontend-Bedürfnisse)
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
            "image_url",
            "images",
            "variations",
            "delivery_time",
            "rating_avg",
            "rating_count",
            "recent_reviews",
        ]

    def get_main_image(self, obj):
        request = self.context.get("request")
        return _build_media_url(request, obj.main_image)

    def get_external_image(self, obj):
        # externer Link soll unverändert zurückgegeben werden (falls gesetzt)
        if not obj.external_image:
            return None
        return str(obj.external_image).lstrip("/")

    def get_image_url(self, obj):
        # Priorität: main_image -> external_image -> None
        if obj.main_image:
            request = self.context.get("request")
            return _build_media_url(request, obj.main_image)
        if obj.external_image:
            return str(obj.external_image).lstrip("/")
        return None

    def get_recent_reviews(self, obj):
        qs = obj.reviews.filter(approved=True).order_by("-created_at")[:3]
        # context weiterreichen, damit nested Serializers Zugriff auf request haben
        return ReviewSerializer(qs, many=True, context=self.context).data


# ----------------------------
# ReviewSerializer
# ----------------------------
class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    product_title = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "product",
            "product_title",
            "product_image",
            "user",
            "rating",
            "title",
            "body",
            "approved",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "approved", "created_at", "updated_at"]

    def get_product_title(self, obj):
        return obj.product.title if obj and obj.product else None

    def get_product_image(self, obj):
        request = self.context.get("request")
        # zuerst main_image, dann external_image
        if getattr(obj.product, "main_image", None):
            return _build_media_url(request, obj.product.main_image)
        if getattr(obj.product, "external_image", None):
            return str(obj.product.external_image).lstrip("/")
        return None


# ----------------------------
# OrderItemSerializer
# ----------------------------
class OrderItemSerializer(serializers.ModelSerializer):
    variation_details = serializers.SerializerMethodField()
    has_review = serializers.SerializerMethodField()

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
            "has_review",
        ]

    def get_variation_details(self, obj):
        if not obj or not obj.variation:
            return None

        return {
            "id": obj.variation.id,
            "attributes": AttributeValueSerializer(
                obj.variation.attributes.all(), many=True, context=self.context
            ).data,
        }

    def get_has_review(self, obj):
        request = self.context.get("request")
        if request and getattr(request, "user", None) and request.user.is_authenticated:
            return Review.objects.filter(product=obj.product, user=request.user).exists()
        return False


# ----------------------------
# OrderReturnSerializer
# ----------------------------
class OrderReturnSerializer(serializers.ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(read_only=True)
    item = OrderItemSerializer(read_only=True)
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = OrderReturn
        fields = [
            "id",
            "order",
            "item",
            "user",
            "reason",
            "other_reason",
            "comments",
            "created_at",
            "processed",
        ]
        read_only_fields = ["id", "user", "created_at", "processed"]


# ----------------------------
# OrderSerializer
# ----------------------------
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    returns = OrderReturnSerializer(many=True, read_only=True)

    # Komfort-Feld: menschenlesbare Versanddienst-Bezeichnung
    shipping_carrier_label = serializers.SerializerMethodField(read_only=True)

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
            "shipping_carrier",
            "shipping_carrier_label",
            "tracking_number",
            "items",
            "returns",
        ]
        read_only_fields = ["id", "user", "created_at", "items", "returns"]

    def get_shipping_carrier_label(self, obj):
        # Rückfall: direkte Auswahl aus den CHOICES (falls vorhanden)
        if not obj or not obj.shipping_carrier:
            return ""
        mapping = dict(Order.SHIPPING_CARRIER_CHOICES)
        key = (obj.shipping_carrier or "").strip().lower()
        # mapping keys are stored as in model — try direct, then try lowercase matching
        for k, v in mapping.items():
            if str(k).strip().lower() == key:
                return v
        return (obj.shipping_carrier or "").upper()

    def to_representation(self, instance):
        # sicherstellen, dass verschachtelte Serializer das gleiche context erhalten
        rep = super().to_representation(instance)
        return rep
