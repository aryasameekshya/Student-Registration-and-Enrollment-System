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
        # Total Students (JEE 26 only)
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE u.role = 'student' AND s.jee_app_no LIKE '26%'
        """)
        total_students = cursor.fetchone()['count']
        
        # Total Courses (Keep all courses)
        cursor.execute("SELECT COUNT(*) as count FROM courses")
        total_courses = cursor.fetchone()['count']
        
        # Total Enrollments (Approved JEE 26 only)
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM enrollments e
            JOIN students s ON e.student_id = s.user_id
            WHERE e.status = 'Approved' AND s.jee_app_no LIKE '26%'
        """)
        total_enrollments = cursor.fetchone()['count']
        
        # Pending Enrollment Requests (JEE 26 only)
        query_pending = """
            SELECT (
                SELECT COUNT(*) FROM enrollments e
                JOIN students s ON e.student_id = s.user_id
                WHERE e.status = 'Pending' AND s.jee_app_no LIKE '26%'
            ) + (
                SELECT COUNT(*) FROM students s
                WHERE s.course IS NOT NULL 
                AND s.jee_app_no LIKE '26%'
                AND NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = s.user_id)
            ) as count
        """
        cursor.execute(query_pending)
        pending_requests = cursor.fetchone()['count']
        
        # Course-wise enrollment data for charts (JEE 26 only)
        cursor.execute("SELECT id, course_name, course_code, capacity FROM courses")
        courses = cursor.fetchall()
        for course in courses:
            cursor.execute("""
                SELECT COUNT(*) as count 
                FROM enrollments e
                JOIN students s ON e.student_id = s.user_id
                WHERE e.course_id = %s AND e.status = 'Approved' AND s.jee_app_no LIKE '26%'
            """, (course['id'],))
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
    SELECT u.id, u.name, u.email, s.jee_app_no, s.course as branch
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
    WHERE u.role = 'student' AND s.jee_app_no LIKE '26%'
    ORDER BY s.course ASC
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
           s.phone, s.address, s.semester, s.course,
           s.father_name, s.mother_name, s.father_occ, s.mother_occ, s.father_income,
           s.jee_rank, s.tenth_percent, s.twelfth_percent,
           s.tenth_pass_year, s.twelfth_pass_year
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
    WHERE u.id = %s
    """
    cursor.execute(query, (student_id,))
    profile = cursor.fetchone()
    
    # Fetch Enrollment Status
    cursor.execute("SELECT status FROM enrollments WHERE student_id = %s ORDER BY enrolled_at DESC LIMIT 1", (student_id,))
    enr_res = cursor.fetchone()
    
    jee_no = str(profile.get('jee_app_no') or '')
    is_2026 = jee_no.startswith('26')
    
    if not is_2026 and profile.get('course'):
        enrollment_status = 'Approved'
    else:
        enrollment_status = enr_res['status'] if enr_res else ('Pending' if profile.get('course') else 'Not Applied')
        
    profile['enrollment_status'] = enrollment_status
    
    # Grade Logic
    if not is_2026:
        # SGPA Logic (Used for restrictions)
        if profile.get('name') and profile.get('name').strip().lower() == 'mahavijaya das':
            sgpa_val = 8.2 + (student_id % 8) / 10.0
            cgpa_val = 8.4 + (student_id % 6) / 10.0
        else:
            # Balanced distribution: 15% have SGPA < 5, 85% have 5.0 to 9.5
            # Using a prime multiplier ensures small IDs don't all get the same bracket
            score_index = (student_id * 17) % 100
            if score_index < 15:
                # Low SGPA (3.5 to 4.9)
                sgpa_val = 3.5 + (student_id % 15) / 10.0
            else:
                # High SGPA (5.0 to 9.5)
                sgpa_val = 5.0 + (score_index % 46) / 10.0
            
            # CGPA Logic (Display only, no restrictions) - Range: 7.0 to 9.9
            cgpa_val = 7.0 + (student_id % 30) / 10.0
        
        profile['sgpa'] = f"{sgpa_val:.2f}"
        profile['cgpa'] = f"{cgpa_val:.2f}"
    elif enrollment_status == 'Approved':
        # JEE 26 students get fields only after approval
        profile['sgpa'] = 'N/A'
        profile['cgpa'] = 'N/A'
    else:
        profile['sgpa'] = None
        profile['cgpa'] = None
    
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
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM enrollments e
            JOIN students s ON e.student_id = s.user_id
            WHERE e.course_id = %s AND e.status = 'Approved' AND s.jee_app_no LIKE '26%'
        """, (course['id'],))
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
    try:
        cursor.execute("""
            SELECT * FROM (
                SELECT 
                    'Subject' as type,
                    e.id as enrollment_id, e.status, 
                    CASE 
                        WHEN sp.jee_app_no REGEXP '^[0-9]{2}' THEN STR_TO_DATE(CONCAT('20', SUBSTRING(sp.jee_app_no, 1, 2), '-04-30'), '%Y-%m-%d')
                        ELSE e.enrolled_at
                    END as enrolled_at,
                    s.name as student_name, sp.jee_app_no, 
                    CASE 
                        WHEN sp.jee_app_no NOT LIKE '26%' THEN 'Paid'
                        ELSE COALESCE(sp.fee_status, 'Unpaid')
                    END as fee_status,
                    c.id as course_id, c.course_name, c.course_code, c.capacity
                FROM enrollments e
                JOIN users s ON e.student_id = s.id
                LEFT JOIN students sp ON s.id = sp.user_id
                JOIN courses c ON e.course_id = c.id
                
                UNION ALL
                
                SELECT 
                    'Admission' as type,
                    sp.user_id as enrollment_id, 'Pending' as status, 
                    CASE 
                        WHEN sp.jee_app_no REGEXP '^[0-9]{2}' THEN STR_TO_DATE(CONCAT('20', SUBSTRING(sp.jee_app_no, 1, 2), '-04-30'), '%Y-%m-%d')
                        ELSE CURDATE()
                    END as enrolled_at,
                    u.name as student_name, sp.jee_app_no, 
                    CASE 
                        WHEN sp.jee_app_no NOT LIKE '26%' THEN 'Paid'
                        ELSE COALESCE(sp.fee_status, 'Unpaid')
                    END as fee_status,
                    0 as course_id, sp.course as course_name, 'BRANCH' as course_code, 120 as capacity
                FROM students sp
                JOIN users u ON sp.user_id = u.id
                WHERE sp.course IS NOT NULL 
                AND NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = sp.user_id)
            ) as t
            WHERE t.jee_app_no LIKE '26%'
            ORDER BY t.course_name ASC, t.enrolled_at DESC
        """)
        enrollments = cursor.fetchall()
        
        for enr in enrollments:
            cursor.execute("SELECT COUNT(*) as count FROM enrollments WHERE course_id = %s AND status = 'Approved'", (enr['course_id'],))
            current_enrolled = cursor.fetchone()['count']
            enr['current_enrolled'] = current_enrolled
            enr['remaining_seats'] = enr['capacity'] - current_enrolled
            
        return jsonify(enrollments)
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

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
        
        is_new_enrollment = False
        if not enr_info:
            # Check if it's an initial branch admission request (where enrollment_id is actually user_id)
            cursor.execute("SELECT user_id, course FROM students WHERE user_id = %s", (enrollment_id,))
            student_info = cursor.fetchone()
            
            if student_info and student_info['course']:
                # Find matching course_id for the branch (handle case-insensitivity and common codes)
                branch_query = student_info['course'].upper()
                print(f"DEBUG: Searching for branch matching: '{branch_query}'")
                
                cursor.execute("SELECT id, course_name, course_code FROM courses")
                all_courses = cursor.fetchall()
                print(f"DEBUG: Available courses in DB: {all_courses}")

                cursor.execute("""
                    SELECT id FROM courses 
                    WHERE UPPER(course_code) = %s 
                    OR UPPER(course_name) = %s 
                    OR UPPER(course_name) LIKE %s 
                    LIMIT 1
                """, (branch_query, branch_query, f"%{branch_query}%"))
                course_res = cursor.fetchone()
                print(f"DEBUG: Found course_id: {course_res}")
                
                if course_res:
                    course_id = course_res['id']
                    if action == 'approve':
                        # Check capacity
                        cursor.execute("SELECT capacity FROM courses WHERE id = %s", (course_id,))
                        course_cap = cursor.fetchone()
                        cursor.execute("SELECT COUNT(*) as count FROM enrollments WHERE course_id = %s AND status = 'Approved'", (course_id,))
                        enrolled_count = cursor.fetchone()['count']
                        
                        if enrolled_count >= course_cap['capacity']:
                            return jsonify({"message": "Cannot approve: Branch/Course at full capacity"}), 400
                        
                        status = 'Approved'
                    else:
                        status = 'Rejected'
                        
                    cursor.execute(
                        "INSERT INTO enrollments (student_id, course_id, status, enrolled_at) VALUES (%s, %s, %s, CURDATE())",
                        (enrollment_id, course_id, status)
                    )
                    enr_info = {'student_id': enrollment_id, 'course_name': student_info['course']}
                    new_status = status
                    is_new_enrollment = True
                else:
                    return jsonify({
                        "message": f"Branch '{branch_query}' not found. Available: {[c['course_name'] for c in all_courses]} (Codes: {[c['course_code'] for c in all_courses]})"
                    }), 404
            else:
                return jsonify({"message": "Enrollment request not found"}), 404

        if new_status == 'Approved' and not is_new_enrollment:
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
        # Department (Course) breakdown (JEE 26 only)
        cursor.execute("SELECT course, COUNT(*) as count FROM students WHERE course IS NOT NULL AND jee_app_no LIKE '26%' GROUP BY course")
        dept_data = cursor.fetchall()
        
        # Gender breakdown (JEE 26 only)
        cursor.execute("SELECT gender, COUNT(*) as count FROM students WHERE jee_app_no LIKE '26%' GROUP BY gender")
        gender_data = cursor.fetchall()
        
        # Caste breakdown (JEE 26 only)
        cursor.execute("SELECT caste, COUNT(*) as count FROM students WHERE jee_app_no LIKE '26%' GROUP BY caste")
        caste_data = cursor.fetchall()
        
        # JEE Rank Distribution (JEE 26 only)
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
            WHERE jee_app_no LIKE '26%'
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
               (
                   SELECT COUNT(*) FROM enrollments e
                   JOIN students s ON e.student_id = s.user_id
                   WHERE e.course_id = c.id AND e.status = 'Approved' AND s.jee_app_no LIKE '26%'
               ) as enrolled_count,
               (
                   SELECT COUNT(*) FROM enrollments e
                   JOIN students s ON e.student_id = s.user_id
                   WHERE e.course_id = c.id AND e.status = 'Pending' AND s.jee_app_no LIKE '26%'
               ) + (
                   SELECT COUNT(*) FROM students s
                   WHERE (
                       UPPER(s.course) = UPPER(c.course_code) 
                       OR UPPER(s.course) = UPPER(c.course_name)
                       OR UPPER(c.course_name) LIKE CONCAT('%', UPPER(s.course), '%')
                       OR UPPER(s.course) LIKE CONCAT('%', UPPER(c.course_code), '%')
                   )
                   AND s.jee_app_no LIKE '26%'
                   AND NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = s.user_id)
               ) as pending_count
        FROM courses c
        ORDER BY c.course_name ASC
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
        # Status distribution (JEE 26 only)
        cursor.execute("""
            SELECT e.status, COUNT(*) as count 
            FROM enrollments e
            JOIN students s ON e.student_id = s.user_id
            WHERE s.jee_app_no LIKE '26%'
            GROUP BY e.status
        """)
        status_data = cursor.fetchall()
        
        # Add initial branch admission requests as 'Pending' (JEE 26 only)
        cursor.execute("""
            SELECT COUNT(*) as count FROM students 
            WHERE course IS NOT NULL 
            AND jee_app_no LIKE '26%'
            AND NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = students.user_id)
        """)
        pending_admission_count = cursor.fetchone()['count']
        
        if pending_admission_count > 0:
            found_pending = False
            for item in status_data:
                if item['status'] == 'Pending':
                    item['count'] += pending_admission_count
                    found_pending = True
                    break
            if not found_pending:
                status_data.append({'status': 'Pending', 'count': pending_admission_count})
        
        # Daily enrollment trend (last 15 days, JEE 26 only)
        cursor.execute("""
            SELECT DATE(e.enrolled_at) as date, COUNT(*) as count 
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            WHERE e.enrolled_at >= DATE_SUB(CURDATE(), INTERVAL 15 DAY)
            AND s.jee_app_no LIKE '26%'
            GROUP BY DATE(e.enrolled_at)
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
