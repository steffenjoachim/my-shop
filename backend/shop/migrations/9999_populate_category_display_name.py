from django.db import migrations


def set_display_names(apps, schema_editor):
    Category = apps.get_model('shop', 'Category')
    mapping = {
        'clothing': 'Kleidung',
        'electronics': 'Elektronik',
        'computer': 'Computer',
        'microwave': 'Mikrowelle',
        'home': 'Wohnen',
        'books': 'Bücher',
    }
    for obj in Category.objects.all():
        if not obj.display_name:
            key = (obj.name or '').strip().lower()
            if key in mapping:
                obj.display_name = mapping[key]
                obj.save(update_fields=['display_name'])


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '9999_add_category_display_name'),
    ]

    operations = [
        migrations.RunPython(set_display_names),
    ]
