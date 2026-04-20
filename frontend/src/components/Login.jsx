import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../Auth.css';

const Login = () => {
    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
        admin_key: ''
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTabChange = (adminMode) => {
        setIsAdmin(adminMode);
        setError('');
        setFormData({ ...formData, identifier: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = { 
                identifier: formData.identifier,
                password: formData.password,
                role: isAdmin ? 'admin' : 'student'
            };
            if (isAdmin) dataToSend.admin_key = formData.admin_key;

            const response = await axios.post('http://localhost:5000/login', dataToSend, {
                withCredentials: true
            });
            const user = response.data.user;
            localStorage.setItem('user', JSON.stringify(user));
            
            // Redirect all roles to /home, students will see registration CTA there if needed
            navigate('/home');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-tabs">
                    <button 
                        type="button"
                        className={`auth-tab ${!isAdmin ? 'active' : ''}`}
                        onClick={() => handleTabChange(false)}
                    >
                        STUDENT
                    </button>
                    <button 
                        type="button"
                        className={`auth-tab ${isAdmin ? 'active' : ''}`}
                        onClick={() => handleTabChange(true)}
                    >
                        ADMIN
                    </button>
                </div>

                <h2 className="text-center mb-4" style={{fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em'}}>
                    {isAdmin ? 'Admin Portal' : 'Student Portal'}
                </h2>

                {error && <div className="alert alert-danger py-2">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">
                            {isAdmin ? 'ADMIN EMAIL' : 'JEE APPLICATION NUMBER OR EMAIL'}
                        </label>
                        <input
                            type={isAdmin ? "email" : "text"}
                            name="identifier"
                            className="form-control"
                            placeholder={isAdmin ? "admin@example.com" : "24XXXXXXXXXX"}
                            value={formData.identifier}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label mb-0">PASSWORD</label>
                            <Link to="/forgot-password" style={{fontSize: '0.8rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600}}>
                                Forgot Password?
                            </Link>
                        </div>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                className="form-control"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <button 
                                type="button" 
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="mb-3 animate-fadeIn">
                            <label className="form-label">ADMIN SECRET KEY</label>
                            <input
                                type="password"
                                name="admin_key"
                                className="form-control"
                                placeholder="Enter secret key"
                                value={formData.admin_key}
                                onChange={handleChange}
                                required={isAdmin}
                            />
                        </div>
                    )}

                    <div className="mt-4">
                        <button type="submit" className="btn btn-primary mt-0">
                            Log in as {isAdmin ? 'Admin' : 'Student'}
                        </button>
                    </div>
                    
                    <div className="auth-footer">
                        Don't have an account? <Link to="/register">Create one</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
