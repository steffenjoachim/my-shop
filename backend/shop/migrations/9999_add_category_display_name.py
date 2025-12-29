# Generated manually: add display_name to Category
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0002_category_remove_product_image_product_description_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='display_name',
            field=models.CharField(max_length=100, null=True, blank=True),
        ),
    ]
