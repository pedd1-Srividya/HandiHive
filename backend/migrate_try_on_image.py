from sqlalchemy import inspect, text
from app.database import engine

inspector = inspect(engine)
columns = [column["name"] for column in inspector.get_columns("products")]

if "try_on_image" not in columns:
    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE products ADD COLUMN try_on_image VARCHAR(500) DEFAULT ''")
        )
    print("Successfully added try_on_image column.")
else:
    print("try_on_image column already exists. No changes needed.")