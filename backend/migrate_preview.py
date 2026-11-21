from sqlalchemy import inspect, text
from app.database import engine

columns = [
    column["name"]
    for column in inspect(engine).get_columns("custom_orders")
]

if "preview_image" not in columns:
    with engine.begin() as conn:
        conn.execute(
            text("ALTER TABLE custom_orders ADD COLUMN preview_image TEXT")
        )
    print("SUCCESS: preview_image column added.")
else:
    print("preview_image column already exists.")