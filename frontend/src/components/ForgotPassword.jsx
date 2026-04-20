import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [devLink, setDevLink] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setDevLink('');
        setLoading(true);
        
        try {
            const response = await axios.post('http://localhost:5000/forgot-password', { email });
            setMessage(response.data.message);
            if (response.data.link_dev_only) {
                setDevLink(response.data.link_dev_only);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="text-center mb-4" style={{fontWeight: 800, color: 'var(--text-main)'}}>Forgot Password</h2>
                <p className="text-muted text-center mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}
                
                {devLink && (
                    <div className="alert alert-info small">
                        <strong>Dev Notice:</strong> Since email sending might be disabled in this environment, use this link to reset: 
                        <br/>
                        <a href={devLink} className="alert-link">{devLink}</a>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">EMAIL ADDRESS</label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    
                    <div className="auth-footer mt-4">
                        Remember your password? <Link to="/login">Sign In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
