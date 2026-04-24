from functools import wraps
from flask import session, jsonify

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"message": "Access denied: Please login to continue"}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"message": "Access denied: Please login to continue"}), 401
        if session.get('role') != 'admin':
            return jsonify({"message": "Access denied: Administrative privileges required"}), 403
        return f(*args, **kwargs)
    return decorated_function
