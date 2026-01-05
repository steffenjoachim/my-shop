"""
E-Mail-Service für Retour-Benachrichtigungen.

In der Entwicklungsphase werden E-Mails in die Konsole geloggt.
In der Produktion können hier echte E-Mail-Versand-Logik implementiert werden.
"""
from django.conf import settings
from shop.models import ReturnRequest


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


def send_return_received_email(return_request):
    """
    Sendet eine E-Mail-Benachrichtigung an den Kunden, wenn seine Retour eingetroffen ist.
    
    In der Entwicklungsphase wird die E-Mail in die Konsole geloggt.
    In der Produktion würde hier eine echte E-Mail versendet werden.
    
    Args:
        return_request: ReturnRequest-Instanz mit eingegangener Retour
    """
    user = return_request.user
    order = return_request.order
    item = return_request.item
    
    # E-Mail-Daten zusammenstellen
    recipient_email = user.email if hasattr(user, 'email') and user.email else "unbekannt@example.com"
    subject = f"Retour eingetroffen und wird geprüft - Bestellung #{order.id}"
    
    # E-Mail-Text
    email_body = f"""
═══════════════════════════════════════════════════════════════
RETOUR EINGETROFFEN - PRÜFUNG LÄUFT
═══════════════════════════════════════════════════════════════

Liebe/r {user.username if hasattr(user, 'username') else 'Kunde/in'},

wir freuen uns mitteilen, dass Ihre Retour bei uns eingetroffen ist!

RETOUR-DETAILS:
───────────────────────────────────────────────────────────────
Retour-Nr.:        #{return_request.id}
Bestell-Nr.:       #{order.id}
Produkt:           {item.product_title}
Erhalt bestätigt:  {return_request.created_at.strftime('%d.%m.%Y %H:%M') if hasattr(return_request.created_at, 'strftime') else return_request.created_at}

WAS PASSIERT JETZT?
───────────────────────────────────────────────────────────────
Deine Retour ist eingetroffen und wird von unserem Team sorgfältig geprüft.
Wir überprüfen dabei:

✓ Die Vollständigkeit des Produkts
✓ Den Zustand des Produkts
✓ Die Voraussetzungen für die Rückgabe

RÜCKERSTATTUNG
───────────────────────────────────────────────────────────────
Sobald unsere Prüfung abgeschlossen ist, wird der Bestellbetrag in Höhe von 
EUR {order.total:.2f} auf dein ursprüngliches Zahlungsmittel 
zurückerstattet.

Die Bearbeitung dauert in der Regel 5-7 Werktage nach Abschluss 
der Prüfung.

DEIN VORTEIL BEI UNS
───────────────────────────────────────────────────────────────
- Kostenlose Retouren
- Schnelle Prüfung und Erstattung
- Volle Transparenz über den Status deiner Retour

FRAGEN?
───────────────────────────────────────────────────────────────
Du kannst jederzeit in deinem Kundenkonto den Status deiner Retour 
einsehen oder unser Kundenservice-Team kontaktieren, wenn du Fragen 
hast.

Vielen Dank für dein Vertrauen!

Mit freundlichen Grüßen
Dein Shop-Team

═══════════════════════════════════════════════════════════════
Diese E-Mail wurde automatisch generiert.
═══════════════════════════════════════════════════════════════
"""
    
    # In der Entwicklungsphase: E-Mail in die Konsole ausgeben
    if settings.DEBUG:
        print("\n" + "=" * 80)
        print("📧 E-MAIL-BENACHRICHTIGUNG (SIMULATION) - RETOUR EINGETROFFEN")
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
        # from django.core.mail import send_mail
        # send_mail(
        #     subject=subject,
        #     message=email_body,
        #     from_email=settings.DEFAULT_FROM_EMAIL,
        #     recipient_list=[recipient_email],
        #     fail_silently=False,
        # )
        print(f"E-Mail würde an {recipient_email} gesendet werden (Produktionsmodus)")


def send_return_rejection_email(return_request):
    """
    Sendet eine E-Mail-Benachrichtigung an den Kunden, wenn seine Retour-Anfrage abgelehnt wurde.
    
    In der Entwicklungsphase wird die E-Mail in die Konsole geloggt.
    In der Produktion würde hier eine echte E-Mail versendet werden.
    
    Args:
        return_request: ReturnRequest-Instanz mit abgelehnter Retour
    """
    user = return_request.user
    order = return_request.order
    item = return_request.item
    
    # E-Mail-Daten zusammenstellen
    recipient_email = user.email if hasattr(user, 'email') and user.email else "unbekannt@example.com"
    subject = f"Retour-Anfrage abgelehnt - Bestellung #{order.id}"
    
    # Ablehnungsgrund formatieren
    rejection_reason_display = dict(ReturnRequest.REJECTION_REASON_CHOICES).get(
        return_request.rejection_reason or "", 
        return_request.rejection_reason or "Nicht angegeben"
    )
    
    # E-Mail-Text
    email_body = f"""
═══════════════════════════════════════════════════════════════
RETOUR-ABLEHNUNG
═══════════════════════════════════════════════════════════════

Sehr geehrte/r {user.username if hasattr(user, 'username') else 'Kunde/in'},

leider müssen wir Ihnen mitteilen, dass Ihre Retour-Anfrage nicht genehmigt werden konnte.

RETOUR-DETAILS:
───────────────────────────────────────────────────────────────
Retour-Nr.:        #{return_request.id}
Bestell-Nr.:       #{order.id}
Produkt:           {item.product_title}
Ihr Rückgabegrund: {return_request.get_reason_display()}

ABLEHNUNGSGRUND:
───────────────────────────────────────────────────────────────
{rejection_reason_display}
"""
    
    if return_request.rejection_comment:
        email_body += f"""
Zusätzliche Erläuterung:
{return_request.rejection_comment}
"""
    
    email_body += f"""
WICHTIGE HINWEISE:
───────────────────────────────────────────────────────────────
- Bitte beachten Sie, dass eine Rückgabe aus den oben genannten
  Gründen nicht möglich ist.
- Falls Sie Fragen zu dieser Entscheidung haben, kontaktieren Sie
  bitte unseren Kundenservice.

Bei weiteren Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
Ihr Shop-Team

═══════════════════════════════════════════════════════════════
Diese E-Mail wurde automatisch generiert.
═══════════════════════════════════════════════════════════════
"""
    
    # In der Entwicklungsphase: E-Mail in die Konsole ausgeben
    if settings.DEBUG:
        print("\n" + "=" * 80)
        print("📧 E-MAIL-BENACHRICHTIGUNG (SIMULATION) - ABLEHNUNG")
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
        # from django.core.mail import send_mail
        # send_mail(
        #     subject=subject,
        #     message=email_body,
        #     from_email=settings.DEFAULT_FROM_EMAIL,
        #     recipient_list=[recipient_email],
        #     fail_silently=False,
        # )
        print(f"E-Mail würde an {recipient_email} gesendet werden (Produktionsmodus)")

