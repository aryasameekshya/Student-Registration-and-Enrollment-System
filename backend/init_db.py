import mysql.connector
from config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

def init_db():
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        cursor = conn.cursor()
        
        # Drop existing tables if requested
        print("Dropping existing tables...")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        cursor.execute("DROP TABLE IF EXISTS student_documents")
        cursor.execute("DROP TABLE IF EXISTS students")
        cursor.execute("DROP TABLE IF EXISTS enrollments")
        cursor.execute("DROP TABLE IF EXISTS courses")
        cursor.execute("DROP TABLE IF EXISTS users")
        cursor.execute("DROP TABLE IF EXISTS notifications")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        
        # Create users table
        print("Creating users table...")
        create_users_table = """
        CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('student', 'admin') DEFAULT 'student',
            registration_step INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        cursor.execute(create_users_table)

        # Create courses table
        print("Creating courses table...")
        create_courses_table = """
        CREATE TABLE courses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            course_name VARCHAR(255) NOT NULL,
            course_code VARCHAR(50) UNIQUE,
            capacity INT DEFAULT 50,
            description TEXT,
            instructor VARCHAR(255),
            credits INT DEFAULT 3,
            prerequisites VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        cursor.execute(create_courses_table)

        # Create enrollments table
        print("Creating enrollments table...")
        create_enrollments_table = """
        CREATE TABLE enrollments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT,
            course_id INT,
            status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
            enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            UNIQUE KEY unique_enrollment (student_id, course_id)
        )
        """
        cursor.execute(create_enrollments_table)

        # Create students profile table
        print("Creating students profile table...")
        create_students_profile_table = """
        CREATE TABLE students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT UNIQUE,
            jee_app_no VARCHAR(50) UNIQUE,
            dob DATE,
            gender VARCHAR(20),
            nationality VARCHAR(100),
            blood_group VARCHAR(10),
            caste VARCHAR(50),
            aadhaar_no VARCHAR(20) UNIQUE,
            phone VARCHAR(20),
            address TEXT,
            father_name VARCHAR(255),
            mother_name VARCHAR(255),
            father_occ VARCHAR(255),
            mother_occ VARCHAR(255),
            father_income VARCHAR(100),
            is_disabled BOOLEAN DEFAULT FALSE,
            semester VARCHAR(50),
            jee_rank INT,
            tenth_percent DECIMAL(5,2),
            twelfth_percent DECIMAL(5,2),
            tenth_pass_year INT,
            twelfth_pass_year INT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """
        cursor.execute(create_students_profile_table)

        # Create student documents table
        print("Creating student documents table...")
        create_docs_table = """
        CREATE TABLE student_documents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            doc_type VARCHAR(100) NOT NULL,
            file_path TEXT NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """
        cursor.execute(create_docs_table)
        
        # Create notifications table
        print("Creating notifications table...")
        create_notifications_table = """
        CREATE TABLE notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            message TEXT NOT NULL,
            status ENUM('read', 'unread') DEFAULT 'unread',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """
        cursor.execute(create_notifications_table)

        conn.commit()
        print("Successfully initialized all database tables!")
        
    except mysql.connector.Error as err:
        print(f"Error initializing DB: {err}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals() and conn.is_connected():
            conn.close()

if __name__ == '__main__':
    init_db()
