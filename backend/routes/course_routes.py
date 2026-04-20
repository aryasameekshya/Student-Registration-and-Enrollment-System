from flask import Blueprint, request, jsonify, session
from utils.db import get_db_connection

courses_bp = Blueprint('courses', __name__)

@courses_bp.route('/courses', methods=['GET'])
def get_courses():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM courses")
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(courses)

@courses_bp.route('/courses', methods=['POST'])
def add_course():
    if session.get('role') != 'admin':
        return jsonify({"message": "Unauthorized"}), 403
    
    data = request.json
    title = data.get('title')
    description = data.get('description')
    instructor = data.get('instructor')
    credits = data.get('credits', 3)

    if not title:
        return jsonify({"message": "Title is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO courses (title, description, instructor, credits) VALUES (%s, %s, %s, %s)",
            (title, description, instructor, credits)
        )
        conn.commit()
        return jsonify({"message": "Course added successfully"}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@courses_bp.route('/enroll', methods=['POST'])
def enroll():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"message": "Login required"}), 401
    
    data = request.json
    course_id = data.get('course_id')
    
    if not course_id:
        return jsonify({"message": "Course ID is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO enrollments (student_id, course_id) VALUES (%s, %s)",
            (user_id, course_id)
        )
        conn.commit()
        return jsonify({"message": "Enrolled successfully"}), 201
    except Exception as e:
        return jsonify({"message": "Already enrolled in this course"}), 400
    finally:
        cursor.close()
        conn.close()

@courses_bp.route('/my-enrollments', methods=['GET'])
def get_my_enrollments():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"message": "Login required"}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT c.* FROM courses c
        JOIN enrollments e ON c.id = e.course_id
        WHERE e.student_id = %s
    """, (user_id,))
    enrolled_courses = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(enrolled_courses)
