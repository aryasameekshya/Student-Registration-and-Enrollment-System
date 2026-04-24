import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NotificationPanel = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('http://localhost:5000/notifications', { withCredentials: true });
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unread_count);
        } catch (err) {
            console.error('Failed to fetch notifications');
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.post(`http://localhost:5000/notification/read/${id}`, {}, { withCredentials: true });
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.post('http://localhost:5000/notifications/read-all', {}, { withCredentials: true });
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark all as read');
        }
    };

    return (
        <div className="notification-wrapper position-relative">
            <button 
                className="btn border-0 p-2 position-relative" 
                onClick={() => setIsOpen(!isOpen)}
                style={{background: 'rgba(0,0,0,0.05)', borderRadius: '12px'}}
            >
                <i className="bi bi-bell-fill fs-5 text-dark opacity-75"></i>
                {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize: '0.6rem'}}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown shadow-lg animate-fadeIn" style={{
                    position: 'absolute',
                    top: '50px',
                    right: '0',
                    width: '320px',
                    background: 'white',
                    borderRadius: '16px',
                    zIndex: 1000,
                    overflow: 'hidden',
                    border: '1px solid #f1f5f9'
                }}>
                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
                        <h6 className="mb-0 fw-bold">Notifications</h6>
                        {unreadCount > 0 && (
                            <button className="btn btn-link btn-sm text-decoration-none p-0 small" onClick={markAllAsRead}>
                                Mark all as read
                            </button>
                        )}
                    </div>
                    <div className="notification-list" style={{maxHeight: '400px', overflowY: 'auto'}}>
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    className={`p-3 border-bottom notification-item ${notif.status === 'unread' ? 'bg-soft-primary' : ''}`}
                                    onClick={() => notif.status === 'unread' && markAsRead(notif.id)}
                                    style={{cursor: 'pointer', transition: 'background 0.2s'}}
                                >
                                    <p className="mb-1 small text-dark">{notif.message}</p>
                                    <small className="text-muted">{new Date(notif.created_at).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</small>
                                </div>
                            ))
                        ) : (
                            <div className="p-5 text-center text-muted">
                                <i className="bi bi-bell-slash fs-2 opacity-25 d-block mb-2"></i>
                                <div className="small">No notifications yet</div>
                            </div>
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <div className="p-2 text-center border-top">
                            <button className="btn btn-link btn-sm text-decoration-none text-muted small" onClick={() => setIsOpen(false)}>
                                Close
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
