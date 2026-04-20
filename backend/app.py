import os
from dotenv import load_dotenv
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_mail import Mail
from routes.auth_routes import auth
from routes.course_routes import courses_bp
from routes.student_profile_routes import student_profile

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "default_secret_key") # Required for sessions
CORS(app, supports_credentials=True)

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# File Upload Config
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Mail Configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'localhost')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 1025)) # Default to mailhog or similar
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'False').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@university.edu')

mail = Mail(app)
app.mail = mail # Attach to app for access in blueprints

app.register_blueprint(auth)
app.register_blueprint(courses_bp)
app.register_blueprint(student_profile)

@app.route('/')
def home():
    return {"message": "Backend running 🚀"}

if __name__ == '__main__':
    app.run(debug=True)