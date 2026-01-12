"""
Email service for return notifications.

In development, emails are logged to the console.
In production, real email sending logic can be implemented here.
"""
from django.conf import settings
from shop.models import ReturnRequest


def send_return_approval_email(return_request):
    """
    Sends an email notification to the customer when their return request has been approved.
    
    In development, the email is logged to the console.
    In production, a real email would be sent here (e.g., with Django's send_mail).
    
    Args:
        return_request: ReturnRequest instance with approved return
    """
    user = return_request.user
    order = return_request.order
    item = return_request.item
    
    # Compose email data
    recipient_email = user.email if hasattr(user, 'email') and user.email else "unknown@example.com"
    subject = f"Retour-Anfrage genehmigt - Bestellung #{order.id}"
    
    # Email body (simulates a return label)
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
    
    # In development: Output email to console
    if settings.DEBUG:
        print("\n" + "=" * 80)
        print("📧 EMAIL NOTIFICATION (SIMULATION)")
        print("=" * 80)
        print(f"To: {recipient_email}")
        print(f"Subject: {subject}")
        print("-" * 80)
        print(email_body)
        print("=" * 80)
        print("ℹ️  In production, a real email would be sent here.")
        print("=" * 80 + "\n")
    else:
        # In production: Send real email
        # Example implementation (requires Django email configuration):
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
        print(f"Email would be sent to {recipient_email} (production mode)")


def send_return_received_email(return_request):
    """
    Sends an email notification to the customer when their return has been received.
    
    In development, the email is logged to the console.
    In production, a real email would be sent here.
    
    Args:
        return_request: ReturnRequest instance with received return
    """
    user = return_request.user
    order = return_request.order
    item = return_request.item
    
    # Compose email data
    recipient_email = user.email if hasattr(user, 'email') and user.email else "unknown@example.com"
    subject = f"Retour eingetroffen und wird geprüft - Bestellung #{order.id}"
    
    # Email body
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
    
    # In development: Output email to console
    if settings.DEBUG:
        print("\n" + "=" * 80)
        print("📧 EMAIL NOTIFICATION (SIMULATION) - RETURN RECEIVED")
        print("=" * 80)
        print(f"To: {recipient_email}")
        print(f"Subject: {subject}")
        print("-" * 80)
        print(email_body)
        print("=" * 80)
        print("ℹ️  In production, a real email would be sent here.")
        print("=" * 80 + "\n")
    else:
        # In production: Send real email
        # from django.core.mail import send_mail
        # send_mail(
        #     subject=subject,
        #     message=email_body,
        #     from_email=settings.DEFAULT_FROM_EMAIL,
        #     recipient_list=[recipient_email],
        #     fail_silently=False,
        # )
        print(f"Email would be sent to {recipient_email} (production mode)")


def send_return_rejection_email(return_request):
    """
    Sends an email notification to the customer when their return request has been rejected.
    
    In development, the email is logged to the console.
    In production, a real email would be sent here.
    
    Args:
        return_request: ReturnRequest instance with rejected return
    """
    user = return_request.user
    order = return_request.order
    item = return_request.item
    
    # Compose email data
    recipient_email = user.email if hasattr(user, 'email') and user.email else "unknown@example.com"
    subject = f"Retour-Anfrage abgelehnt - Bestellung #{order.id}"
    
    # Format rejection reason
    rejection_reason_display = dict(ReturnRequest.REJECTION_REASON_CHOICES).get(
        return_request.rejection_reason or "", 
        return_request.rejection_reason or "Nicht angegeben"
    )
    
    # Email body
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
    
    # In development: Output email to console
    if settings.DEBUG:
        print("\n" + "=" * 80)
        print("📧 EMAIL NOTIFICATION (SIMULATION) - REJECTION")
        print("=" * 80)
        print(f"To: {recipient_email}")
        print(f"Subject: {subject}")
        print("-" * 80)
        print(email_body)
        print("=" * 80)
        print("ℹ️  In production, a real email would be sent here.")
        print("=" * 80 + "\n")
    else:
        # In production: Send real email
        # from django.core.mail import send_mail
        # send_mail(
        #     subject=subject,
        #     message=email_body,
        #     from_email=settings.DEFAULT_FROM_EMAIL,
        #     recipient_list=[recipient_email],
        #     fail_silently=False,
        # )
        print(f"Email would be sent to {recipient_email} (production mode)")


def send_return_refunded_email(return_request):
    """
    Sends an email notification to the customer when their return has been refunded.
    
    In development, the email is logged to the console.
    In production, a real email would be sent here.
    
    Args:
        return_request: ReturnRequest instance with refunded return
    """
    user = return_request.user
    order = return_request.order
    item = return_request.item
    
    # Compose email data
    recipient_email = user.email if hasattr(user, 'email') and user.email else "unknown@example.com"
    subject = f"Erstattung erfolgt - Bestellung #{order.id}"
    
    # Format IBAN for display (add spaces every 4 characters)
    iban = return_request.refund_iban or ""
    formatted_iban = " ".join([iban[i:i+4] for i in range(0, len(iban), 4)]) if iban else ""
    
    # Email body
    email_body = f"""
═══════════════════════════════════════════════════════════════
ERSTATTUNG ERFOLGT
═══════════════════════════════════════════════════════════════

Sehr geehrte/r {user.username if hasattr(user, 'username') else 'Kunde/in'},

wir freuen uns, Ihnen mitteilen zu können, dass Ihre Erstattung verarbeitet wurde.

ERSTATTUNGS-DETAILS:
───────────────────────────────────────────────────────────────
Retour-Nr.:        #{return_request.id}
Bestell-Nr.:       #{order.id}
Produkt:           {item.product_title}
Erstattungsbetrag: {return_request.refund_amount:.2f} €
IBAN:              {formatted_iban}

WICHTIGE INFORMATIONEN:
───────────────────────────────────────────────────────────────
Der Betrag in Höhe von {return_request.refund_amount:.2f} € wurde an das
Konto mit der IBAN {formatted_iban} überwiesen.

Die Erstattung wird in den nächsten 1-2 Werktagen auf Ihrem Konto
eingehen. Bitte beachten Sie, dass die Bearbeitungszeit je nach
Ihrer Bank variieren kann.

Bei Fragen zu Ihrer Erstattung stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
Ihr Shop-Team

═══════════════════════════════════════════════════════════════
Diese E-Mail wurde automatisch generiert.
═══════════════════════════════════════════════════════════════
"""
    
    # In development: Output email to console
    if settings.DEBUG:
        print("\n" + "=" * 80)
        print("📧 EMAIL NOTIFICATION (SIMULATION) - REFUND COMPLETED")
        print("=" * 80)
        print(f"To: {recipient_email}")
        print(f"Subject: {subject}")
        print("-" * 80)
        print(email_body)
        print("=" * 80)
        print("ℹ️  In production, a real email would be sent here.")
        print("=" * 80 + "\n")
    else:
        # In production: Send real email
        # from django.core.mail import send_mail
        # send_mail(
        #     subject=subject,
        #     message=email_body,
        #     from_email=settings.DEFAULT_FROM_EMAIL,
        #     recipient_list=[recipient_email],
        #     fail_silently=False,
        # )
        print(f"Email would be sent to {recipient_email} (production mode)")

