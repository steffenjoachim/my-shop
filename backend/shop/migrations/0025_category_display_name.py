# Generated manually: add display_name to Category
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0024_add_rejection_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='display_name',
            field=models.CharField(max_length=100, null=True, blank=True),
        ),
    ]
