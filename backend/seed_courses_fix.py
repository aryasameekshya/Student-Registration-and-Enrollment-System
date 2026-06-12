import mysql.connector
from config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

def seed_courses():
    courses = [
        ('Computer Science & Engineering', 'CSE', 120, 'Focuses on computation, programming, algorithms, and data structures.', 'TBD', 4),
        ('Information Technology', 'IT', 120, 'Emphasis on software development, networking, and information systems.', 'TBD', 4),
        ('Artificial Intelligence & Machine Learning', 'AIML', 60, 'Cutting-edge branch focusing on intelligent systems.', 'TBD', 4),
        ('Electrical Engineering', 'EE', 120, 'Deals with the study of electricity, electronics, and electromagnetism.', 'TBD', 4),
        ('Electronics & Telecommunication', 'ETC', 120, 'Covers electronic circuits, communication systems, and signal processing.', 'TBD', 4),
        ('Mechanical Engineering', 'ME', 120, 'Focuses on design, analysis, and manufacturing of mechanical systems.', 'TBD', 4),
        ('Civil Engineering', 'CE', 120, 'Involves planning, design, and construction of infrastructure.', 'TBD', 4),
        ('Biotechnology', 'BT', 60, 'Combines biology with technology for healthcare and agriculture.', 'TBD', 4)
    ]
    
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        cursor = conn.cursor()
        
        # Clear existing courses just in case
        cursor.execute("DELETE FROM courses")
        
        query = "INSERT INTO courses (course_name, course_code, capacity, description, instructor, credits) VALUES (%s, %s, %s, %s, %s, %s)"
        cursor.executemany(query, courses)
        
        conn.commit()
        print(f"Successfully seeded {len(courses)} courses!")
        
    except mysql.connector.Error as err:
        print(f"Error seeding courses: {err}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

if __name__ == '__main__':
    seed_courses()
