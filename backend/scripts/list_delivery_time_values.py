import os, django, sqlite3
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()
from django.conf import settings

db = settings.DATABASES['default']['NAME']
conn = sqlite3.connect(db)
cur = conn.cursor()
cur.execute("SELECT DISTINCT delivery_time_id FROM shop_product;")
rows = [r[0] for r in cur.fetchall()]
print("Distinct delivery_time_id values:", rows)
non_numeric = [v for v in rows if v is not None and not str(v).isdigit()]
print("Non-numeric values:", non_numeric)
conn.close()