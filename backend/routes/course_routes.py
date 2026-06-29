from flask import Blueprint, request, jsonify, session
from utils.db import get_db_connection
from utils.auth import login_required

courses_bp = Blueprint('courses', __name__)

@courses_bp.route('/courses', methods=['GET'])
@login_required
def get_courses():
    user_id = session.get('user_id')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Fetch all courses
    cursor.execute("SELECT * FROM courses")
    courses = cursor.fetchall()
    
    # For each course, check if student is enrolled or has a pending request
    for course in courses:
        cursor.execute(
            "SELECT status FROM enrollments WHERE student_id = %s AND course_id = %s",
            (user_id, course['id'])
        )
        enrollment = cursor.fetchone()
        course['enrollment_status'] = enrollment['status'] if enrollment else 'Not Enrolled'
        
        # Current approved count for capacity display
        cursor.execute(
            "SELECT COUNT(*) as count FROM enrollments WHERE course_id = %s AND status = 'Approved'",
            (course['id'],)
        )
        course['enrolled_count'] = cursor.fetchone()['count']

    cursor.close()
    conn.close()
    return jsonify(courses)

@courses_bp.route('/course/enroll/<int:course_id>', methods=['POST'])
@login_required
def enroll_course(course_id):
    user_id = session.get('user_id')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 1. Check if course exists and get capacity/prerequisites
        cursor.execute("SELECT * FROM courses WHERE id = %s", (course_id,))
        course = cursor.fetchone()
        if not course:
            return jsonify({"message": "Course not found"}), 404
            
        # 2. Prevent duplicate enrollment or pending request
        cursor.execute("SELECT status FROM enrollments WHERE student_id = %s AND course_id = %s", (user_id, course_id))
        existing = cursor.fetchone()
        if existing:
            return jsonify({"message": f"You already have a '{existing['status']}' enrollment for this course."}), 400

        # 3. Capacity check (Check approved enrollments)
        cursor.execute("SELECT COUNT(*) as count FROM enrollments WHERE course_id = %s AND status = 'Approved'", (course_id,))
        approved_count = cursor.fetchone()['count']
        if approved_count >= course['capacity']:
            return jsonify({"message": "Course is already at full capacity."}), 400

        # 4. Prerequisite validation
        prereqs_str = course.get('prerequisites')
        if prereqs_str and prereqs_str.strip() and prereqs_str.lower() != 'none':
            # Split prerequisites (e.g. "CS101, CS102")
            prereqs_list = [p.strip() for p in prereqs_str.split(',') if p.strip()]
            
            for prereq_code in prereqs_list:
                # Check if student has an 'Approved' enrollment for this course code
                cursor.execute("""
                    SELECT e.status 
                    FROM enrollments e
                    JOIN courses c ON e.course_id = c.id
                    WHERE e.student_id = %s AND c.course_code = %s AND e.status = 'Approved'
                """, (user_id, prereq_code))
                
                if not cursor.fetchone():
                    return jsonify({"message": f"Prerequisite not met: You must complete {prereq_code} first."}), 400
            
        # 5. Insert enrollment with 'Pending' status
        cursor.execute(
            "INSERT INTO enrollments (student_id, course_id, status) VALUES (%s, %s, 'Pending')",
            (user_id, course_id)
        )
        conn.commit()
        return jsonify({"message": "Enrollment request submitted successfully"}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@courses_bp.route('/course/drop/<int:course_id>', methods=['POST'])
@login_required
def drop_course(course_id):
    user_id = session.get('user_id')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "DELETE FROM enrollments WHERE student_id = %s AND course_id = %s",
            (user_id, course_id)
        )
        conn.commit()
        return jsonify({"message": "Course dropped successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()
@courses_bp.route('/student/enrollment-stats', methods=['GET'])
@login_required
def get_student_stats():
    user_id = session.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get semester
        cursor.execute("SELECT semester FROM students WHERE user_id = %s", (user_id,))
        student_data = cursor.fetchone()
        semester = student_data['semester'] if student_data else 'N/A'
        
        # Get enrollment counts
        cursor.execute("SELECT status, COUNT(*) as count FROM enrollments WHERE student_id = %s GROUP BY status", (user_id,))
        enrollments = cursor.fetchall()
        
        stats = {
            "semester": semester,
            "total": sum(e['count'] for e in enrollments),
            "pending": next((e['count'] for e in enrollments if e['status'] == 'Pending'), 0),
            "approved": next((e['count'] for e in enrollments if e['status'] == 'Approved'), 0),
            "rejected": next((e['count'] for e in enrollments if e['status'] == 'Rejected'), 0)
        }
        
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@courses_bp.route('/student/my-enrollments', methods=['GET'])
@login_required
def get_my_enrollments():
    user_id = session.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
        SELECT e.status, e.enrolled_at, c.course_name, c.course_code 
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = %s
        ORDER BY e.enrolled_at DESC
        """
        cursor.execute(query, (user_id,))
        enrollments = cursor.fetchall()
        return jsonify(enrollments), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()
