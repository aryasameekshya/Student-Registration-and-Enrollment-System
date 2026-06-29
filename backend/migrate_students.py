from utils.db import get_db_connection
import mysql.connector

def migrate():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    columns = [
        ('department', 'VARCHAR(255)'),
        ('program', 'VARCHAR(255)'),
        ('prev_sem_cgpa', 'DECIMAL(4,2)')
    ]
    
    for col_name, col_type in columns:
        try:
            cursor.execute(f"ALTER TABLE students ADD COLUMN {col_name} {col_type}")
            print(f"Added column {col_name}")
        except mysql.connector.Error as err:
            if err.errno == 1060: # Duplicate column name
                print(f"Column {col_name} already exists")
            else:
                print(f"Error adding {col_name}: {err}")
    
    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
