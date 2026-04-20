from flask import Blueprint, request, jsonify, session, current_app
import os
from utils.db import get_db_connection

student_profile = Blueprint('student_profile', __name__)

@student_profile.route('/student/profile', methods=['GET'])
def get_profile():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get user profile and student details
    query = """
    SELECT u.name, u.email, u.role, 
           s.jee_app_no, s.dob, s.gender, s.nationality, s.blood_group, 
           s.caste, s.aadhaar_no, s.is_disabled, 
           s.phone, s.address, s.department, s.semester,
           s.father_name, s.mother_name, s.father_occ, s.mother_occ, s.father_income,
           s.jee_rank, s.tenth_percent, s.twelfth_percent,
           s.tenth_pass_year, s.twelfth_pass_year
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
    WHERE u.id = %s
    """
    cursor.execute(query, (user_id,))
    profile = cursor.fetchone()
    
    # Fetch documents
    cursor.execute("SELECT doc_type, file_path FROM student_documents WHERE user_id = %s", (user_id,))
    docs = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    if not profile:
        return jsonify({"message": "Profile not found"}), 404
    
    # Process file paths into accessible URLs
    if profile:
        profile['documents'] = [
            {"type": d['doc_type'], "url": f"/uploads/{os.path.basename(d['file_path'])}"} 
            for d in docs
        ]
        
    return jsonify(profile)

@student_profile.route('/student/update', methods=['POST'])
def update_profile():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401
    
    data = request.json
    name = data.get('name')
    
    # Student fields
    fields = [
        'gender', 'nationality', 'blood_group', 'caste', 'aadhaar_no',
        'phone', 'address', 'department', 'semester',
        'father_name', 'mother_name', 'father_occ', 'mother_occ', 'father_income',
        'jee_rank', 'tenth_percent', 'twelfth_percent', 
        'tenth_pass_year', 'twelfth_pass_year'
    ]
    # Note: JEE App No and DOB are omitted here as per "verification only" preference
    
    values = {f: data.get(f) for f in fields}

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if name:
            cursor.execute("UPDATE users SET name = %s WHERE id = %s", (name, user_id))

        query = """
        INSERT INTO students (
            user_id, gender, nationality, blood_group, caste, aadhaar_no,
            phone, address, department, semester,
            father_name, mother_name, father_occ, mother_occ, father_income,
            jee_rank, tenth_percent, twelfth_percent,
            tenth_pass_year, twelfth_pass_year
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            gender = VALUES(gender),
            nationality = VALUES(nationality),
            blood_group = VALUES(blood_group),
            caste = VALUES(caste),
            aadhaar_no = VALUES(aadhaar_no),
            phone = VALUES(phone),
            address = VALUES(address),
            department = VALUES(department),
            semester = VALUES(semester),
            father_name = VALUES(father_name),
            mother_name = VALUES(mother_name),
            father_occ = VALUES(father_occ),
            mother_occ = VALUES(mother_occ),
            father_income = VALUES(father_income),
            jee_rank = VALUES(jee_rank),
            tenth_percent = VALUES(tenth_percent),
            twelfth_percent = VALUES(twelfth_percent),
            tenth_pass_year = VALUES(tenth_pass_year),
            twelfth_pass_year = VALUES(twelfth_pass_year)
        """
        cursor.execute(query, (
            user_id, values['gender'], values['nationality'], values['blood_group'], values['caste'], values['aadhaar_no'],
            values['phone'], values['address'], values['department'], values['semester'],
            values['father_name'], values['mother_name'], values['father_occ'], values['mother_occ'], values['father_income'],
            values['jee_rank'], values['tenth_percent'], values['twelfth_percent'],
            values['tenth_pass_year'], values['twelfth_pass_year']
        ))
        conn.commit()
        return jsonify({"message": "Profile updated"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@student_profile.route('/admin/students', methods=['GET'])
def admin_list_students():
    if session.get('role') != 'admin':
        return jsonify({"message": "Admin access required"}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT u.id, u.name, u.email, s.jee_app_no, s.department, s.caste
    FROM users u
    JOIN students s ON u.id = s.user_id
    WHERE u.role = 'student'
    """
    cursor.execute(query)
    students = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify(students)

@student_profile.route('/admin/student/<int:student_id>', methods=['GET'])
def admin_get_student_detail(student_id):
    if session.get('role') != 'admin':
        return jsonify({"message": "Admin access required"}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT u.name, u.email, u.role, 
           s.jee_app_no, s.dob, s.gender, s.nationality, s.blood_group, 
           s.caste, s.aadhaar_no, s.is_disabled, 
           s.phone, s.address, s.department, s.semester,
           s.father_name, s.mother_name, s.father_occ, s.mother_occ, s.father_income,
           s.jee_rank, s.tenth_percent, s.twelfth_percent,
           s.tenth_pass_year, s.twelfth_pass_year
    FROM users u
    JOIN students s ON u.id = s.user_id
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
