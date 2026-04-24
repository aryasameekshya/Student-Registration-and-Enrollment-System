"""
Seed script to create a test admin user.
Run once: python seed_admin.py
"""
import bcrypt
from utils.db import get_db_connection

ADMIN_EMAIL = "admin@outr.ac.in"
ADMIN_PASSWORD = "admin123"
ADMIN_NAME = "Admin User"

def seed_admin():
    hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (name, email, password, role, registration_step) VALUES (%s, %s, %s, 'admin', 7) "
            "ON DUPLICATE KEY UPDATE name = VALUES(name)",
            (ADMIN_NAME, ADMIN_EMAIL, hashed)
        )
        conn.commit()
        print(f"Admin user created: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print("Admin Secret Key: admin123")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    seed_admin()
