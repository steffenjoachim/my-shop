# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0022_remove_orderreturn_processed_orderreturn_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderreturn',
            name='rejection_reason',
            field=models.CharField(blank=True, choices=[('zeitraum_abgelaufen', 'Rückgabezeitraum abgelaufen'), ('produkt_nicht_rueckgabe', 'Produkt kann nicht zurückgegeben werden (z.B. Lebensmittel)'), ('sonstiges', 'Sonstiges')], help_text='Grund für die Ablehnung der Retour', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='orderreturn',
            name='rejection_comment',
            field=models.TextField(blank=True, help_text='Zusätzliche Erläuterung zum Ablehnungsgrund', null=True),
        ),
    ]


