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
    # OrderReturn is the model class; ReturnRequest is an alias to it in your models.py
    ReturnRequest,
)


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image")


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    # expose the model property that sums variation stock
    stock_total = serializers.IntegerField(read_only=True)
    main_image = serializers.CharField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "title",
            "description",
            "price",
            "category",
            "stock_total",
            "rating_avg",
            "rating_count",
            "main_image",
            "images",
        )

class AttributeValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeValue
        fields = ("id", "attribute_type", "value")


class ProductVariationSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True, read_only=True)

    class Meta:
        model = ProductVariation
        fields = ("id", "product", "attributes", "stock")


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = (
            "id",
            "product",
            "user",
            "rating",
            "title",
            "body",
            "approved",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "product_title",
            "product_image",
            "quantity",
            "price",
            "variation",
        )
        read_only_fields = ("id",)


class ReturnRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for admin/frontend consumption of return requests.
    Includes some read-only helper fields: product_title, product_image and order_id.
    """
    order_id = serializers.IntegerField(source="order.id", read_only=True)
    item_id = serializers.IntegerField(source="item.id", read_only=True)
    product_title = serializers.CharField(source="item.product_title", read_only=True)
    product_image = serializers.CharField(source="item.product_image", read_only=True)

    class Meta:
        model = ReturnRequest
        fields = [
            "id",
            "order_id",
            "item_id",
            "product_title",
            "product_image",
            "reason",
            "other_reason",
            "comments",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "status"]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    # expose nested return requests under the key 'return_requests'
    return_requests = ReturnRequestSerializer(many=True, read_only=True, source="returns")
    return_request_count = serializers.SerializerMethodField()
    return_requested = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "name",
            "street",
            "city",
            "zip",
            "status",
            "payment_method",
            "total",
            "shipping_carrier",
            "tracking_number",
            "created_at",
            "items",
            # return info
            "return_requests",
            "return_request_count",
            "return_requested",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "items",
            "return_requests",
            "return_request_count",
            "return_requested",
        ]

    def get_return_request_count(self, obj):
        try:
            return obj.returns.count()
        except Exception:
            from .models import OrderReturn as _OrderReturn
            return _OrderReturn.objects.filter(order=obj).count()

    def get_return_requested(self, obj):
        return self.get_return_request_count(obj) > 0