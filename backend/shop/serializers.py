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
        
#-------------------------------------------------------------
# 🚚 Lieferzeit
# ------------------------------------------------------------      
        
class DeliveryTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryTime
        fields = ["id", "name", "min_days", "max_days", "is_default"]

# ------------------------------------------------------------
# 🛍️ Produkt
# ------------------------------------------------------------
class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variations = ProductVariationSerializer(many=True, read_only=True)
    main_image = serializers.SerializerMethodField()
    external_image = serializers.SerializerMethodField()
    delivery_time = DeliveryTimeSerializer(read_only=True)
    delivery_time_id = serializers.PrimaryKeyRelatedField(
        queryset=DeliveryTime.objects.all(),
        source="delivery_time",
        write_only=True,
        allow_null=True,
        required=False,
    )

    # new / cached rating fields
    rating_avg = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    rating_count = serializers.IntegerField(read_only=True)
    recent_reviews = serializers.SerializerMethodField(read_only=True)
    
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
            "delivery_time_id",
            "rating_avg",
            "rating_count",
            "recent_reviews",
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
    
    def get_recent_reviews(self, obj):
        reviews = obj.reviews.filter(approved=True).order_by("-created_at")[:3]
        return ReviewSerializer(reviews, many=True).data
    
# ---- Review Serializer ----
class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ["id", "product", "user", "rating", "title", "body", "approved", "created_at"]
        read_only_fields = ["id", "user", "approved", "created_at"]

# ---- OrderItem / Order Serializer (minimal) ----
class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "variation", "price", "quantity"]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Order
        fields = ["id", "user", "created_at", "total", "status", "paid", "items"]
