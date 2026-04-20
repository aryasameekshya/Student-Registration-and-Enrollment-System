import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../Auth.css';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setMessage('');
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`http://localhost:5000/reset-password/${token}`, { password });
            setMessage(response.data.message);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Token may be invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="text-center mb-4" style={{fontWeight: 800, color: 'var(--text-main)'}}>Set New Password</h2>
                
                {message && <div className="alert alert-success">{message}. Redirecting to login...</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">NEW PASSWORD</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-control"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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

                    <div className="mb-4">
                        <label className="form-label">CONFIRM PASSWORD</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                        {loading ? 'Updating...' : 'Reset Password'}
                    </button>
                    
                    <div className="auth-footer mt-4">
                        <Link to="/login">Back to Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
