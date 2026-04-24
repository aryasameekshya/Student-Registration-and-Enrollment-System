import mysql.connector
from config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
try:
    conn = mysql.connector.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, database=DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SHOW COLUMNS FROM courses LIKE 'title'")
    if cursor.fetchone():
        cursor.execute("ALTER TABLE courses CHANGE title course_name VARCHAR(255) NOT NULL")
        print("Renamed title to course_name")
    cursor.execute("SHOW COLUMNS FROM courses LIKE 'course_code'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE courses ADD COLUMN course_code VARCHAR(50) UNIQUE AFTER course_name")
        print("Added course_code")
    cursor.execute("SHOW COLUMNS FROM courses LIKE 'capacity'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE courses ADD COLUMN capacity INT DEFAULT 50 AFTER course_code")
        print("Added capacity")
    cursor.execute("SHOW COLUMNS FROM courses LIKE 'prerequisites'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE courses ADD COLUMN prerequisites VARCHAR(255) AFTER credits")
        print("Added prerequisites")
    conn.commit()
    print("Migration successful.")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cursor' in locals(): cursor.close()
    if 'conn' in locals() and conn.is_connected(): conn.close()
