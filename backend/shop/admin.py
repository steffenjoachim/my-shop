from django.contrib import admin
from .models import (
    Category,
    Product,
    ProductAttribute,
    ProductImage,
    AttributeType,
    AttributeValue,
)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ["image"]  # is_primary entfernt, da nicht im Model


class ProductAttributeInline(admin.TabularInline):
    model = ProductAttribute
    extra = 1
    fields = ["value"]  # nur value, da attribute_type indirekt über value kommt


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "price")  # stock entfernt
    list_filter = ("category",)
    search_fields = ("title", "description")
    inlines = [ProductImageInline, ProductAttributeInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(AttributeType)
class AttributeTypeAdmin(admin.ModelAdmin):
    list_display = ("name",)  # category entfernt
    search_fields = ("name",)


@admin.register(AttributeValue)
class AttributeValueAdmin(admin.ModelAdmin):
    list_display = ("value", "attribute_type")
    list_filter = ("attribute_type",)
    search_fields = ("value",)


@admin.register(ProductAttribute)
class ProductAttributeAdmin(admin.ModelAdmin):
    list_display = ("product", "get_attribute_type", "get_value", "stock")
    list_filter = ("value__attribute_type",)  # korrekt über FK
    search_fields = ("value__value", "product__title")

    def get_attribute_type(self, obj):
        return obj.value.attribute_type.name
    get_attribute_type.short_description = "Attribute Type"

    def get_value(self, obj):
        return obj.value.value
    get_value.short_description = "Value"


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("product", "image")  # is_primary entfernt
    search_fields = ("product__title",)
