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
from urllib.parse import unquote


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

        # 🔹 Wenn schon externe URL → direkt zurückgeben (Fix!)
        if url.startswith("http://") or url.startswith("https://"):
            return url.replace("https:/", "https://")

        # 🔹 Sonst absolute lokale URL erzeugen
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
        

# ------------------------------------------------------------
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
        request = self.context.get("request")

        # 🟢 1. Lokales Bild vorhanden
        if obj.main_image:
            url = str(obj.main_image)
            if not (url.startswith("http://") or url.startswith("https://")):
                return request.build_absolute_uri(obj.main_image.url) if request else obj.main_image.url
            return url

        # 🟢 2. Externes Bild fallback
        if obj.external_image:
            return self._fix_external_url(obj.external_image)

        return None

    def get_external_image(self, obj):
        if obj.external_image:
            return self._fix_external_url(obj.external_image)
        return None

    def _fix_external_url(self, url: str):
        """
        Korrigiert falsch formatierte externe URLs wie 'https:/...'
        """
        url = str(url)
        if url.startswith("https:/") and not url.startswith("https://"):
            url = url.replace("https:/", "https://")
        if url.startswith("http:/") and not url.startswith("http://"):
            url = url.replace("http:/", "http://")
        return url

    def get_recent_reviews(self, obj):
        reviews = obj.reviews.filter(approved=True).order_by("-created_at")[:3]
        return ReviewSerializer(reviews, many=True).data

# ------------------------------------------------------------
# 🗨️ Bewertungen
# ------------------------------------------------------------
class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ["id", "product", "user", "rating", "title", "body", "approved", "created_at"]
        read_only_fields = ["id", "user", "approved", "created_at"]


# ------------------------------------------------------------
# 🧾 Bestellungen
# ------------------------------------------------------------
class OrderItemSerializer(serializers.ModelSerializer):
    product_image = serializers.CharField(allow_blank=True, allow_null=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "variation",
            "product_title",
            "product_image",
            "price",
            "quantity",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    user = serializers.StringRelatedField(read_only=True)

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

    def create(self, validated_data):
        from urllib.parse import unquote

        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None

        items_data = validated_data.pop("items", [])
        order = Order.objects.create(user=user, **validated_data)

        total = 0

        for item_data in items_data:
            product = item_data["product"]
            qty = item_data["quantity"]
            price = item_data["price"]

            image = None

            # 🧩 Schritt 1: Wenn echtes Produktmodell, hole internes oder externes Bild
            if hasattr(product, "main_image") or hasattr(product, "external_image"):
                if product.main_image:
                    image = str(product.main_image)
                    if not image.startswith("http") and request:
                        image = request.build_absolute_uri(product.main_image.url)
                elif product.external_image:
                    image = str(product.external_image)
            else:
                # 🧩 Schritt 2: Bild aus Payload (Frontend)
                raw_image = item_data.get("product_image")
                if raw_image:
                    image = unquote(str(raw_image)).strip()

                    # 🧹 Schritt 3: Bereinigung aller Problemfälle
                    if image.startswith("/https"):
                        image = image[1:]
                    if image.startswith("http:/") and not image.startswith("http://"):
                        image = image.replace("http:/", "http://")
                    if image.startswith("https:/") and not image.startswith("https://"):
                        image = image.replace("https:/", "https://")
                    if not image.startswith("http"):
                        image = f"https://{image.lstrip('/')}"

            # 🧾 Schritt 4: OrderItem erstellen
            OrderItem.objects.create(
                order=order,
                product=product if not isinstance(product, int) else Product.objects.get(pk=product),
                variation=item_data.get("variation"),
                product_title=getattr(product, "title", item_data.get("product_title", "")),
                product_image=image,
                price=price,
                quantity=qty,
            )

            total += price * qty

            # 🔽 Schritt 5: Lagerbestand ggf. anpassen
            variation = item_data.get("variation")
            if variation and hasattr(variation, "stock"):
                variation.stock = max(0, variation.stock - qty)
                variation.save()

        order.total = total
        order.save()
        return order