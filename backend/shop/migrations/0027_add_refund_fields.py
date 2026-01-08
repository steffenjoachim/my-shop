# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0026_populate_category_display_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderreturn',
            name='refund_name',
            field=models.CharField(blank=True, help_text='Name des Empfängers der Erstattung', max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='orderreturn',
            name='refund_amount',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Erstattungsbetrag', max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='orderreturn',
            name='refund_iban',
            field=models.CharField(blank=True, help_text='IBAN für die Erstattung', max_length=34, null=True),
        ),
    ]
