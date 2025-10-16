# ...existing code...
from django.db import migrations, models
import django.db.models.deletion

def create_deliverytime_rows(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    DeliveryTime = apps.get_model("shop", "DeliveryTime")
    conn = schema_editor.connection
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT delivery_time FROM shop_product WHERE delivery_time IS NOT NULL AND delivery_time != ''")
    rows = [r[0] for r in cursor.fetchall()]
    mapping = {}
    for text_val in rows:
        dt = DeliveryTime.objects.create(name=(text_val[:100] if text_val else ""))
        mapping[text_val] = dt.id
    # use ORM to update products (avoids Django debug SQL formatting issues)
    for old_text, new_id in mapping.items():
        Product.objects.filter(delivery_time=old_text).update(delivery_time=str(new_id))

class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0010_product_delivery_time'),
    ]

    operations = [
        migrations.CreateModel(
            name='DeliveryTime',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('min_days', models.PositiveIntegerField(default=0)),
                ('max_days', models.PositiveIntegerField(default=0)),
                ('is_default', models.BooleanField(default=False)),
            ],
        ),
        migrations.RunPython(create_deliverytime_rows),
        migrations.AlterField(
            model_name='product',
            name='delivery_time',
            field=models.ForeignKey(
                to='shop.DeliveryTime',
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='products',
            ),
        ),
    ]
# ...existing code...