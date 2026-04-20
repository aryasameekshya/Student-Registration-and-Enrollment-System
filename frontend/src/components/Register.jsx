import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../Auth.css';

const Register = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student',
        admin_key: '',
        jee_app_no: '',
        dob: '',
        gender: 'Male',
        nationality: 'Indian',
        blood_group: 'O+',
        caste: 'General',
        aadhaar_no: '',
        phone: '',
        address: '',
        father_name: '',
        mother_name: '',
        father_occ: '',
        mother_occ: '',
        father_income: '',
        department: 'Computer Science',
        semester: '1st',
        jee_rank: '',
        tenth_percent: '',
        twelfth_percent: '',
        tenth_pass_year: '',
        twelfth_pass_year: '',
        is_disabled: false
    });
    
    const [files, setFiles] = useState({
        marksheet_10th: null,
        marksheet_12th: null,
        jee_rank_card: null,
        aadhaar_card: null,
        resident_cert: null,
        income_cert: null,
        caste_cert: null
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.role === 'student') {
                try {
                    const response = await axios.get('http://localhost:5000/register/status', {
                        withCredentials: true
                    });
                    const { registration_step, user_data, student_data, uploaded_docs } = response.data;
                    
                    if (registration_step >= 7) {
                        navigate('/home');
                        return;
                    }

                    setUserId(user.id);
                    setStep(registration_step);
                    
                    if (student_data || user_data) {
                        setFormData(prev => ({
                            ...prev,
                            ...user_data,
                            ...student_data,
                            name: student_data?.name || user_data?.name || prev.name,
                            email: user_data?.email || prev.email,
                        }));
                    }
                } catch (err) {
                    console.error("Failed to fetch registration status", err);
                }
            }
            setLoading(false);
        };
        fetchStatus();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    const handleRoleChange = (newRole) => {
        setFormData({ ...formData, role: newRole });
        setStep(newRole === 'admin' ? 2 : 1);
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleAccountCreation = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const dataToSend = { 
                name: formData.name || 'New Student',
                email: formData.email,
                password: formData.password,
                role: formData.role,
                admin_key: formData.admin_key
            };
            
            const response = await axios.post('http://localhost:5000/register', dataToSend);
            setUserId(response.data.id);
            
            if (formData.role === 'admin') {
                alert('Admin account created successfully!');
                navigate('/login');
            } else {
                nextStep();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Account creation failed');
        }
    };

    const handleDetailsSubmission = async (e) => {
        e.preventDefault();
        setError('');
        
        // Aadhaar Validation if in Step 3
        if (step === 3 && formData.aadhaar_no && !/^\d{12}$/.test(formData.aadhaar_no)) {
            setError('Aadhaar Number must be exactly 12 digits.');
            return;
        }

        try {
            await axios.post('http://localhost:5000/register/details', {
                ...formData,
                user_id: userId,
                current_step: step + 1
            });
            nextStep();
        } catch (err) {
            setError(err.response?.data?.message || 'Details submission failed');
        }
    };

    const handleFileUploads = async (e) => {
        e.preventDefault();
        setError('');
        
        const mandatoryFiles = ['marksheet_10th', 'marksheet_12th', 'jee_rank_card', 'aadhaar_card', 'resident_cert'];
        const missing = mandatoryFiles.filter(f => !files[f]);
        
        if (missing.length > 0) {
            setError('Please upload all mandatory documents (10th, 12th, JEE, Aadhaar, and Resident Certificates).');
            return;
        }

        try {
            const uploadPromises = Object.keys(files).map(key => {
                if (files[key]) {
                    const fd = new FormData();
                    fd.append('file', files[key]);
                    fd.append('user_id', userId);
                    fd.append('doc_type', key);
                    
                    // If it's the last mandatory file, tell backend
                    const mandatoryFiles = ['marksheet_10th', 'marksheet_12th', 'jee_rank_card', 'aadhaar_card', 'resident_cert'];
                    const isLast = key === mandatoryFiles[mandatoryFiles.length - 1];
                    if (isLast) fd.append('is_last', 'true');
                    
                    return axios.post('http://localhost:5000/register/upload', fd);
                }
                return null;
            }).filter(p => p !== null);

            await Promise.all(uploadPromises);
            alert('Registration completed successfully! Please login.');
            navigate('/login');
        } catch (err) {
            setError('File upload failed. Please try again.');
        }
    };

    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <div className="animate-fadeIn">
                        <div className="mb-4 text-center">
                            <h4 className="fw-bold">Step 1: JEE Verification</h4>
                            <p className="text-muted small">Valid 12-digit Application Number required</p>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">JEE APPLICATION NUMBER</label>
                            <input
                                type="text"
                                name="jee_app_no"
                                className="form-control"
                                placeholder="24XXXXXXX"
                                value={formData.jee_app_no}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <button 
                            className="btn btn-primary w-100" 
                            disabled={!formData.jee_app_no}
                            onClick={() => { 
                                const jeeRegex = /^(24|25|26)\d{10}$/;
                                if (!jeeRegex.test(formData.jee_app_no)) {
                                    setError('Invalid JEE Number. Must be 12 digits starting with the year (e.g., 24XXXXXXXXXX)');
                                    return;
                                }
                                setError(''); 
                                nextStep(); 
                            }}
                        >
                            Verify & Continue
                        </button>
                    </div>
                );
            case 2:
                return (
                    <div className="animate-fadeIn">
                        <div className="mb-4 text-center">
                            <h4 className="fw-bold">Step 2: Account Security</h4>
                            <p className="text-muted small">Create your login credentials</p>
                        </div>
                        <form onSubmit={handleAccountCreation}>
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
                                        value={formData.admin_key}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            )}
                            <div className="d-flex gap-2">
                                {formData.role === 'student' && <button type="button" className="btn btn-outline-secondary w-100" onClick={() => { setError(''); prevStep(); }}>Back</button>}
                                <button type="submit" className="btn btn-primary w-100">Create Account</button>
                            </div>
                        </form>
                    </div>
                );
            case 3:
                return (
                    <div className="animate-fadeIn">
                        <div className="mb-4 text-center">
                            <h4 className="fw-bold">Step 3: Personal Details</h4>
                        </div>
                        <form onSubmit={handleDetailsSubmission}>
                            <div className="row">
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label">FULL NAME</label>
                                    <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label">DATE OF BIRTH</label>
                                    <input type="date" name="dob" className="form-control" value={formData.dob} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label">GENDER</label>
                                    <select name="gender" className="form-control" value={formData.gender} onChange={handleChange}>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </div>
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label">BLOOD GROUP</label>
                                    <select name="blood_group" className="form-control" value={formData.blood_group} onChange={handleChange}>
                                        <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                                        <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                                    </select>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label">NATIONALITY</label>
                                    <input type="text" name="nationality" className="form-control" value={formData.nationality} onChange={handleChange} required />
                                </div>
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label">AADHAAR NUMBER (12 DIGITS)</label>
                                    <input type="text" name="aadhaar_no" className="form-control" value={formData.aadhaar_no} onChange={handleChange} placeholder="XXXX XXXX XXXX" required />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label">CASTE / CATEGORY</label>
                                    <select name="caste" className="form-control" value={formData.caste} onChange={handleChange}>
                                        <option value="General">General</option><option value="OBC">OBC</option>
                                        <option value="SC">SC</option><option value="ST">ST</option><option value="EWS">EWS</option>
                                    </select>
                                </div>
                                <div className="col-md-6 mb-3 d-flex align-items-center">
                                    <div className="form-check pt-4">
                                        <input type="checkbox" name="is_disabled" className="form-check-input" checked={formData.is_disabled} onChange={handleChange} />
                                        <label className="form-check-label">Physically Disabled?</label>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-3 text-start">
                                <label className="form-label">PHONE NUMBER</label>
                                <input type="tel" name="phone" className="form-control" value={formData.phone} onChange={handleChange} required />
                            </div>
                            <div className="mb-3 text-start">
                                <label className="form-label">PERMANENT ADDRESS</label>
                                <textarea name="address" className="form-control" rows="2" value={formData.address} onChange={handleChange} required></textarea>
                            </div>
                            <div className="d-flex gap-2">
                                <button type="button" className="btn btn-outline-secondary w-100" onClick={() => { setError(''); prevStep(); }}>Back</button>
                                <button type="submit" className="btn btn-primary w-100">Save & Next</button>
                            </div>
                        </form>
                    </div>
                );
            case 4:
                return (
                    <div className="animate-fadeIn">
                        <div className="mb-4 text-center">
                            <h4 className="fw-bold">Step 4: Family Details</h4>
                        </div>
                        <form onSubmit={handleDetailsSubmission}>
                            <div className="row">
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label">FATHER'S NAME</label>
                                    <input type="text" name="father_name" className="form-control" value={formData.father_name} onChange={handleChange} required />
                                </div>
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label">FATHER'S OCCUPATION</label>
                                    <input type="text" name="father_occ" className="form-control" value={formData.father_occ} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label">MOTHER'S NAME</label>
                                    <input type="text" name="mother_name" className="form-control" value={formData.mother_name} onChange={handleChange} required />
                                </div>
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label">MOTHER'S OCCUPATION</label>
                                    <input type="text" name="mother_occ" className="form-control" value={formData.mother_occ} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="mb-3 text-start">
                                <label className="form-label">ANNUAL FAMILY INCOME</label>
                                <input type="text" name="father_income" className="form-control" value={formData.father_income} onChange={handleChange} placeholder="e.g. 5,00,000" required />
                            </div>
                            <div className="d-flex gap-2 mt-4">
                                <button type="button" className="btn btn-outline-secondary w-100" onClick={() => { setError(''); prevStep(); }}>Back</button>
                                <button type="submit" className="btn btn-primary w-100">Save & Next</button>
                            </div>
                        </form>
                    </div>
                );
            case 5:
                return (
                    <div className="animate-fadeIn">
                        <div className="mb-4 text-center">
                            <h4 className="fw-bold">Step 5: Academic Records</h4>
                        </div>
                        <form onSubmit={handleDetailsSubmission}>
                            <div className="mb-3 text-start">
                                <label className="form-label">JEE RANK (ALL INDIA)</label>
                                <input type="number" name="jee_rank" className="form-control" value={formData.jee_rank} onChange={handleChange} required />
                            </div>
                            <hr className="my-4" />
                            <div className="row">
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label">10th PERCENTAGE %</label>
                                    <input type="number" step="0.01" name="tenth_percent" className="form-control" value={formData.tenth_percent} onChange={handleChange} required />
                                </div>
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label">10th PASSING YEAR</label>
                                    <input type="number" name="tenth_pass_year" className="form-control" value={formData.tenth_pass_year} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label">12th PERCENTAGE %</label>
                                    <input type="number" step="0.01" name="twelfth_percent" className="form-control" value={formData.twelfth_percent} onChange={handleChange} required />
                                </div>
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label">12th PASSING YEAR</label>
                                    <input type="number" name="twelfth_pass_year" className="form-control" value={formData.twelfth_pass_year} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="d-flex gap-2">
                                <button type="button" className="btn btn-outline-secondary w-100" onClick={() => { setError(''); prevStep(); }}>Back</button>
                                <button type="submit" className="btn btn-primary w-100">Save & Next</button>
                            </div>
                        </form>
                    </div>
                );
            case 6:
                return (
                    <div className="animate-fadeIn">
                        <div className="mb-4 text-center">
                            <h4 className="fw-bold">Step 6: Document Uploads</h4>
                            <p className="text-muted small">Please upload clear scan copies (* mandatory)</p>
                        </div>
                        <form onSubmit={handleFileUploads}>
                            <div className="row">
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label small fw-bold">10th MARKSHEET *</label>
                                    <input type="file" name="marksheet_10th" className="form-control" onChange={handleFileChange} required={!files.marksheet_10th} />
                                </div>
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label small fw-bold">12th MARKSHEET *</label>
                                    <input type="file" name="marksheet_12th" className="form-control" onChange={handleFileChange} required={!files.marksheet_12th} />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label small fw-bold">JEE RANK CARD *</label>
                                    <input type="file" name="jee_rank_card" className="form-control" onChange={handleFileChange} required={!files.jee_rank_card} />
                                </div>
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label small fw-bold">AADHAAR CARD *</label>
                                    <input type="file" name="aadhaar_card" className="form-control" onChange={handleFileChange} required={!files.aadhaar_card} />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label small fw-bold">RESIDENT CERTIFICATE *</label>
                                    <input type="file" name="resident_cert" className="form-control" onChange={handleFileChange} required={!files.resident_cert} />
                                </div>
                                <div className="col-md-6 mb-3 text-start">
                                    <label className="form-label small fw-bold">INCOME CERTIFICATE</label>
                                    <input type="file" name="income_cert" className="form-control" onChange={handleFileChange} />
                                </div>
                            </div>
                             <div className="mb-3 text-start">
                                <label className="form-label small fw-bold">CASTE CERTIFICATE</label>
                                <input type="file" name="caste_cert" className="form-control" onChange={handleFileChange} />
                            </div>

                            <div className="d-flex gap-2 mt-4">
                                <button type="button" className="btn btn-outline-secondary w-100" onClick={() => { setError(''); prevStep(); }}>Back</button>
                                <button type="submit" className="btn btn-primary w-100">Complete Registration</button>
                            </div>
                        </form>
                    </div>
                );
            default:
                return null;
        }
    };
    
    if (loading) return (
        <div className="auth-container">
            <div className="auth-card text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Resuming your registration...</p>
            </div>
        </div>
    );

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: step > 2 ? '700px' : '420px', transition: 'all 0.3s ease' }}>
                {step === 1 && (
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
                )}

                {formData.role === 'student' && step > 1 && (
                    <div className="step-indicator">
                        {[1, 2, 3, 4, 5, 6].map(s => (
                            <div 
                                key={s} 
                                className={`step-item ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
                            >
                                {s < step ? <i className="bi bi-check-lg"></i> : s}
                            </div>
                        ))}
                    </div>
                )}

                {error && <div className="alert alert-danger py-2 animate-fadeIn">{error}</div>}
                
                {renderStep()}

                {step === 1 && (
                    <div className="auth-footer mt-4">
                        Already have an account? <Link to="/login">Sign In</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Register;
