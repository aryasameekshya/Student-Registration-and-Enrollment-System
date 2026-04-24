from flask import Blueprint, request, jsonify, session
from utils.db import get_db_connection
from utils.auth import login_required

notifications_bp = Blueprint('notifications', __name__)

def create_notification(user_id, message):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO notifications (user_id, message, status) VALUES (%s, %s, 'unread')",
            (user_id, message)
        )
        conn.commit()
        return True
    except Exception as e:
        print(f"Error creating notification: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

@notifications_bp.route('/notifications', methods=['GET'])
@login_required
def get_notifications():
    user_id = session.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
            (user_id,)
        )
        notifications = cursor.fetchall()
        
        # Get unread count
        cursor.execute(
            "SELECT COUNT(*) as count FROM notifications WHERE user_id = %s AND status = 'unread'",
            (user_id,)
        )
        unread_count = cursor.fetchone()['count']
        
        return jsonify({
            "notifications": notifications,
            "unread_count": unread_count
        })
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@notifications_bp.route('/notification/read/<int:notification_id>', methods=['POST'])
@login_required
def mark_as_read(notification_id):
    user_id = session.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE notifications SET status = 'read' WHERE id = %s AND user_id = %s",
            (notification_id, user_id)
        )
        conn.commit()
        return jsonify({"message": "Notification marked as read"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@notifications_bp.route('/notifications/read-all', methods=['POST'])
@login_required
def mark_all_as_read():
    user_id = session.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE notifications SET status = 'read' WHERE user_id = %s",
            (user_id,)
        )
        conn.commit()
        return jsonify({"message": "All notifications marked as read"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()
