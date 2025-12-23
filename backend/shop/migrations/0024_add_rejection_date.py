from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0023_orderreturn_rejection_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name='orderreturn',
            name='rejection_date',
            field=models.DateTimeField(blank=True, null=True, help_text='Datum und Uhrzeit der Ablehnung'),
        ),
    ]
