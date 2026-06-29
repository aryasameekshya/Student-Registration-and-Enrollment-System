from utils.db import get_db_connection
import mysql.connector

def migrate():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create departments table if not exists
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS departments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE
            )
        """)
        print("Departments table verified/created.")
    except Exception as e:
        print(f"Error creating departments table: {e}")

    # 2. Add new columns to courses table
    columns_to_add = [
        ("department", "VARCHAR(255)"),
        ("semester", "VARCHAR(50)"),
        ("course_type", "ENUM('Core', 'Elective', 'Lab') DEFAULT 'Core'"),
        ("is_active", "BOOLEAN DEFAULT TRUE")
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE courses ADD COLUMN {col_name} {col_type}")
            print(f"Added column {col_name} to courses.")
        except mysql.connector.Error as err:
            if err.errno == 1060: # Duplicate column name
                print(f"Column {col_name} already exists in courses.")
            else:
                print(f"Error adding {col_name}: {err}")

    # 3. Seed some initial departments based on what students might have entered
    try:
        cursor.execute("SELECT DISTINCT department FROM students WHERE department IS NOT NULL")
        existing_depts = cursor.fetchall()
        for (dept,) in existing_depts:
            if dept:
                cursor.execute("INSERT IGNORE INTO departments (name) VALUES (%s)", (dept,))
        print("Seeded departments from existing student records.")
    except Exception as e:
        print(f"Error seeding departments: {e}")

    conn.commit()
    cursor.close()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
