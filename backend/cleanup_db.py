from utils.db import get_db_connection
import mysql.connector

def cleanup():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    columns_to_drop = ['jee_app_no', 'jee_rank']
    
    for col in columns_to_drop:
        try:
            cursor.execute(f"ALTER TABLE students DROP COLUMN {col}")
            print(f"Dropped column {col}")
        except mysql.connector.Error as err:
            print(f"Skipped {col}: {err}")
            
    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    cleanup()
