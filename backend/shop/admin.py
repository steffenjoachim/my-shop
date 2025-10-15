from django.contrib import admin
from .models import (
    Category,
    Product,
    ProductImage,
    AttributeType,
    AttributeValue,
    ProductVariation,
)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ["image"]


class ProductVariationInline(admin.TabularInline):
    model = ProductVariation
    extra = 1
    filter_horizontal = ("attributes",)
    fields = ["attributes", "stock"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "price", "delivery_time")
    fields = (
        "title", "description", "price", "main_image", "external_image",
        "category", "delivery_time"
    )
    list_filter = ("category",)
    search_fields = ("title", "description")
    inlines = [ProductImageInline, ProductVariationInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(AttributeType)
class AttributeTypeAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(AttributeValue)
class AttributeValueAdmin(admin.ModelAdmin):
    list_display = ("value", "attribute_type")
    list_filter = ("attribute_type",)
    search_fields = ("value",)


@admin.register(ProductVariation)
class ProductVariationAdmin(admin.ModelAdmin):
    list_display = ("product", "get_attributes", "stock")

    def get_attributes(self, obj):
        return ", ".join([v.value for v in obj.attributes.all()])
    get_attributes.short_description = "Attribute"
