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
#  🖼️ Produktbilder
# ============================================================

class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image"]

    def get_image(self, obj):
        if not obj.image:
            return None

        url = str(obj.image)

        # Externe URL sauber fixen
        if url.startswith("http://") or url.startswith("https://"):
            return url.replace("https:/", "https://")

        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


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
    main_image = serializers.SerializerMethodField()
    external_image = serializers.SerializerMethodField()
    delivery_time = DeliveryTimeSerializer(read_only=True)
    rating_avg = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    rating_count = serializers.IntegerField(read_only=True)
    recent_reviews = serializers.SerializerMethodField()

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
            "rating_avg",
            "rating_count",
            "recent_reviews",
        ]

    def get_main_image(self, obj):
        request = self.context.get("request")

        if obj.main_image:
            url = str(obj.main_image)
            if not (url.startswith("http://") or url.startswith("https://")):
                return request.build_absolute_uri(obj.main_image.url) if request else obj.main_image.url
            return url

        if obj.external_image:
            return self._fix_url(obj.external_image)

        return None

    def get_external_image(self, obj):
        return self._fix_url(obj.external_image) if obj.external_image else None

    def _fix_url(self, url: str):
        url = str(url)
        if url.startswith("https:/") and not url.startswith("https://"):
            url = url.replace("https:/", "https://")
        if url.startswith("http:/") and not url.startswith("http://"):
            url = url.replace("http:/", "http://")
        return url

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
            "id", "product", "user", "rating",
            "title", "body", "approved", "created_at"
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

    # ✅ liefert Variation + Attribute
    def get_variation_details(self, obj):
        if not obj.variation:
            return None

        return {
            "id": obj.variation.id,
            "attributes": AttributeValueSerializer(obj.variation.attributes.all(), many=True).data,
        }


# ============================================================
# 🧾 Bestellung (Order)
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

    # ✅ wichtig für Checkout
    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None

        items_data = validated_data.pop("items", [])
        order = Order.objects.create(user=user, **validated_data)

        total = 0

        for item in items_data:
            product = item["product"]
            qty = item["quantity"]
            price = item["price"]

            variation = item.get("variation")
            if isinstance(variation, ProductVariation):
                variation = variation.id

            # Bild bestimmen – entweder Produktbild oder aus Frontend
            image = None
            if hasattr(product, "main_image") or hasattr(product, "external_image"):
                if product.main_image:
                    image = request.build_absolute_uri(product.main_image.url)
                elif product.external_image:
                    image = str(product.external_image)
            else:
                raw_image = item.get("product_image")
                if raw_image:
                    image = unquote(str(raw_image)).strip()
                    if image.startswith("/https"):
                        image = image[1:]
                    if image.startswith("http:/") and not image.startswith("http://"):
                        image = image.replace("http:/", "http://")
                    if image.startswith("https:/") and not image.startswith("https://"):
                        image = image.replace("https:/", "https://")
                    if not image.startswith("http"):
                        image = f"https://{image.lstrip('/')}"

            OrderItem.objects.create(
                order=order,
                product=product if not isinstance(product, int) else Product.objects.get(pk=product),
                variation=ProductVariation.objects.get(pk=variation) if variation else None,
                product_title=getattr(product, "title", item.get("product_title", "")),
                product_image=image,
                price=price,
                quantity=qty,
            )

            total += price * qty

        order.total = total
        order.save()
        return order