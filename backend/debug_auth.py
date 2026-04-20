import bcrypt
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def test_auth_logic():
    password = "password123"
    
    # 1. Test hashing
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    print(f"Hashed (bytes): {hashed}")
    
    # 2. Simulate storing as string (common DB behavior)
    hashed_str = hashed.decode('utf-8')
    print(f"Hashed (str): {hashed_str}")
    
    # 3. Test checking
    # This simulates what happens in login()
    is_valid = bcrypt.checkpw(password.encode('utf-8'), hashed_str.encode('utf-8'))
    print(f"Check validity (bytes vs str.encode): {is_valid}")

def test_db_connection():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME")
        )
        print("Successfully connected to MySQL!")
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"Tables in DB: {tables}")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"DB Connection Error: {e}")

if __name__ == "__main__":
    print("--- Testing Auth Logic ---")
    test_auth_logic()
    print("\n--- Testing DB Connection ---")
    test_db_connection()
