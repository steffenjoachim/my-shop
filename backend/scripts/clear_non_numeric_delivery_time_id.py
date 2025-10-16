import sqlite3
db = "db.sqlite3"
conn = sqlite3.connect(db)
cur = conn.cursor()
# Setze alle delivery_time_id-Werte, die keine reine Zahl sind, auf NULL
cur.execute("""
    UPDATE shop_product
    SET delivery_time_id = NULL
    WHERE delivery_time_id IS NOT NULL
      AND delivery_time_id NOT GLOB '[0-9]*';
""")
conn.commit()
print("Updated rows (delivery_time_id -> NULL for non-numeric):", cur.rowcount)
conn.close()