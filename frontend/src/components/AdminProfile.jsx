import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminProfile = () => {
    const [profile, setProfile] = useState({ name: '', email: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('http://localhost:5000/admin/profile', { withCredentials: true });
            setProfile(res.data);
            setLoading(false);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load profile' });
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await axios.post('http://localhost:5000/admin/profile/update', profile, { withCredentials: true });
            setMessage({ type: 'success', text: 'Profile updated successfully' });
            
            // Update local storage to reflect name change in UI immediately
            const user = JSON.parse(localStorage.getItem('user'));
            user.name = profile.name;
            user.email = profile.email;
            localStorage.setItem('user', JSON.stringify(user));
            
            // Optional: trigger a page refresh or state lift to parent
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="portal-card animate-fadeIn">
            <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                <div className="bg-soft-primary p-3 rounded-circle me-3">
                    <i className="bi bi-person-badge-fill text-primary fs-3"></i>
                </div>
                <div>
                    <h3 className="h4 fw-bold mb-1">Administrative Profile</h3>
                    <p className="text-muted small mb-0">Manage your administrative account credentials</p>
                </div>
            </div>

            {message.text && (
                <div className={`alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'} border-0 shadow-sm animate-fadeIn mb-4`}>
                    <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleUpdate} className="row g-4">
                <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold text-uppercase">Full Name</label>
                    <div className="input-group">
                        <span className="input-group-text bg-light border-0"><i className="bi bi-person text-primary"></i></span>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={profile.name}
                            onChange={(e) => setProfile({...profile, name: e.target.value})}
                            required
                            placeholder="Enter your full name"
                        />
                    </div>
                </div>

                <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold text-uppercase">Email Address</label>
                    <div className="input-group">
                        <span className="input-group-text bg-light border-0"><i className="bi bi-envelope text-primary"></i></span>
                        <input 
                            type="email" 
                            className="form-control" 
                            value={profile.email}
                            onChange={(e) => setProfile({...profile, email: e.target.value})}
                            required
                            placeholder="admin@university.edu"
                        />
                    </div>
                </div>

                <div className="col-12 mt-4 pt-2 border-top">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="small text-muted">
                            <i className="bi bi-shield-check me-2"></i>
                            Account Role: <span className="badge bg-soft-primary text-primary text-uppercase">Administrator</span>
                        </div>
                        <button 
                            type="submit" 
                            className="btn btn-primary px-5 py-2 fw-bold shadow-sm"
                            style={{borderRadius: '12px'}}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AdminProfile;
