from flask import Blueprint, request, jsonify, session
from utils.db import get_db_connection
from utils.auth import admin_required
import os

admin = Blueprint('admin', __name__)

@admin.route('/admin/dashboard', methods=['GET'])
@admin_required
def get_dashboard_stats():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Total Students
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'student'")
        total_students = cursor.fetchone()['count']
        
        # Total Courses
        cursor.execute("SELECT COUNT(*) as count FROM courses")
        total_courses = cursor.fetchone()['count']
        
        # Total Enrollments (Approved)
        cursor.execute("SELECT COUNT(*) as count FROM enrollments WHERE status = 'Approved'")
        total_enrollments = cursor.fetchone()['count']
        
        # Pending Enrollment Requests
        cursor.execute("SELECT COUNT(*) as count FROM enrollments WHERE status = 'Pending'")
        pending_requests = cursor.fetchone()['count']
        
        # Course-wise enrollment data for charts
        cursor.execute("SELECT course_name, course_code, capacity FROM courses")
        courses = cursor.fetchall()
        for course in courses:
            cursor.execute("SELECT COUNT(*) as count FROM enrollments WHERE course_id = (SELECT id FROM courses WHERE course_code = %s) AND status = 'Approved'", (course['course_code'],))
            course['enrolled'] = cursor.fetchone()['count']
            
        return jsonify({
            "stats": {
                "total_students": total_students,
                "total_courses": total_courses,
                "total_enrollments": total_enrollments,
                "pending_requests": pending_requests
            },
            "courses": courses
        })
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@admin.route('/admin/students', methods=['GET'])
@admin_required
def list_students():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT u.id, u.name, u.email, s.jee_app_no, s.caste
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
    WHERE u.role = 'student'
    """
    cursor.execute(query)
    students = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify(students)

@admin.route('/admin/student/<int:student_id>', methods=['GET'])
@admin_required
def get_student_detail(student_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT u.id, u.name, u.email, u.role, 
           s.jee_app_no, s.dob, s.gender, s.nationality, s.blood_group, 
           s.caste, s.aadhaar_no, s.is_disabled, 
           s.phone, s.address, s.semester,
           s.father_name, s.mother_name, s.father_occ, s.mother_occ, s.father_income,
           s.jee_rank, s.tenth_percent, s.twelfth_percent,
           s.tenth_pass_year, s.twelfth_pass_year
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
    WHERE u.id = %s
    """
    cursor.execute(query, (student_id,))
    profile = cursor.fetchone()
    
    cursor.execute("SELECT doc_type, file_path FROM student_documents WHERE user_id = %s", (student_id,))
    docs = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    if profile:
        profile['documents'] = [
            {"type": d['doc_type'], "url": f"/uploads/{os.path.basename(d['file_path'])}"} 
            for d in docs
        ]
        return jsonify(profile)
    
    return jsonify({"message": "Student not found"}), 404

@admin.route('/admin/student/delete/<int:student_id>', methods=['DELETE', 'POST'])
@admin_required
def delete_student(student_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM users WHERE id = %s AND role = 'student'", (student_id,))
        conn.commit()
        return jsonify({"message": "Student deleted successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

# Course Management
@admin.route('/admin/courses', methods=['GET'])
@admin_required
def get_courses():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM courses")
    courses = cursor.fetchall()
    
    for course in courses:
        cursor.execute("SELECT COUNT(*) as count FROM enrollments WHERE course_id = %s AND status = 'Approved'", (course['id'],))
        course['enrolled'] = cursor.fetchone()['count']
        
    cursor.close()
    conn.close()
    return jsonify(courses)

@admin.route('/admin/course/add', methods=['POST'])
@admin_required
def add_course():
    data = request.json
    course_name = data.get('course_name')
    course_code = data.get('course_code')
    capacity = data.get('capacity', 50)
    credits = data.get('credits', 3)
    prerequisites = data.get('prerequisites')
    description = data.get('description')
    instructor = data.get('instructor')

    if not course_name or not course_code:
        return jsonify({"message": "Course Name and Course Code are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO courses 
               (course_name, course_code, capacity, credits, prerequisites, description, instructor) 
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (course_name, course_code, capacity, credits, prerequisites, description, instructor)
        )
        conn.commit()
        return jsonify({"message": "Course added successfully"}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@admin.route('/admin/course/edit/<int:course_id>', methods=['POST'])
@admin_required
def edit_course(course_id):
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        update_fields = []
        values = []
        for field in ['course_name', 'course_code', 'capacity', 'credits', 'prerequisites', 'description', 'instructor']:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
        if not update_fields:
            return jsonify({"message": "No fields to update"}), 400
            
        values.append(course_id)
        query = f"UPDATE courses SET {', '.join(update_fields)} WHERE id = %s"
        
        cursor.execute(query, tuple(values))
        conn.commit()
        return jsonify({"message": "Course updated successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@admin.route('/admin/course/delete/<int:course_id>', methods=['POST', 'DELETE'])
@admin_required
def delete_course(course_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM courses WHERE id = %s", (course_id,))
        conn.commit()
        return jsonify({"message": "Course deleted successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

# Enrollment Management
@admin.route('/admin/enrollments', methods=['GET'])
@admin_required
def get_all_enrollments():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT e.id as enrollment_id, e.status, e.enrolled_at, 
               s.name as student_name, sp.jee_app_no,
               c.id as course_id, c.course_name, c.course_code, c.capacity
        FROM enrollments e
        JOIN users s ON e.student_id = s.id
        LEFT JOIN students sp ON s.id = sp.user_id
        JOIN courses c ON e.course_id = c.id
        ORDER BY e.enrolled_at DESC
    """)
    enrollments = cursor.fetchall()
    
    for enr in enrollments:
        cursor.execute("SELECT COUNT(*) as count FROM enrollments WHERE course_id = %s AND status = 'Approved'", (enr['course_id'],))
        enr['current_enrolled'] = cursor.fetchone()['count']
        
    cursor.close()
    conn.close()
    return jsonify(enrollments)

from routes.notification_routes import create_notification

@admin.route('/admin/enrollment/<action>/<int:enrollment_id>', methods=['POST'])
@admin_required
def manage_enrollment(action, enrollment_id):
    if action not in ['approve', 'reject']:
        return jsonify({"message": "Invalid action"}), 400

    new_status = 'Approved' if action == 'approve' else 'Rejected'
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Get student_id and course_name for notification
        cursor.execute("""
            SELECT e.student_id, c.course_name 
            FROM enrollments e 
            JOIN courses c ON e.course_id = c.id 
            WHERE e.id = %s
        """, (enrollment_id,))
        enr_info = cursor.fetchone()
        
        if not enr_info:
             return jsonify({"message": "Enrollment not found"}), 404

        if new_status == 'Approved':
            # Re-fetch course_id properly
            cursor.execute("SELECT course_id FROM enrollments WHERE id = %s", (enrollment_id,))
            real_enr = cursor.fetchone()
            course_id = real_enr['course_id']
            
            cursor.execute("SELECT capacity FROM courses WHERE id = %s", (course_id,))
            course = cursor.fetchone()
            
            cursor.execute("SELECT COUNT(*) as count FROM enrollments WHERE course_id = %s AND status = 'Approved'", (course_id,))
            enrolled = cursor.fetchone()['count']
            
            if enrolled >= course['capacity']:
                return jsonify({"message": "Cannot approve: Course at full capacity"}), 400

        cursor.execute("UPDATE enrollments SET status = %s WHERE id = %s", (new_status, enrollment_id))
        
        # Create Notification
        msg = f"Your enrollment for {enr_info['course_name']} has been {new_status}."
        create_notification(enr_info['student_id'], msg)
        
        conn.commit()
        return jsonify({"message": f"Enrollment {action}d successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

# --- REPORTS MODULE (Module 6) ---

@admin.route('/admin/reports/students', methods=['GET'])
@admin_required
def report_students():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # (Department breakdown removed as students haven't selected one yet)
        dept_data = []
        
        # Gender breakdown
        cursor.execute("SELECT gender, COUNT(*) as count FROM students GROUP BY gender")
        gender_data = cursor.fetchall()
        
        # Caste breakdown
        cursor.execute("SELECT caste, COUNT(*) as count FROM students GROUP BY caste")
        caste_data = cursor.fetchall()
        
        # JEE Rank Distribution (Summary)
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN jee_rank < 50000 THEN 'Top 50k'
                    WHEN jee_rank < 100000 THEN '50k - 100k'
                    WHEN jee_rank < 200000 THEN '100k - 200k'
                    ELSE '200k+'
                END as rank_range,
                COUNT(*) as count
            FROM students
            GROUP BY rank_range
        """)
        rank_data = cursor.fetchall()

        return jsonify({
            "departments": dept_data,
            "gender": gender_data,
            "caste": caste_data,
            "jee_ranks": rank_data
        })
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@admin.route('/admin/reports/courses', methods=['GET'])
@admin_required
def report_courses():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
        SELECT c.course_name, c.course_code, c.capacity, c.instructor, c.credits,
               (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'Approved') as enrolled_count,
               (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'Pending') as pending_count
        FROM courses c
        """
        cursor.execute(query)
        courses = cursor.fetchall()
        
        return jsonify(courses)
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@admin.route('/admin/reports/enrollments', methods=['GET'])
@admin_required
def report_enrollments():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Status distribution
        cursor.execute("SELECT status, COUNT(*) as count FROM enrollments GROUP BY status")
        status_data = cursor.fetchall()
        
        # Daily enrollment trend (last 15 days)
        cursor.execute("""
            SELECT DATE(enrolled_at) as date, COUNT(*) as count 
            FROM enrollments 
            WHERE enrolled_at >= DATE_SUB(CURDATE(), INTERVAL 15 DAY)
            GROUP BY DATE(enrolled_at)
            ORDER BY date ASC
        """)
        trend_data = cursor.fetchall()
        
        return jsonify({
            "status_distribution": status_data,
            "trend": trend_data
        })
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@admin.route('/admin/profile', methods=['GET'])
@admin_required
def get_admin_profile():
    user_id = session.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT name, email, role FROM users WHERE id = %s", (user_id,))
    profile = cursor.fetchone()
    cursor.close()
    conn.close()
    return jsonify(profile)

@admin.route('/admin/profile/update', methods=['POST'])
@admin_required
def update_admin_profile():
    user_id = session.get('user_id')
    data = request.json
    name = data.get('name')
    email = data.get('email')
    
    if not name or not email:
        return jsonify({"message": "Name and Email are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE users SET name = %s, email = %s WHERE id = %s", (name, email, user_id))
        conn.commit()
        return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()
