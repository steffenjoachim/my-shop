import sqlite3, sys
db = "db.sqlite3"   # ggf. Pfad anpassen
conn = sqlite3.connect(db)
cur = conn.cursor()

if len(sys.argv) > 1:
    bad = sys.argv[1]
    cur.execute("UPDATE shop_product SET delivery_time = NULL WHERE delivery_time = ?;", (bad,))
    print("Updated rows (delivery_time = NULL for given value):", cur.rowcount)
else:
    cur.execute("UPDATE shop_product SET delivery_time = NULL;")
    print("Cleared delivery_time for all rows:", cur.rowcount)

conn.commit()
conn.close()