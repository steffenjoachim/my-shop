# Shipping-Mitarbeiter Setup

## Einrichtung der "shipping" Rolle

Um Mitarbeiter als Shipping-Mitarbeiter einzurichten, müssen Sie:

1. **Django Admin öffnen** (z.B. `http://localhost:8000/admin/`)

2. **Gruppe erstellen:**
   - Gehen Sie zu "Groups" unter "Authentication and Authorization"
   - Klicken Sie auf "Add Group"
   - Name: `shipping`
   - Speichern

3. **User zur Gruppe hinzufügen:**
   - Gehen Sie zu "Users"
   - Wählen Sie den gewünschten User aus
   - Scrollen Sie zu "Groups"
   - Wählen Sie die Gruppe "shipping" aus
   - Speichern

## Alternative: Via Django Shell

```python
from django.contrib.auth.models import User, Group

# Gruppe erstellen
shipping_group, created = Group.objects.get_or_create(name='shipping')

# User zur Gruppe hinzufügen
user = User.objects.get(username='ihr_username')
user.groups.add(shipping_group)
```

## Status-Optionen

Die folgenden Status sind verfügbar:
- `pending` - Pending (Standard)
- `paid` - Paid
- `ready_to_ship` - Versandbereit
- `shipped` - Versandt
- `cancelled` - Storniert

## API-Endpunkte

- `GET /api/shipping/orders/` - Alle pending Orders abrufen
- `GET /api/shipping/orders/?search=123` - Nach Auftragsnummer suchen
- `GET /api/shipping/orders/{id}/` - Bestelldetails abrufen
- `PATCH /api/shipping/orders/{id}/` - Status aktualisieren (Body: `{"status": "ready_to_ship"}`)

## Frontend-Routen

- `/shipping/orders` - Übersicht aller pending Orders
- `/shipping/orders/{id}` - Detailansicht mit Status-Änderung

