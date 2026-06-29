import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student',
        admin_key: ''
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleRoleChange = (newRole) => {
        setFormData({ ...formData, role: newRole });
        setError('');
    };

    const handleRegistration = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const dataToSend = { 
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.role === 'student' ? formData.phone : undefined,
                role: formData.role,
                admin_key: formData.role === 'admin' ? formData.admin_key : undefined
            };
            
            await axios.post('http://localhost:5000/register', dataToSend);
            alert('Account created successfully! Please login.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '420px' }}>
                <div className="d-flex align-items-center justify-content-center mb-1 mt-2">
                    <h2 className="mb-0" style={{fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em'}}>
                        OUTR
                    </h2>
                </div>
                <p className="text-center text-muted mb-4 fw-bold">
                    Registration Portal
                </p>

                <div className="auth-tabs">
                    <button 
                        type="button"
                        className={`auth-tab ${formData.role === 'student' ? 'active' : ''}`}
                        onClick={() => handleRoleChange('student')}
                    >
                        STUDENT
                    </button>
                    <button 
                        type="button"
                        className={`auth-tab ${formData.role === 'admin' ? 'active' : ''}`}
                        onClick={() => handleRoleChange('admin')}
                    >
                        ADMIN
                    </button>
                </div>

                {error && <div className="alert alert-danger py-2 animate-fadeIn">{error}</div>}
                
                <form onSubmit={handleRegistration} className="animate-fadeIn">
                    <div className="mb-3">
                        <label className="form-label">FULL NAME</label>
                        <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">EMAIL ADDRESS</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    {formData.role === 'student' && (
                        <div className="mb-3">
                            <label className="form-label">PHONE NUMBER</label>
                            <input
                                type="tel"
                                name="phone"
                                className="form-control"
                                placeholder="+91 XXXXX XXXXX"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                    <div className="mb-3">
                        <label className="form-label">PASSWORD</label>
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
                                <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                            </button>
                        </div>
                    </div>
                    {formData.role === 'admin' && (
                        <div className="mb-3 text-start">
                            <label className="form-label">ADMIN SECRET KEY</label>
                            <input
                                type="password"
                                name="admin_key"
                                className="form-control"
                                placeholder="Enter admin key"
                                value={formData.admin_key}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary w-100 mt-2" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer mt-4">
                    Already have an account? <Link to="/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
