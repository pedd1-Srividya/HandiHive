import getpass

from app.database import SessionLocal
from app import models
from app.security import hash_password


def main():
    print("\nHandiHive Administrator Setup\n")

    name = input("Administrator name: ").strip()
    email = input("Administrator email: ").strip().lower()
    password = getpass.getpass("Administrator password: ")
    confirm = getpass.getpass("Confirm password: ")

    if not name or not email:
        print("Name and email are required.")
        return

    if len(password) < 8:
        print("Password must contain at least 8 characters.")
        return

    if password != confirm:
        print("Passwords do not match.")
        return

    db = SessionLocal()

    try:
        existing = db.query(models.User).filter_by(email=email).first()

        if existing:
            print("An account with this email already exists.")
            return

        admin = models.User(
            name=name,
            email=email,
            hashed_password=hash_password(password),
            role="admin",
            is_active=1,
            creator_id=None,
        )

        db.add(admin)
        db.commit()

        print("\nAdministrator account created successfully!")

    except Exception as error:
        db.rollback()
        print("Unable to create administrator:", error)

    finally:
        db.close()


if __name__ == "__main__":
    main()
