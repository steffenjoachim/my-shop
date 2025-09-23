from django.contrib import admin
from .models import Category, Product, ProductAttribute, ProductImage, AttributeType

admin.site.register(Category)
admin.site.register(Product)
admin.site.register(ProductAttribute)
admin.site.register(ProductImage)
admin.site.register(AttributeType)