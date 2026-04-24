import mysql.connector
from config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

def migrate():
    print("Connecting to database...")
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    cursor = conn.cursor()
    
    try:
        print("Adding `status` column to `enrollments` table...")
        cursor.execute("ALTER TABLE enrollments ADD COLUMN status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending';")
        conn.commit()
        print("Migration successful.")
    except mysql.connector.Error as err:
        if err.errno == 1060: # Duplicate column name
            print("Column `status` already exists.")
        else:
            print(f"Error during migration: {err}")
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    migrate()
