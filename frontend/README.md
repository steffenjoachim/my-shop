# MyShop

MyShop ist eine kleine E‑Commerce‑Applikation. Das Frontend ist mit Angular umgesetzt, das Backend liegt als Django/DRF‑Projekt im Ordner `backend` (teilweise implementiert). Dieses README ist auf dem aktuellen Stand des Repositories (Frontend Angular + Backend Django REST Framework).

## Hauptfeatures

- Frontend: Angular (Standalone Components, Signals), Tailwind CSS für Styling.
- Backend: Django + Django REST Framework (API‑Endpunkte unter `/api/`).
- Produktübersicht, Produktdetailseite mit Bewertungen, Warenkorb, Bestellverwaltung.
- Versandverwaltung (separate Route für Shipping‑User: `/shipping/orders`).
- Authentifizierung (Session / CSRF) und einfache Order‑APIs.

## Projektstruktur (auszugsweise)

my-shop/
- backend/                      # Django + DRF (app: `shop`)
  - manage.py
  - requirements.txt
  - shop/
    - models.py
    - views.py
    - serializers.py
    - urls.py
- frontend/
  - package.json
  - src/
    - app/
      - app.routes.ts
      - app.component.ts
      - features/
        - product-detail/
        - orders/
          - components/
            - order-card/
            - order-details/
        - ...
      - shared/
        - header/
        - services/
          - auth.service.ts
          - cart.service.ts
        - popup-alert/
    - environments/
      - environment.ts
  - README.md (diese Datei)

## Installation & Entwicklung

Voraussetzungen:
- Node.js (16+)
- Angular CLI (optional, empfohlen)
- Python 3.10+ (für Backend)
- pip / virtualenv

Frontend (Entwicklung)
1. In das frontend‑Verzeichnis wechseln:
   cd frontend
2. Abhängigkeiten installieren:
   npm install
3. Dev‑Server starten:
   ng serve
4. App öffnen:
   http://localhost:4200

Backend (Entwicklung)
1. Virtualenv erstellen und aktivieren:
   python -m venv .venv
   .venv\Scripts\activate    (Windows) oder source .venv/bin/activate (mac/linux)
2. Abhängigkeiten installieren:
   pip install -r requirements.txt
3. Migrationen ausführen:
   python manage.py migrate
4. Optional Superuser anlegen:
   python manage.py createsuperuser
5. Dev‑Server starten:
   python manage.py runserver
6. API Basis-URL:
   Standardmäßig unter http://localhost:8000/api/

Wichtig:
- Die Frontend‑Umgebung (`src/environments/environment.ts`) enthält `apiBaseUrl` — passe diese an, falls Backend auf anderem Host/Port läuft.
- CSRF: Es gibt einen Endpunkt `/api/cart/csrf/` (für CSRF Cookie), Session/CSRF werden in Frontend bereits berücksichtigt (withCredentials).

## Bekannte Verhalten / Hinweise für Entwickler

- Bestellungen:
  - Frontend erwartet eine Route zum Stornieren: `PATCH /api/orders/{id}/cancel/`. Damit diese existiert, muss im `OrderViewSet` (backend/shop/views.py) eine DRF‑Detail‑Action `@action(detail=True, methods=['patch'], url_path='cancel')` implementiert sein. Fehlt die Action → 404 beim PATCH.
- Shipping‑User:
  - Wenn sich ein User mit Shipping‑Rechten einloggt, leitet das Frontend standardmäßig zu `/shipping/orders` weiter. Der Header blendet für Shipping‑Accounts das Dropdown unter dem User aus.
  - Die Erkennung des Shipping‑Users erfolgt aktuell über verschiedene mögliche Felder im User‑Objekt (z. B. `role`, `is_shipping`, `groups`).
- Responsive UI:
  - Die Review‑Filter UI ist responsive: bei schmalen Viewports werden Buttons umgebrochen und Button‑Padding / Schriftgröße reduziert.
- Reviews:
  - Produktbewertungs‑Karte ist eigenständige Komponente (`ProductReviewCard`), Bewertungen lassen sich sortieren/filtern (Neueste, Älteste, Beste, Schlechteste, Min. Sterne).

## Testing

Frontend:
- Unit Tests (Jasmine/Karma) mit:
  npm test

Backend:
- Django‑Tests:
  python manage.py test

## Deployment / Build

Frontend Production Build:
- cd frontend
- ng build --configuration production
  Die erzeugten Artefakte landen in `dist/`.

Backend Deployment:
- Standard Django‑Deployment‑Schritte (WSGI/ASGI, Datenbank konfigurieren, SECRET_KEY, DEBUG=False usw.)

## Entwicklungstipps / ToDos

- Backend: vollständige Serializers/Models fertigstellen (einige Dateien im `backend/shop` sind noch unvollständig).
- API‑Routen prüfen: sicherstellen, dass alle vom Frontend verwendeten Endpoints (z. B. Cancel‑Action) vorhanden sind.
- Auth: Rollen/Claims im User‑Objekt vereinheitlichen, damit Frontend die Shipping‑Rolle zuverlässig erkennt.
- Unit / E2E Tests erweitern (z. B. Order Cancellation, Review Submission).

## Lizenz

Dieses Projekt steht unter MIT License.
