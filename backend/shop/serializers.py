# shop/serializers.py
from rest_framework import serializers

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


# ----------------------------
# ProductImageSerializer
# ----------------------------
class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image"]

    def get_image(self, obj):
        if not obj.image:
            return None
        image = str(obj.image).lstrip("/")
        if image.startswith("http://") or image.startswith("https://"):
            return image
        url = "/media/" + image
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url


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
    attributes = AttributeValueSerializer(many=True)

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
        if not obj.main_image:
            return None
        img = str(obj.main_image).lstrip("/")
        if img.startswith("http://") or img.startswith("https://"):
            return img
        url = "/media/" + img
        req = self.context.get("request")
        return req.build_absolute_uri(url) if req else url

    def get_external_image(self, obj):
        if not obj.external_image:
            return None
        return str(obj.external_image).lstrip("/")

    def get_image_url(self, obj):
        if obj.main_image:
            img = str(obj.main_image).lstrip("/")
            if img.startswith("http"):
                return img
            return "/media/" + img
        if obj.external_image:
            return str(obj.external_image).lstrip("/")
        return None

    def get_recent_reviews(self, obj):
        qs = obj.reviews.filter(approved=True).order_by("-created_at")[:3]
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
        return obj.product.title

    def get_product_image(self, obj):
        if obj.product.main_image:
            img = str(obj.product.main_image).lstrip("/")
            if img.startswith("http://") or img.startswith("https://"):
                return img
            request = self.context.get("request")
            url = "/media/" + img
            return request.build_absolute_uri(url) if request else url
        if obj.product.external_image:
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
        if not obj.variation:
            return None
        return {
            "id": obj.variation.id,
            "attributes": AttributeValueSerializer(obj.variation.attributes.all(), many=True).data,
        }

    def get_has_review(self, obj):
        request = self.context.get("request")
        if request and getattr(request, "user", None) and request.user.is_authenticated:
            from .models import Review
            return Review.objects.filter(product=obj.product, user=request.user).exists()
        return False


# ----------------------------
# OrderSerializer
# ----------------------------
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
            "shipping_carrier",
            "tracking_number",
            "items",
        ]
