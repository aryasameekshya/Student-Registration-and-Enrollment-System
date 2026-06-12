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
    SELECT u.id, u.name, u.email, u.role, 
           s.jee_app_no, s.dob, s.gender, s.nationality, s.blood_group, 
           s.caste, s.aadhaar_no, s.is_disabled, 
           s.phone, s.address, s.semester, s.course, s.fee_status,
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

    # Fetch Enrollment Status
    cursor.execute("SELECT status FROM enrollments WHERE student_id = %s ORDER BY enrolled_at DESC LIMIT 1", (user_id,))
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
            sgpa_val = 8.2 + (user_id % 8) / 10.0
            cgpa_val = 8.4 + (user_id % 6) / 10.0
        else:
            # Balanced distribution: 15% have SGPA < 5, 85% have 5.0 to 9.5
            # Using a prime multiplier ensures small IDs don't all get the same bracket
            score_index = (user_id * 17) % 100
            if score_index < 15:
                # Low SGPA (3.5 to 4.9)
                sgpa_val = 3.5 + (user_id % 15) / 10.0
            else:
                # High SGPA (5.0 to 9.5)
                sgpa_val = 5.0 + (score_index % 46) / 10.0
            
            # CGPA Logic (Display only, no restrictions) - Range: 7.0 to 9.9
            cgpa_val = 7.0 + (user_id % 30) / 10.0
        
        profile['sgpa'] = f"{sgpa_val:.2f}"
        profile['cgpa'] = f"{cgpa_val:.2f}"
    elif enrollment_status == 'Approved':
        # JEE 26 students get fields only after approval
        profile['sgpa'] = 'N/A'
        profile['cgpa'] = 'N/A'
    else:
        profile['sgpa'] = None
        profile['cgpa'] = None

    print(f"DEBUG: Profile for user {user_id} has enrollment_status: {enrollment_status}, CGPA: {profile.get('cgpa')}")
    
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
        'phone', 'address', 'semester', 'course',
        'father_name', 'mother_name', 'father_occ', 'mother_occ', 'father_income',
        'jee_rank', 'tenth_percent', 'twelfth_percent', 
        'tenth_pass_year', 'twelfth_pass_year', 'fee_status'
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
            phone, address, semester, course,
            father_name, mother_name, father_occ, mother_occ, father_income,
            jee_rank, tenth_percent, twelfth_percent,
            tenth_pass_year, twelfth_pass_year, fee_status
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
            course = VALUES(course),
            father_name = VALUES(father_name),
            mother_name = VALUES(mother_name),
            father_occ = VALUES(father_occ),
            mother_occ = VALUES(mother_occ),
            father_income = VALUES(father_income),
            jee_rank = VALUES(jee_rank),
            tenth_percent = VALUES(tenth_percent),
            twelfth_percent = VALUES(twelfth_percent),
            tenth_pass_year = VALUES(tenth_pass_year),
            twelfth_pass_year = VALUES(twelfth_pass_year),
            fee_status = VALUES(fee_status)
        """
        cursor.execute(query, (
            user_id, values['gender'], values['nationality'], values['blood_group'], values['caste'], values['aadhaar_no'],
            values['phone'], values['address'], values['semester'], values['course'],
            values['father_name'], values['mother_name'], values['father_occ'], values['mother_occ'], values['father_income'],
            values['jee_rank'], values['tenth_percent'], values['twelfth_percent'],
            values['tenth_pass_year'], values['twelfth_pass_year'], values['fee_status']
        ))
        conn.commit()
        return jsonify({"message": "Profile updated"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@student_profile.route('/student/update-fee-status', methods=['POST'])
@login_required
def update_fee_status():
    user_id = session.get('user_id')
    data = request.json
    status = data.get('fee_status')
    
    if not status:
        return jsonify({"message": "Status is required"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE students SET fee_status = %s WHERE user_id = %s", (status, user_id))
        conn.commit()
        return jsonify({"message": "Fee status updated"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()
