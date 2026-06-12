from flask import Blueprint, request, jsonify, session, current_app
import os
import uuid
from werkzeug.utils import secure_filename
from utils.db import get_db_connection
import bcrypt
from itsdangerous import URLSafeTimedSerializer
from flask_mail import Message

auth = Blueprint('auth', __name__)

ADMIN_SECRET_KEY = "admin123"

@auth.route('/register', methods=['POST'])
def register():
    data = request.json

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student')
    admin_key = data.get('admin_key')

    if not name or not email or not password:
        return jsonify({"message": "Missing required fields"}), 400

    # Security Check for Admin registration
    if role == 'admin' and admin_key != ADMIN_SECRET_KEY:
        return jsonify({"message": "Invalid Admin Secret Key"}), 403

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO users (name, email, password, role, registration_step) VALUES (%s,%s,%s,%s, 3)",
            (name, email, hashed, role)
        )
        conn.commit()
        user_id = cursor.lastrowid
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "User registered", "id": user_id, "registration_step": 3}), 201


@auth.route('/login', methods=['POST'])
def login():
    data = request.json
    identifier = data.get('identifier')
    password = data.get('password')
    role = data.get('role', 'student')
    admin_key = data.get('admin_key')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    user = None
    if role == 'student':
        # Find user by JEE Application Number OR Email
        query = """
        SELECT u.*, s.jee_app_no FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        WHERE (s.jee_app_no = %s OR u.email = %s) AND u.role = 'student'
        """
        cursor.execute(query, (identifier, identifier))
        user = cursor.fetchone()
    else:
        # Find user by Email (for Admins)
        cursor.execute("SELECT * FROM users WHERE email=%s AND role = 'admin'", (identifier,))
        user = cursor.fetchone()

    cursor.close()
    conn.close()

    if user:
        if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            # Security Check for Admin login
            if user['role'] == 'admin' and admin_key != ADMIN_SECRET_KEY:
                return jsonify({"message": "Admin login requires a valid Secret Key"}), 403
            
            # Ensure role matches
            if user['role'] != role:
                return jsonify({"message": f"This account is registered as a {user['role']}"}), 403

            session['user_id'] = user['id']
            session['role'] = user['role']
            return jsonify({
                "message": "Login success",
                "user": {
                    "id": user['id'],
                    "name": user['name'],
                    "email": user['email'],
                    "role": user['role'],
                    "registration_step": user.get('registration_step', 7),
                    "jee_app_no": user.get('jee_app_no')
                }
            })

    return jsonify({"message": "Invalid credentials"}), 401

@auth.route('/register/details', methods=['POST'])
def register_details():
    data = request.json
    user_id = data.get('user_id')
    current_step = data.get('current_step')
    
    if not user_id:
        return jsonify({"message": "User ID required"}), 400

    # Fields to extract
    fields = [
        'jee_app_no', 'dob', 'gender', 'nationality', 'blood_group', 
        'caste', 'aadhaar_no', 'phone', 'address', 'semester', 'course',
        'father_name', 'mother_name', 'father_occ', 'mother_occ', 'father_income',
        'is_disabled', 'jee_rank', 'tenth_percent', 'twelfth_percent', 
        'tenth_pass_year', 'twelfth_pass_year'
    ]
    
    # Sanitize: convert empty strings to None (NULL in MySQL) for numerical/date fields
    values = {}
    for field in fields:
        val = data.get(field)
        if val == "" or val == "N/A":
            values[field] = None
        else:
            values[field] = val
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if student record exists, then upsert
        query = """
        INSERT INTO students (
            user_id, jee_app_no, dob, gender, nationality, blood_group, 
            caste, aadhaar_no, phone, address, semester, course,
            father_name, mother_name, father_occ, mother_occ, father_income,
            is_disabled, jee_rank, tenth_percent, twelfth_percent, 
            tenth_pass_year, twelfth_pass_year
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            jee_app_no = VALUES(jee_app_no),
            dob = VALUES(dob),
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
            is_disabled = VALUES(is_disabled),
            jee_rank = VALUES(jee_rank),
            tenth_percent = VALUES(tenth_percent),
            twelfth_percent = VALUES(twelfth_percent),
            tenth_pass_year = VALUES(tenth_pass_year),
            twelfth_pass_year = VALUES(twelfth_pass_year)
        """
        cursor.execute(query, (
            user_id, values['jee_app_no'], values['dob'], values['gender'], values['nationality'], values['blood_group'],
            values['caste'], values['aadhaar_no'], values['phone'], values['address'], values['semester'], values['course'],
            values['father_name'], values['mother_name'], values['father_occ'], values['mother_occ'], values['father_income'],
            values['is_disabled'], values['jee_rank'], values['tenth_percent'], values['twelfth_percent'],
            values['tenth_pass_year'], values['twelfth_pass_year']
        ))
        
        # Determine next step
        next_step = int(current_step) + 1 if current_step else None
        
        # Update registration step and name if provided
        if next_step:
            cursor.execute("UPDATE users SET registration_step = %s, name = %s WHERE id = %s", (next_step, values.get('name') or data.get('name'), user_id))
            
        conn.commit()
        return jsonify({"message": "Details saved successfully", "registration_step": next_step}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@auth.route('/register/upload', methods=['POST'])
def upload_document():
    if 'file' not in request.files:
        return jsonify({"message": "No file part"}), 400
    
    file = request.files['file']
    user_id = request.form.get('user_id')
    doc_type = request.form.get('doc_type')

    if file.filename == '' or not user_id or not doc_type:
        return jsonify({"message": "Missing file, user_id or doc_type"}), 400

    filename = secure_filename(f"{user_id}_{doc_type}_{uuid.uuid4().hex}_{file.filename}")
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "INSERT INTO student_documents (user_id, doc_type, file_path) VALUES (%s, %s, %s)",
            (user_id, doc_type, filepath)
        )
        # Check if all mandatory documents are uploaded to mark complete
        # For simplicity, if this is called, we can check or just update step if frontend says so
        is_last = request.form.get('is_last') == 'true'
        if is_last:
            cursor.execute("UPDATE users SET registration_step = 7 WHERE id = %s", (user_id,))
            
        conn.commit()
        return jsonify({"message": "File uploaded successfully", "path": filepath}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@auth.route('/logout', methods=['GET'])
def logout():
    session.pop('user_id', None)
    session.pop('role', None)
    return jsonify({"message": "Logged out successfully"}), 200

# Password Reset Logic
def get_serializer():
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'])

@auth.route('/forgot-password', methods=['POST'])
def forgot_password():
    email = request.json.get('email')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user:
        s = get_serializer()
        token = s.dumps(email, salt='password-reset-salt')
        link = f"http://localhost:5173/reset-password/{token}"
        
        try:
            msg = Message("Password Reset Request",
                          recipients=[email])
            msg.body = f"To reset your password, click the following link: {link}\n\nIf you did not make this request, simply ignore this email."
            current_app.mail.send(msg)
            return jsonify({"message": "Reset link sent to your email"}), 200
        except Exception as e:
            # For development, if mail fails, still show the link in console/message
            print(f"FAILED TO SEND EMAIL: {e}")
            return jsonify({
                "message": "Reset link generated (Email failed in development)",
                "link_dev_only": link
            }), 200
    
    # Return 200 anyway for security (don't leak if email exists)
    return jsonify({"message": "If that email exists, a reset link has been sent"}), 200

@auth.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    password = request.json.get('password')
    s = get_serializer()
    try:
        email = s.loads(token, salt='password-reset-salt', max_age=3600)
    except:
        return jsonify({"message": "Invalid or expired token"}), 400

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password = %s WHERE email = %s", (hashed, email))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Password updated successfully"}), 200

@auth.route('/register/status', methods=['GET'])
def registration_status():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Fetch user step
    cursor.execute("SELECT registration_step, name, email FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    
    # Fetch existing student details
    cursor.execute("SELECT * FROM students WHERE user_id = %s", (user_id,))
    student = cursor.fetchone()
    
    # Fetch existing documents
    cursor.execute("SELECT doc_type FROM student_documents WHERE user_id = %s", (user_id,))
    docs = cursor.fetchall()
    doc_types = [d['doc_type'] for d in docs]
    
    cursor.close()
    conn.close()
    
    return jsonify({
        "registration_step": user['registration_step'],
        "user_data": user,
        "student_data": student,
        "uploaded_docs": doc_types
    })