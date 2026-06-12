import mysql.connector
from config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

def migrate():
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        cursor = conn.cursor()
        
        print("Checking if 'course' column exists in 'students' table...")
        cursor.execute("SHOW COLUMNS FROM students LIKE 'course'")
        result = cursor.fetchone()
        
        if not result:
            print("Adding 'course' column to 'students' table...")
            cursor.execute("ALTER TABLE students ADD COLUMN course VARCHAR(100) AFTER semester")
            conn.commit()
            print("Successfully added 'course' column!")
        else:
            print("'course' column already exists.")
            
    except mysql.connector.Error as err:
        print(f"Error during migration: {err}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals() and conn.is_connected():
            conn.close()

if __name__ == '__main__':
    migrate()
