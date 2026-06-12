import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Profile.css';

const StudentProfile = ({ user }) => {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [receiptFile, setReceiptFile] = useState(null);

    const [allFeesPaid, setAllFeesPaid] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const checkTransactionStatus = (fetchedProfile) => {
        if (!fetchedProfile) return;
        const storageKey = `transaction_history_v5_${fetchedProfile.id}`;
        const storedTxns = localStorage.getItem(storageKey);
        
        let txns = [];
        if (storedTxns) {
            txns = JSON.parse(storedTxns);
        } else {
            // Force re-check or skip if no storage yet
            return;
        }

        const admissionPaid = txns.some(t => t.ref_no.startsWith('ADM') && t.status === 'Success');
        const regnPaid = txns.some(t => String(t.sem) === '1' && t.ref_no.startsWith('REG') && t.status === 'Success');
        const semPaid = txns.some(t => String(t.sem) === '1' && t.ref_no.startsWith('SEM') && t.status === 'Success');
        
        console.log(`[DEBUG] Profile Check - Admission: ${admissionPaid}, Regn: ${regnPaid}, Sem: ${semPaid}`);

        const allInitialPaid = admissionPaid && regnPaid && semPaid;
        setAllFeesPaid(allInitialPaid);

        // Sync with backend if mismatch detected
        if (allInitialPaid && fetchedProfile.fee_status !== 'Paid') {
            console.log("[DEBUG] Syncing 'Paid' status from Profile...");
            axios.post('http://localhost:5000/student/update-fee-status', { 
                fee_status: 'Paid' 
            }, { withCredentials: true })
            .then(() => console.log("[DEBUG] Backend fee status synced to Paid"))
            .catch(err => console.error("[DEBUG] Failed to sync fee status", err));
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await axios.get('http://localhost:5000/student/profile', { withCredentials: true });
            setProfile(res.data);
            setLoading(false);
            checkTransactionStatus(res.data);
        } catch (err) {
            console.error('Error fetching profile', err);
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        if (e.target.type === 'file') {
            setReceiptFile(e.target.files[0]);
        } else {
            setProfile({ ...profile, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Update textual profile data
            await axios.post('http://localhost:5000/student/update', profile, { withCredentials: true });
            
            // Upload Fee Receipt if selected
            if (receiptFile) {
                const formData = new FormData();
                formData.append('file', receiptFile);
                formData.append('user_id', user.id);
                formData.append('doc_type', 'fee_receipt');
                
                await axios.post('http://localhost:5000/register/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true
                });
                
                // Update fee_status to 'Pending Verification'
                await axios.post('http://localhost:5000/student/update', { 
                    ...profile, 
                    fee_status: 'Pending Verification' 
                }, { withCredentials: true });
            }

            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser) {
                currentUser.name = profile.name;
                localStorage.setItem('user', JSON.stringify(currentUser));
            }

            setMessage({ text: 'Profile and documents updated successfully!', type: 'success' });
            setIsEditing(false);
            setReceiptFile(null);
            fetchProfile(); // Refresh to show new documents
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: 'Failed to update profile or upload receipt.', type: 'danger' });
        }
    };

    if (loading) return <div className="text-center p-5 text-secondary">Loading Profile...</div>;
    if (!profile) return <div className="text-center p-5 text-danger">Profile not found.</div>;

    const formatLabel = (key) => key.replace(/_/g, ' ').toUpperCase();

    return (
        <div className="animate-fadeIn pb-5">
            <div className="d-flex justify-content-between align-items-center mb-5 pb-4 border-bottom">
                <div className="d-flex align-items-center">
                    <div className="profile-icon shadow-sm">
                        {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ms-4">
                        <h3 className="mb-1 fw-bold text-dark">{profile.name}</h3>
                        <div className="d-flex flex-column gap-1 mt-1">
                            <span className="badge-role text-uppercase fw-bold text-primary" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>{profile.role}</span>
                            <span className="text-muted small d-flex align-items-center">
                                <i className="bi bi-envelope-fill me-2" style={{ color: '#6366f1' }}></i>
                                {profile.email}
                            </span>
                            <div className="d-flex align-items-center flex-wrap gap-2 mt-2">
                                <span className="badge bg-primary px-2 py-1 rounded-pill" style={{fontSize: '0.7rem'}}>JEE APPLICATION NO: {profile.jee_app_no || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="btn btn-outline-primary px-4 py-2 fw-bold shadow-sm rounded-pill transition-all">
                        <i className="bi bi-pencil-square me-2"></i>Edit Profile
                    </button>
                )}
            </div>

            {message.text && (
                <div className={`alert alert-${message.type} py-2 mb-4 animate-fadeIn`} role="alert">
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Section: Identification & Personal Details */}
                <div className="profile-section-header">Identification & Personal Details</div>
                <div className="row g-4 mb-5">
                    <div className="col-md-4">
                        <div className="d-flex align-items-center flex-wrap gap-2">
                            <span className="badge bg-primary px-3 py-2 rounded-pill">JEE APPLICATION NO: {profile.jee_app_no || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <label className="profile-label">Aadhaar Number</label>
                        {isEditing ? (
                            <input type="text" name="aadhaar_no" className="form-control" value={profile.aadhaar_no} onChange={handleChange} />
                        ) : (
                            <p className="profile-value">{profile.aadhaar_no || 'N/A'}</p>
                        )}
                    </div>
                    <div className="col-md-4">
                        <label className="profile-label">Date of Birth</label>
                        <p className="profile-value">{profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="col-md-4">
                        <label className="profile-label">Gender</label>
                        {isEditing ? (
                            <select name="gender" className="form-control" value={profile.gender} onChange={handleChange}>
                                <option>Male</option><option>Female</option><option>Other</option>
                            </select>
                        ) : (
                            <p className="profile-value">{profile.gender || 'N/A'}</p>
                        )}
                    </div>
                    <div className="col-md-4">
                        <label className="profile-label">Nationality</label>
                        {isEditing ? (
                            <input type="text" name="nationality" className="form-control" value={profile.nationality} onChange={handleChange} />
                        ) : (
                            <p className="profile-value">{profile.nationality || 'N/A'}</p>
                        )}
                    </div>
                    <div className="col-md-4">
                        <label className="profile-label">Blood Group</label>
                        {isEditing ? (
                            <select name="blood_group" className="form-control" value={profile.blood_group} onChange={handleChange}>
                                <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                                <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                            </select>
                        ) : (
                            <p className="profile-value">{profile.blood_group || 'N/A'}</p>
                        )}
                    </div>
                    <div className="col-md-4">
                        <label className="profile-label">Caste / Category</label>
                        {isEditing ? (
                            <select name="caste" className="form-control" value={profile.caste} onChange={handleChange}>
                                <option value="General">General</option><option value="OBC">OBC</option>
                                <option value="SC">SC</option><option value="ST">ST</option><option value="EWS">EWS</option>
                            </select>
                        ) : (
                            <p className="profile-value">{profile.caste || 'General'}</p>
                        )}
                    </div>
                    <div className="col-md-4">
                        <label className="profile-label">Course / Branch</label>
                        {isEditing ? (
                            <select name="course" className="form-control" value={profile.course} onChange={handleChange}>
                                <option value="cse">CSE</option>
                                <option value="it">IT</option>
                                <option value="aiml">AIML</option>
                                <option value="electrical">Electrical</option>
                                <option value="electronics">Electronics</option>
                                <option value="mechanical">Mechanical</option>
                                <option value="civil">Civil</option>
                                <option value="biotech">Biotech</option>
                            </select>
                        ) : (
                            <p className="profile-value text-uppercase">{profile.course || 'N/A'}</p>
                        )}
                    </div>
                    <div className="col-md-4">
                        <label className="profile-label">Phone</label>
                        {isEditing ? (
                            <input type="text" name="phone" className="form-control" value={profile.phone} onChange={handleChange} />
                        ) : (
                            <p className="profile-value">{profile.phone || 'N/A'}</p>
                        )}
                    </div>
                    <div className="col-12">
                        <label className="profile-label">Permanent Address</label>
                        {isEditing ? (
                            <textarea name="address" className="form-control" value={profile.address} onChange={handleChange} rows="2"></textarea>
                        ) : (
                            <p className="profile-value">{profile.address || 'N/A'}</p>
                        )}
                    </div>
                </div>

                {/* Section: Family Details */}
                <div className="profile-section-header">Family Details</div>
                <div className="row g-4 mb-5">
                    <div className="col-md-6">
                        <div className="p-4 bg-light rounded-4 border">
                            <h6 className="fw-bold mb-3"><i className="bi bi-person-fill me-2"></i>Father's Information</h6>
                            <label className="profile-label">Name</label>
                            {isEditing ? (
                                <input type="text" name="father_name" className="form-control mb-2" value={profile.father_name} onChange={handleChange} />
                            ) : (
                                <p className="mb-3 fw-medium">{profile.father_name || 'N/A'}</p>
                            )}
                            <label className="profile-label">Occupation</label>
                            {isEditing ? (
                                <input type="text" name="father_occ" className="form-control" value={profile.father_occ} onChange={handleChange} />
                            ) : (
                                <p className="mb-0 text-muted">{profile.father_occ || 'N/A'}</p>
                            )}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="p-4 bg-light rounded-4 border">
                            <h6 className="fw-bold mb-3"><i className="bi bi-person-fill me-2"></i>Mother's Information</h6>
                            <label className="profile-label">Name</label>
                            {isEditing ? (
                                <input type="text" name="mother_name" className="form-control mb-2" value={profile.mother_name} onChange={handleChange} />
                            ) : (
                                <p className="mb-3 fw-medium">{profile.mother_name || 'N/A'}</p>
                            )}
                            <label className="profile-label">Occupation</label>
                            {isEditing ? (
                                <input type="text" name="mother_occ" className="form-control" value={profile.mother_occ} onChange={handleChange} />
                            ) : (
                                <p className="mb-0 text-muted">{profile.mother_occ || 'N/A'}</p>
                            )}
                        </div>
                    </div>
                    <div className="col-md-12 mt-3">
                         <label className="profile-label">Annual Family Income</label>
                        {isEditing ? (
                            <input type="text" name="father_income" className="form-control" value={profile.father_income} onChange={handleChange} />
                        ) : (
                            <p className="profile-value">₹ {profile.father_income || '0'}</p>
                        )}
                    </div>
                </div>

                {/* Section: Academic Background */}
                <div className="profile-section-header">JEE & Academic Background</div>
                <div className="row g-4 mb-5">
                    <div className="col-md-12 mb-3">
                        <label className="profile-label">JEE AIR Rank</label>
                        {isEditing ? (
                            <input type="number" name="jee_rank" className="form-control" value={profile.jee_rank} onChange={handleChange} />
                        ) : (
                            <p className="profile-value">{profile.jee_rank || 'N/A'}</p>
                        )}
                    </div>
                    <div className="col-md-6">
                        <div className="p-3 bg-light rounded-4 border">
                            <h6 className="fw-bold mb-3">Class 10th (Secondary)</h6>
                            <div className="row">
                                <div className="col-6">
                                    <label className="profile-label">Percentage</label>
                                    {isEditing ? (
                                        <input type="number" step="0.01" name="tenth_percent" className="form-control" value={profile.tenth_percent} onChange={handleChange} />
                                    ) : (
                                        <p className="profile-value">{profile.tenth_percent}%</p>
                                    )}
                                </div>
                                <div className="col-6">
                                    <label className="profile-label">Passing Year</label>
                                    {isEditing ? (
                                        <input type="number" name="tenth_pass_year" className="form-control" value={profile.tenth_pass_year} onChange={handleChange} />
                                    ) : (
                                        <p className="profile-value">{profile.tenth_pass_year}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="p-3 bg-light rounded-4 border">
                            <h6 className="fw-bold mb-3">Class 12th (Higher Secondary)</h6>
                            <div className="row">
                                <div className="col-6">
                                    <label className="profile-label">Percentage</label>
                                    {isEditing ? (
                                        <input type="number" step="0.01" name="twelfth_percent" className="form-control" value={profile.twelfth_percent} onChange={handleChange} />
                                    ) : (
                                        <p className="profile-value">{profile.twelfth_percent}%</p>
                                    )}
                                </div>
                                <div className="col-6">
                                    <label className="profile-label">Passing Year</label>
                                    {isEditing ? (
                                        <input type="number" name="twelfth_pass_year" className="form-control" value={profile.twelfth_pass_year} onChange={handleChange} />
                                    ) : (
                                        <p className="profile-value">{profile.twelfth_pass_year}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Document Vault */}
                <div className="profile-section-header">Document Vault</div>
                <div className="row g-3 mb-4">
                    {profile.documents && profile.documents.length > 0 ? (
                        profile.documents.map((doc, idx) => (
                            <div key={idx} className="col-md-6 col-lg-4">
                                <div className="doc-item">
                                    <div className="doc-icon">
                                        <i className={`bi ${doc.type === 'fee_receipt' ? 'bi-receipt-cutoff text-success' : (doc.type.includes('cert') || doc.type.includes('card') ? 'bi-shield-check' : 'bi-file-earmark-pdf-fill')}`}></i>
                                    </div>
                                    <div className="doc-name">{formatLabel(doc.type)}</div>
                                    <a href={`http://localhost:5000${doc.url}`} target="_blank" rel="noopener noreferrer" className="view-link">
                                        View
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-12 py-3 text-center text-muted border rounded-4 border-dashed">
                            No documents uploaded yet.
                        </div>
                    )}
                </div>
                
                {/* Section: Enrollment Status */}
                <div className="profile-section-header">Enrollment Status</div>
                <div className="mb-5">
                    <div className={`alert d-flex align-items-center p-4 rounded-4 shadow-sm border-0 ${
                        profile.enrollment_status === 'Approved' ? 'alert-success' : 
                        profile.enrollment_status === 'Rejected' ? 'alert-danger' : 
                        'alert-info'
                    }`} style={{ 
                        background: profile.enrollment_status === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : 
                                    profile.enrollment_status === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 
                                    'rgba(59, 130, 246, 0.1)' 
                    }}>
                        <i className={`bi fs-3 me-3 ${
                            profile.enrollment_status === 'Approved' ? 'bi-check-circle-fill text-success' : 
                            profile.enrollment_status === 'Rejected' ? 'bi-x-circle-fill text-danger' : 
                            'bi-info-circle-fill text-primary'
                        }`}></i>
                        <div>
                            <h6 className={`mb-1 fw-bold ${
                                profile.enrollment_status === 'Approved' ? 'text-success' : 
                                profile.enrollment_status === 'Rejected' ? 'text-danger' : 
                                'text-primary'
                            }`}>
                                STATUS: {profile.enrollment_status}
                            </h6>
                            <p className="mb-0 small text-dark opacity-75">
                                {profile.enrollment_status === 'Approved' ? 
                                    'Congratulations! Your enrollment has been approved for the selected branch.' : 
                                 profile.enrollment_status === 'Rejected' ? 
                                    'Your enrollment request has been rejected. Please contact the administration for details.' : 
                                    'Your enrollment request is currently under review by the administration.'}
                            </p>
                        </div>
                    </div>
                </div>

                {(profile.sgpa || profile.cgpa) && (
                    <div className="animate-fadeIn">
                        <div className="profile-section-header">Academic Performance</div>
                        <div className="row g-4 mb-5">
                            <div className="col-md-6">
                                <div className="p-4 rounded-4 shadow-sm border bg-white h-100">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                                            <i className="bi bi-graph-up-arrow fs-4 text-primary"></i>
                                        </div>
                                        <div>
                                            <h6 className="profile-label mb-0">Latest Semester SGPA</h6>
                                            <p className="mb-0 x-small text-muted text-uppercase tracking-wider">Used for portal eligibility</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-baseline">
                                        <span className="fs-2 fw-bold text-primary">{profile.sgpa}</span>
                                        <span className="text-muted ms-2">/ 10.0</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-4 rounded-4 shadow-sm border bg-white h-100">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-success bg-opacity-10 p-3 rounded-3 me-3">
                                            <i className="bi bi-mortarboard fs-4 text-success"></i>
                                        </div>
                                        <div>
                                            <h6 className="profile-label mb-0">Cumulative CGPA</h6>
                                            <p className="mb-0 x-small text-muted text-uppercase tracking-wider">Overall Academic Record</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-baseline">
                                        <span className="fs-2 fw-bold text-success">{profile.cgpa}</span>
                                        <span className="text-muted ms-2">/ 10.0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Fee Receipt Field */}
                {isEditing && (
                    <div className="mb-5 p-4 rounded-4 border bg-white shadow-sm animate-fadeIn">
                        <h6 className="fw-bold mb-3 d-flex align-items-center">
                            <i className="bi bi-cloud-arrow-up-fill me-2 text-primary"></i>
                            Upload New Fee Receipt
                        </h6>
                        <div className="input-group">
                            <input 
                                type="file" 
                                className="form-control" 
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleChange}
                            />
                        </div>
                        <small className="text-muted mt-2 d-block">
                            Accepted formats: PDF, JPG, PNG. Max size: 5MB.
                        </small>
                    </div>
                )}

                {isEditing && (
                    <div className="mt-4 d-flex gap-3 position-sticky bottom-0 bg-white p-3 border-top" style={{zIndex: 50}}>
                        <button type="submit" className="btn btn-primary px-5 fw-bold">
                            Save Profile Changes
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} className="btn btn-light px-4">
                            Cancel
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default StudentProfile;
