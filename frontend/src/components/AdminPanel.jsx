import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = ({ onCourseAdded }) => {
    const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'students'
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [courseData, setCourseData] = useState({
        title: '',
        description: '',
        instructor: '',
        credits: 3
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (activeTab === 'students') {
            fetchStudents();
        }
    }, [activeTab]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/admin/students', { withCredentials: true });
            setStudents(res.data);
        } catch (err) {
            setError('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentDetail = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/admin/student/${id}`, { withCredentials: true });
            setSelectedStudent(res.data);
        } catch (err) {
            setError('Failed to fetch student details');
        } finally {
            setLoading(false);
        }
    };

    const handleCourseChange = (e) => {
        setCourseData({ ...courseData, [e.target.name]: e.target.value });
    };

    const handleCourseSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post('http://localhost:5000/courses', courseData, { withCredentials: true });
            setCourseData({ title: '', description: '', instructor: '', credits: 3 });
            if (onCourseAdded) onCourseAdded();
            alert('Course added successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add course');
        } finally {
            setLoading(false);
        }
    };

    const formatLabel = (key) => key.replace(/_/g, ' ').toUpperCase();

    return (
        <div className="animate-fadeIn">
            <div className="auth-tabs mb-4" style={{maxWidth: '400px'}}>
                <button 
                    className={`auth-tab ${activeTab === 'courses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('courses')}
                >
                    Manage Courses
                </button>
                <button 
                    className={`auth-tab ${activeTab === 'students' ? 'active' : ''}`}
                    onClick={() => setActiveTab('students')}
                >
                    Student Directory
                </button>
            </div>

            {error && <div className="alert alert-danger py-2 small mb-4">{error}</div>}

            {activeTab === 'courses' ? (
                <div className="portal-card">
                    <h4 className="fw-bold text-dark mb-4">Add New Course</h4>
                    <form onSubmit={handleCourseSubmit}>
                        <div className="row g-4">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold text-muted small">COURSE TITLE</label>
                                <input
                                    type="text"
                                    name="title"
                                    className="form-control"
                                    placeholder="e.g. Advanced Web Development"
                                    value={courseData.title}
                                    onChange={handleCourseChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-semibold text-muted small">INSTRUCTOR</label>
                                <input
                                    type="text"
                                    name="instructor"
                                    className="form-control"
                                    placeholder="e.g. Dr. Jane Doe"
                                    value={courseData.instructor}
                                    onChange={handleCourseChange}
                                />
                            </div>
                            <div className="col-12">
                                <label className="form-label fw-semibold text-muted small">DESCRIPTION</label>
                                <textarea
                                    name="description"
                                    className="form-control"
                                    rows="3"
                                    placeholder="Provide a brief course overview..."
                                    value={courseData.description}
                                    onChange={handleCourseChange}
                                ></textarea>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-semibold text-muted small">CREDITS</label>
                                <input
                                    type="number"
                                    name="credits"
                                    className="form-control"
                                    min="1"
                                    max="10"
                                    value={courseData.credits}
                                    onChange={handleCourseChange}
                                />
                            </div>
                            <div className="col-md-8 d-flex align-items-end">
                                <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={loading}>
                                    {loading ? (
                                        <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Adding...</>
                                    ) : (
                                        <><i className="bi bi-plus-circle me-2"></i>Create Course</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="portal-card">
                    <h4 className="fw-bold text-dark mb-4">Registered Students</h4>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr style={{fontSize: '0.75rem', fontWeight: 800, color: '#64748b'}}>
                                    <th>NAME</th>
                                    <th>JEE APP NO</th>
                                    <th>DEPARTMENT</th>
                                    <th>CASTE</th>
                                    <th>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    <tr key={student.id}>
                                        <td>
                                            <div className="fw-bold text-dark">{student.name}</div>
                                            <small className="text-muted">{student.email}</small>
                                        </td>
                                        <td><code className="text-primary fw-bold">{student.jee_app_no}</code></td>
                                        <td><span className="badge bg-light text-dark">{student.department || 'N/A'}</span></td>
                                        <td><span className="badge bg-soft-primary text-primary">{student.caste}</span></td>
                                        <td>
                                            <button 
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => fetchStudentDetail(student.id)}
                                            >
                                                Verify Info
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Student Detail View */}
                    {selectedStudent && (
                        <div className="modal-backdrop show" style={{background: 'rgba(0,0,0,0.5)'}}>
                            <div className="modal show d-block" tabIndex="-1">
                                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                                    <div className="modal-content border-0 shadow-lg" style={{borderRadius: '20px'}}>
                                        <div className="modal-header border-0 pb-0">
                                            <h5 className="modal-title fw-bold">Student Verification: {selectedStudent.name}</h5>
                                            <button type="button" className="btn-close" onClick={() => setSelectedStudent(null)}></button>
                                        </div>
                                        <div className="modal-body p-4">
                                            <div className="row g-4 mb-4">
                                                <div className="col-md-6 col-lg-4">
                                                    <label className="profile-label">JEE Application No</label>
                                                    <p className="profile-value">{selectedStudent.jee_app_no}</p>
                                                </div>
                                                <div className="col-md-6 col-lg-4">
                                                    <label className="profile-label">Aadhaar Number</label>
                                                    <p className="profile-value">{selectedStudent.aadhaar_no}</p>
                                                </div>
                                                <div className="col-md-6 col-lg-4">
                                                    <label className="profile-label">Date of Birth</label>
                                                    <p className="profile-value">{new Date(selectedStudent.dob).toLocaleDateString()}</p>
                                                </div>
                                                <div className="col-md-6 col-lg-4">
                                                    <label className="profile-label">Gender</label>
                                                    <p className="profile-value">{selectedStudent.gender}</p>
                                                </div>
                                                <div className="col-md-6 col-lg-4">
                                                    <label className="profile-label">Blood Group</label>
                                                    <p className="profile-value">{selectedStudent.blood_group}</p>
                                                </div>
                                                <div className="col-md-6 col-lg-4">
                                                    <label className="profile-label">Nationality</label>
                                                    <p className="profile-value">{selectedStudent.nationality}</p>
                                                </div>
                                                <div className="col-md-6 col-lg-4">
                                                    <label className="profile-label">Caste / Category</label>
                                                    <p className="profile-value">{selectedStudent.caste}</p>
                                                </div>
                                                <div className="col-md-6 col-lg-4">
                                                    <label className="profile-label">JEE AIR Rank</label>
                                                    <p className="profile-value">{selectedStudent.jee_rank}</p>
                                                </div>
                                                 <div className="col-md-6 col-lg-4">
                                                    <label className="profile-label">Phone</label>
                                                    <p className="profile-value">{selectedStudent.phone}</p>
                                                </div>
                                            </div>

                                            <h6 className="fw-bold mb-3 border-bottom pb-2">Family Information</h6>
                                            <div className="row g-3 mb-4">
                                                <div className="col-md-6">
                                                    <label className="profile-label">Father's Name & Occ.</label>
                                                    <p className="profile-value mb-0">{selectedStudent.father_name} ({selectedStudent.father_occ})</p>
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="profile-label">Mother's Name & Occ.</label>
                                                    <p className="profile-value mb-0">{selectedStudent.mother_name} ({selectedStudent.mother_occ})</p>
                                                </div>
                                                <div className="col-md-12">
                                                     <label className="profile-label">Annual Income</label>
                                                     <p className="profile-value mb-0">₹ {selectedStudent.father_income}</p>
                                                </div>
                                            </div>

                                            <h6 className="fw-bold mb-3 border-bottom pb-2">Academic Performance</h6>
                                            <div className="row g-3 mb-4">
                                                <div className="col-md-6">
                                                    <div className="p-3 bg-light rounded-3">
                                                        <label className="profile-label">10th Percentage</label>
                                                        <p className="profile-value mb-0">{selectedStudent.tenth_percent}% ({selectedStudent.tenth_pass_year})</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="p-3 bg-light rounded-3">
                                                        <label className="profile-label">12th Percentage</label>
                                                        <p className="profile-value mb-0">{selectedStudent.twelfth_percent}% ({selectedStudent.twelfth_pass_year})</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <h6 className="fw-bold mb-3 border-bottom pb-2">Documents</h6>
                                            <div className="row g-2">
                                                {selectedStudent.documents.map((doc, idx) => (
                                                    <div key={idx} className="col-md-6">
                                                        <a 
                                                            href={`http://localhost:5000${doc.url}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="doc-item text-decoration-none"
                                                        >
                                                            <div className="doc-icon"><i className="bi bi-file-earmark-pdf"></i></div>
                                                            <div className="doc-name">{formatLabel(doc.type)}</div>
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="modal-footer border-0">
                                            <button className="btn btn-secondary" onClick={() => setSelectedStudent(null)}>Close</button>
                                            <button className="btn btn-success">Verify & Approve</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
