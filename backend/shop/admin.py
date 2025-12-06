from django.contrib import admin
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
    list_display = ("title", "category", "price", "delivery_time", "rating_avg", "rating_count")
    fields = (
        "title", "description", "price", "main_image", "external_image",
        "category", "delivery_time", "rating_avg", "rating_count"
    )
    readonly_fields = ("rating_avg", "rating_count")
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


@admin.register(DeliveryTime)
class DeliveryTimeAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "min_days", "max_days", "is_default")
    list_editable = ("is_default",)
    search_fields = ("name",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "created_at", "total", "status", "paid")
    list_filter = ("status", "paid")
    readonly_fields = ("created_at",)
    search_fields = ("user__username",)


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "product", "variation", "quantity", "price")
    search_fields = ("product__title",)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "user", "rating", "approved", "created_at")
    list_filter = ("approved", "rating")
    search_fields = ("product__title", "user__username", "body")
    actions = ["approve_reviews"]

    def approve_reviews(self, request, queryset):
        queryset.update(approved=True)
        
@admin.register(OrderReturn)
class OrderReturnAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",        
        "user",
        "reason",
        "status",       
        "created_at",
    )

    list_filter = (
        "status",      
        "reason",
        "created_at",
    )

    search_fields = (
        "order__id",
        "user__username",
        "comments",
    )

    ordering = ("-created_at",)
