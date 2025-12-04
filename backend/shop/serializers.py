from rest_framework import serializers
from .models import (
    Category,
    Product,
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


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class DeliveryTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryTime
        fields = "__all__"


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.ReadOnlyField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "image_url"]


class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_type = serializers.StringRelatedField()

    class Meta:
        model = AttributeValue
        fields = ["id", "attribute_type", "value"]


class ProductVariationSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True)
    is_in_stock = serializers.ReadOnlyField()
    variation_key = serializers.ReadOnlyField()

    class Meta:
        model = ProductVariation
        fields = ["id", "attributes", "stock", "is_in_stock", "variation_key"]


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True)
    variations = ProductVariationSerializer(many=True)
    image_url = serializers.ReadOnlyField()
    stock_total = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = "__all__"


class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = Review
        exclude = ["updated_at"]


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = "__all__"


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = "__all__"


# ✅ RETOUR
class OrderReturnSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderReturn
        fields = "__all__"
        read_only_fields = ["id", "user", "order", "created_at", "processed"]
