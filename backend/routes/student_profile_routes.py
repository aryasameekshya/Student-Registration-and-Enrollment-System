from flask import Blueprint, request, jsonify, session, current_app
import os
from utils.db import get_db_connection
from utils.auth import login_required

student_profile = Blueprint('student_profile', __name__)

@student_profile.route('/student/profile', methods=['GET'])
@login_required
def get_profile():
    user_id = session.get('user_id')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get user profile and student details
    query = """
    SELECT u.name, u.email, u.role, 
           s.dob, s.gender, s.nationality, s.blood_group, 
           s.caste, s.aadhaar_no, s.is_disabled, 
           s.phone, s.address, s.semester, s.department, s.program,
           s.father_name, s.mother_name, s.father_occ, s.mother_occ, s.father_income,
           s.tenth_percent, s.twelfth_percent,
           s.tenth_pass_year, s.twelfth_pass_year, s.prev_sem_cgpa
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
@login_required
def update_profile():
    user_id = session.get('user_id')
    
    data = request.json
    name = data.get('name')
    
    # Student fields
    fields = [
        'gender', 'nationality', 'blood_group', 'caste', 'aadhaar_no',
        'phone', 'address', 'semester', 'department', 'program',
        'father_name', 'mother_name', 'father_occ', 'mother_occ', 'father_income',
        'tenth_percent', 'twelfth_percent', 
        'tenth_pass_year', 'twelfth_pass_year', 'prev_sem_cgpa'
    ]
    
    values = {f: data.get(f) for f in fields}

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if name:
            cursor.execute("UPDATE users SET name = %s WHERE id = %s", (name, user_id))

        query = """
        INSERT INTO students (
            user_id, gender, nationality, blood_group, caste, aadhaar_no,
            phone, address, semester, department, program,
            father_name, mother_name, father_occ, mother_occ, father_income,
            tenth_percent, twelfth_percent,
            tenth_pass_year, twelfth_pass_year, prev_sem_cgpa
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            gender = VALUES(gender),
            nationality = VALUES(nationality),
            blood_group = VALUES(blood_group),
            caste = VALUES(caste),
            aadhaar_no = VALUES(aadhaar_no),
            phone = VALUES(phone),
            address = VALUES(address),
            semester = VALUES(semester),
            department = VALUES(department),
            program = VALUES(program),
            father_name = VALUES(father_name),
            mother_name = VALUES(mother_name),
            father_occ = VALUES(father_occ),
            mother_occ = VALUES(mother_occ),
            father_income = VALUES(father_income),
            tenth_percent = VALUES(tenth_percent),
            twelfth_percent = VALUES(twelfth_percent),
            tenth_pass_year = VALUES(tenth_pass_year),
            twelfth_pass_year = VALUES(twelfth_pass_year),
            prev_sem_cgpa = VALUES(prev_sem_cgpa)
        """
        cursor.execute(query, (
            user_id, values['gender'], values['nationality'], values['blood_group'], values['caste'], values['aadhaar_no'],
            values['phone'], values['address'], values['semester'], values['department'], values['program'],
            values['father_name'], values['mother_name'], values['father_occ'], values['mother_occ'], values['father_income'],
            values['tenth_percent'], values['twelfth_percent'],
            values['tenth_pass_year'], values['twelfth_pass_year'], values['prev_sem_cgpa']
        ))
        conn.commit()
        return jsonify({"message": "Profile updated"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()
