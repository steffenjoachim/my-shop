"""
E-Mail-Service für Retour-Benachrichtigungen.

In der Entwicklungsphase werden E-Mails in die Konsole geloggt.
In der Produktion können hier echte E-Mail-Versand-Logik implementiert werden.
"""
from django.conf import settings


def send_return_approval_email(return_request):
    """
    Sendet eine E-Mail-Benachrichtigung an den Kunden, wenn seine Retour-Anfrage genehmigt wurde.
    
    In der Entwicklungsphase wird die E-Mail in die Konsole geloggt.
    In der Produktion würde hier eine echte E-Mail versendet werden (z.B. mit Django's send_mail).
    
    Args:
        return_request: ReturnRequest-Instanz mit genehmigter Retour
    """
    user = return_request.user
    order = return_request.order
    item = return_request.item
    
    # E-Mail-Daten zusammenstellen
    recipient_email = user.email if hasattr(user, 'email') and user.email else "unbekannt@example.com"
    subject = f"Retour-Anfrage genehmigt - Bestellung #{order.id}"
    
    # E-Mail-Text (simuliert einen Retour-Schein)
    email_body = f"""
═══════════════════════════════════════════════════════════════
RETOUR-GENEHMIGUNG
═══════════════════════════════════════════════════════════════

Sehr geehrte/r {user.username if hasattr(user, 'username') else 'Kunde/in'},

Ihre Retour-Anfrage wurde genehmigt!

RETOUR-DETAILS:
───────────────────────────────────────────────────────────────
Retour-Nr.:        #{return_request.id}
Bestell-Nr.:       #{order.id}
Produkt:           {item.product_title}
Grund:             {return_request.get_reason_display()}
Status:            {return_request.get_status_display()}

RETOUR-ADRESSE:
───────────────────────────────────────────────────────────────
Bitte senden Sie das Produkt an folgende Adresse zurück:

[Ihre Retour-Adresse hier]
[Straße und Hausnummer]
[PLZ Stadt]

RETOUR-SCHEIN:
───────────────────────────────────────────────────────────────
Bitte drucken Sie diesen Retour-Schein aus und legen Sie ihn
der Sendung bei:

RETOUR-NR: {return_request.id}
BESTELL-NR: {order.id}
PRODUKT: {item.product_title}

WICHTIGE HINWEISE:
───────────────────────────────────────────────────────────────
- Bitte verpacken Sie das Produkt sicher und verwenden Sie
  die Originalverpackung, falls vorhanden.
- Die Retour muss innerhalb von 14 Tagen bei uns eingehen.
- Nach Eingang und Prüfung erhalten Sie eine Erstattung.

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
Ihr Shop-Team

═══════════════════════════════════════════════════════════════
Diese E-Mail wurde automatisch generiert.
═══════════════════════════════════════════════════════════════
"""
    
    # In der Entwicklungsphase: E-Mail in die Konsole ausgeben
    if settings.DEBUG:
        print("\n" + "=" * 80)
        print("📧 E-MAIL-BENACHRICHTIGUNG (SIMULATION)")
        print("=" * 80)
        print(f"An: {recipient_email}")
        print(f"Betreff: {subject}")
        print("-" * 80)
        print(email_body)
        print("=" * 80)
        print("ℹ️  In der Produktion würde hier eine echte E-Mail versendet werden.")
        print("=" * 80 + "\n")
    else:
        # In der Produktion: Echte E-Mail versenden
        # Beispiel-Implementierung (erfordert Django E-Mail-Konfiguration):
        # from django.core.mail import send_mail
        # from django.template.loader import render_to_string
        # 
        # send_mail(
        #     subject=subject,
        #     message=email_body,
        #     from_email=settings.DEFAULT_FROM_EMAIL,
        #     recipient_list=[recipient_email],
        #     fail_silently=False,
        # )
        print(f"E-Mail würde an {recipient_email} gesendet werden (Produktionsmodus)")

