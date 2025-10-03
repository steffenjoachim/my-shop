from rest_framework import serializers
from .models import Product, Category, ProductImage, AttributeType, AttributeValue, ProductAttribute


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image"]


class AttributeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeType
        fields = ["id", "name"]


class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_type = AttributeTypeSerializer(read_only=True)

    class Meta:
        model = AttributeValue
        fields = ["id", "value", "attribute_type"]


class ProductAttributeSerializer(serializers.ModelSerializer):
    value = AttributeValueSerializer(read_only=True)

    class Meta:
        model = ProductAttribute
        fields = ["id", "value", "stock"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    main_image = serializers.SerializerMethodField()
    product_attributes = ProductAttributeSerializer(many=True, read_only=True)
    stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "description",
            "price",
            "main_image",
            "category",
            "images",
            "product_attributes",
            "stock",
        ]

    def get_stock(self, obj):
        # summiert alle Bestände der Varianten
        return sum(attr.stock for attr in obj.product_attributes.all())
    
    def get_main_image(self, obj):
        if obj.external_image:
            return obj.external_image
        if obj.main_image:
            return self.context["request"].build_absolute_uri(obj.main_image.url)
        return None
