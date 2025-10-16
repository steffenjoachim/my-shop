import sqlite3
db = "db.sqlite3"   # falls Deine DB woanders liegt, Pfad anpassen
conn = sqlite3.connect(db)
cur = conn.cursor()

print("PRAGMA table_info('shop_product'):")
for row in cur.execute("PRAGMA table_info('shop_product')"):
    print(row)  # (cid, name, type, notnull, dflt_value, pk)

cols = [r[1] for r in cur.execute("PRAGMA table_info('shop_product')")]
print("\nSpalten:", cols)

needle = "Werktagen"   # Suchfragment, das Beispiel deckt "In 1-2 Werktagen bei dir!"
found = {}
for col in cols:
    try:
        cur.execute(f"SELECT DISTINCT {col} FROM shop_product WHERE {col} LIKE ?", (f"%{needle}%",))
        rows = [r[0] for r in cur.fetchall()]
        if rows:
            found[col] = rows
    except Exception:
        # z.B. wenn Spalte kein TEXT ist oder Fehler bei Query
        pass

print("\nGefunden (Spalte -> Werte):")
for k, v in found.items():
    print(k, "->", v)

# zusätzlich: falls es eine delivery_time-Spalte gibt, alle distinct-Werte ausgeben
if "delivery_time" in cols:
    cur.execute("SELECT DISTINCT delivery_time FROM shop_product;")
    print("\nDistinct delivery_time:", [r[0] for r in cur.fetchall()])

conn.close()