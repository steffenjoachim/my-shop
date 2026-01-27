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
    ReturnRequest,
    OrderItem,
)


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = ("id", "image", "external_image", "image_url")
    
    def get_image_url(self, obj):
        """Gibt die Bild-URL zurück (hochgeladenes Bild oder externe URL)"""
        return obj.image_url


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "display_name")


class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_type = serializers.CharField(source='attribute_type.name', read_only=True)

    class Meta:
        model = AttributeValue
        fields = ("id", "attribute_type", "value")


class ProductVariationSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True)

    class Meta:
        model = ProductVariation
        fields = ("id", "attributes", "stock")

    def create(self, validated_data):
        attributes_data = validated_data.pop('attributes')
        variation = ProductVariation.objects.create(**validated_data)
        variation.attributes.set([attr['id'] for attr in attributes_data])
        return variation

    def update(self, instance, validated_data):
        attributes_data = validated_data.pop('attributes', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if attributes_data is not None:
            instance.attributes.set([attr['id'] for attr in attributes_data])
        return instance


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    variations = ProductVariationSerializer(many=True, read_only=False)
    recent_reviews = serializers.SerializerMethodField()
    # expose the model property that sums variation stock
    stock_total = serializers.IntegerField(read_only=True)
    # main_image kann jetzt sowohl File-Uploads als auch URLs sein
    main_image = serializers.ImageField(required=False, allow_null=True)
    external_image = serializers.URLField(required=False, allow_null=True)
    image_url = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)

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
            "external_image",
            "image_url",
            "images",
            "variations",
            "recent_reviews",
        )

    def update(self, instance, validated_data):
        variations_data = validated_data.pop('variations', [])
        instance = super().update(instance, validated_data)
        
        # Handle variations
        existing_variations = {v.id: v for v in instance.variations.all()}
        for variation_data in variations_data:
            variation_id = variation_data.get('id')
            if variation_id and variation_id in existing_variations:
                # Update existing
                variation = existing_variations[variation_id]
                for key, value in variation_data.items():
                    if key == 'attributes':
                        variation.attributes.set([attr['id'] for attr in value])
                    else:
                        setattr(variation, key, value)
                variation.save()
            else:
                # Create new
                variation_data['product'] = instance
                attributes = variation_data.pop('attributes', [])
                variation = ProductVariation.objects.create(**variation_data)
                variation.attributes.set([attr['id'] for attr in attributes])
        
        # Delete variations not in data
        new_ids = {v.get('id') for v in variations_data if v.get('id')}
        for existing_id, variation in existing_variations.items():
            if existing_id not in new_ids:
                variation.delete()
        
        return instance
    
    def get_recent_reviews(self, obj):
        """Get approved reviews for the product"""
        reviews = obj.reviews.filter(approved=True).order_by("-created_at")[:5]
        data = []
        for review in reviews:
            data.append({
                "id": review.id,
                "user": review.user.username if review.user else "Anonymous",
                "rating": review.rating,
                "title": review.title,
                "body": review.body,
                "created_at": review.created_at,
                "updated_at": review.updated_at,
            })
        return data


class ReviewSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(
        source="product.title",
        read_only=True
    )
    main_image = serializers.CharField(
        source="product.main_image",
        read_only=True
    )

    class Meta:
        model = Review
        fields = (
            "id",
            "product",
            "product_title",
            "main_image",
            "user",
            "rating",
            "title",
            "body",
            "approved",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "product_title",
            "main_image",
        )


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
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ReturnRequest
        fields = [
            "id",
            "order_id",
            "item_id",
            "product_title",
            "product_image",
            "username",
            "reason",
            "other_reason",
            "comments",
            "status",
            "rejection_reason",
            "rejection_comment",
            "rejection_date",
            "refund_name",
            "refund_amount",
            "refund_iban",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

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