
from sqlalchemy import text
from app.database import engine

with engine.begin() as connection:
    columns = connection.execute(
        text("PRAGMA table_info(creators)")
    ).fetchall()

    column_names = [column[1] for column in columns]

    if "profile_image" not in column_names:
        connection.execute(
            text(
                "ALTER TABLE creators "
                "ADD COLUMN profile_image VARCHAR(500) DEFAULT ''"
            )
        )
        print("Successfully added profile_image column.")
    else:
        print("profile_image column already exists.")
