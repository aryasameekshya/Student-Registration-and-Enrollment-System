import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SemesterRegistration = () => {
    const [formData, setFormData] = useState({
        department: '',
        program: '',
        semester: '1st',
        prev_sem_cgpa: '',
        tenth_percent: '',
        twelfth_percent: '',
        tenth_pass_year: '',
        twelfth_pass_year: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const fetchExistingDetails = async () => {
            try {
                const res = await axios.get('http://localhost:5000/register/status', { withCredentials: true });
                if (res.data.student_data) {
                    const sd = res.data.student_data;
                    setFormData({
                        department: sd.department || '',
                        program: sd.program || '',
                        semester: sd.semester || '1st',
                        prev_sem_cgpa: sd.prev_sem_cgpa || '',
                        tenth_percent: sd.tenth_percent || '',
                        twelfth_percent: sd.twelfth_percent || '',
                        tenth_pass_year: sd.tenth_pass_year || '',
                        twelfth_pass_year: sd.twelfth_pass_year || ''
                    });
                }
            } catch (err) {
                console.error("Error fetching registration status", err);
            }
        };
        fetchExistingDetails();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });
        
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await axios.post('http://localhost:5000/register/details', {
                ...formData,
                user_id: user.id
            }, { withCredentials: true });
            
            setMessage({ text: 'Registration details saved successfully!', type: 'success' });
            
            // Clear message after 4 seconds
            setTimeout(() => setMessage({ text: '', type: '' }), 4000);
            
            // Clear form after success
            setFormData({
                department: '',
                program: '',
                semester: '1st',
                prev_sem_cgpa: '',
                tenth_percent: '',
                twelfth_percent: '',
                tenth_pass_year: '',
                twelfth_pass_year: ''
            });
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Failed to save details', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            <div className="portal-card">
                <div className="mb-4">
                    <h4 className="fw-bold text-dark">Semester Registration</h4>
                    <p className="text-muted small">Select your program and update academic records for the current session.</p>
                </div>

                {message.text && (
                    <div className={`alert alert-${message.type} py-2 mb-4 animate-fadeIn`} role="alert">
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="row g-4">
                        {/* Program Details */}
                        <div className="col-md-6">
                            <label className="form-label fw-semibold text-muted small">DEPARTMENT</label>
                            <select name="department" className="form-control" value={formData.department} onChange={handleChange} required>
                                <option value="">Select Department</option>
                                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                                <option value="Electrical Engineering">Electrical Engineering</option>
                                <option value="Mechanical Engineering">Mechanical Engineering</option>
                                <option value="Civil Engineering">Civil Engineering</option>
                                <option value="Electronics & Instrumentation">Electronics & Instrumentation</option>
                                <option value="Information Technology">Information Technology</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold text-muted small">PROGRAM</label>
                            <select name="program" className="form-control" value={formData.program} onChange={handleChange} required>
                                <option value="">Select Program</option>
                                <option value="B.Tech">B.Tech</option>
                                <option value="M.Tech">M.Tech</option>
                                <option value="MCA">MCA</option>
                                <option value="M.Sc">M.Sc</option>
                                <option value="PhD">PhD</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold text-muted small">CURRENT SEMESTER</label>
                            <select name="semester" className="form-control" value={formData.semester} onChange={handleChange} required>
                                {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(sem => (
                                    <option key={sem} value={sem}>{sem}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold text-muted small">CGPA(Till Previous Semester)</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                name="prev_sem_cgpa" 
                                className="form-control" 
                                placeholder="0.00"
                                value={formData.prev_sem_cgpa} 
                                onChange={handleChange} 
                            />
                        </div>

                        <div className="col-12 mt-5">
                            <h6 className="fw-bold text-dark mb-3 border-bottom pb-2">Schooling Details</h6>
                        </div>

                        {/* Academic Records */}
                        <div className="col-md-6">
                            <label className="form-label fw-semibold text-muted small">10th PERCENTAGE %</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                name="tenth_percent" 
                                className="form-control" 
                                value={formData.tenth_percent} 
                                onChange={handleChange} 
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold text-muted small">10th PASSING YEAR</label>
                            <input 
                                type="number" 
                                name="tenth_pass_year" 
                                className="form-control" 
                                value={formData.tenth_pass_year} 
                                onChange={handleChange} 
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold text-muted small">12th PERCENTAGE %</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                name="twelfth_percent" 
                                className="form-control" 
                                value={formData.twelfth_percent} 
                                onChange={handleChange} 
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold text-muted small">12th PASSING YEAR</label>
                            <input 
                                type="number" 
                                name="twelfth_pass_year" 
                                className="form-control" 
                                value={formData.twelfth_pass_year} 
                                onChange={handleChange} 
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-5">
                        <button type="submit" className="btn btn-primary px-5" disabled={loading}>
                            {loading ? 'Saving...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SemesterRegistration;
