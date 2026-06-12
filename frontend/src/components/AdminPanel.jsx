import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminDashboardStats from './AdminDashboardStats';
import AdminReports from './AdminReports';

const AdminPanel = ({ activeTab = 'dashboard', onCourseAdded }) => {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    
    // Course Management State
    const [courses, setCourses] = useState([]);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const defaultCourseState = {
        course_name: '', course_code: '', capacity: 50, credits: 3, prerequisites: '', instructor: '', description: ''
    };
    const [courseData, setCourseData] = useState(defaultCourseState);
    
    // Enrollments State
    const [enrollments, setEnrollments] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (activeTab === 'students') {
            fetchStudents();
        } else if (activeTab === 'courses') {
            fetchCourses();
        } else if (activeTab === 'enrollments') {
            fetchEnrollments();
        }
    }, [activeTab]);

    const fetchEnrollments = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/admin/enrollments', { withCredentials: true });
            setEnrollments(res.data);
        } catch (err) {
            setError('Failed to fetch enrollments');
        } finally {
            setLoading(false);
        }
    };

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

    const handleDeleteStudent = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this student record? This cannot be undone.")) return;
        try {
            await axios.delete(`http://localhost:5000/admin/student/delete/${id}`, { withCredentials: true });
            fetchStudents();
        } catch (err) {
            alert('Failed to delete student');
        }
    };

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/admin/courses', { withCredentials: true });
            setCourses(res.data);
        } catch (err) {
            setError('Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    };

    const handleCourseChange = (e) => {
        setCourseData({ ...courseData, [e.target.name]: e.target.value });
    };

    const handleAddNewCourseClick = () => {
        setEditingCourse(null);
        setCourseData(defaultCourseState);
        setIsCourseModalOpen(true);
    };

    const handleEditCourseClick = (course) => {
        setEditingCourse(course);
        setCourseData(course);
        setIsCourseModalOpen(true);
    };

    const handleDeleteCourse = async (id) => {
        if (!window.confirm("Are you sure you want to delete this course?")) return;
        try {
            await axios.post(`http://localhost:5000/admin/course/delete/${id}`, {}, { withCredentials: true });
            fetchCourses();
            if (onCourseAdded) onCourseAdded();
        } catch (err) {
            alert('Failed to delete course');
        }
    };

    const handleCourseSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (editingCourse) {
                await axios.post(`http://localhost:5000/admin/course/edit/${editingCourse.id}`, courseData, { withCredentials: true });
            } else {
                await axios.post('http://localhost:5000/admin/course/add', courseData, { withCredentials: true });
            }
            setIsCourseModalOpen(false);
            fetchCourses();
            if (onCourseAdded) onCourseAdded();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save course');
        } finally {
            setLoading(false);
        }
    };

    const handleEnrollmentAction = async (id, action) => {
        try {
            await axios.post(`http://localhost:5000/admin/enrollment/${action}/${id}`, {}, { withCredentials: true });
            fetchEnrollments();
        } catch (err) {
            alert(err.response?.data?.message || `Failed to ${action} enrollment`);
        }
    };

    const formatLabel = (key) => key.replace(/_/g, ' ').toUpperCase();

    return (
        <div className="animate-fadeIn">
            {error && <div className="alert alert-danger py-2 small mb-4">{error}</div>}

            {activeTab === 'dashboard' ? (
                <AdminDashboardStats />
            ) : activeTab === 'reports' ? (
                <AdminReports />
            ) : activeTab === 'courses' ? (
                <div className="portal-card relative">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold text-dark mb-0">Course Catalog</h4>
                        <button className="btn btn-primary btn-sm px-3" onClick={handleAddNewCourseClick}>
                            <i className="bi bi-plus-lg me-2"></i>Add Course
                        </button>
                    </div>
                    
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr style={{fontSize: '0.75rem', fontWeight: 800, color: '#64748b'}}>
                                    <th>COURSE CODE & NAME</th>
                                    <th>CAPACITY</th>
                                    <th>CREDITS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map(course => (
                                    <tr key={course.id}>
                                        <td>
                                            <div className="fw-bold text-dark">{course.course_name}</div>
                                            <code className="text-primary">{course.course_code}</code>
                                        </td>
                                        <td>
                                            <span className="badge bg-light text-dark">{course.enrolled || 0} / {course.capacity}</span>
                                        </td>
                                        <td>{course.credits}</td>
                                        <td>
                                            <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleEditCourseClick(course)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCourse(course.id)}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {courses.length === 0 && <div className="text-center py-4 text-muted">No courses available.</div>}
                    </div>

                    {/* Course Add/Edit Modal */}
                    {isCourseModalOpen && (
                        <div className="modal-backdrop show">
                            <div className="modal show d-block" tabIndex="-1">
                                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                                    <div className="modal-content" style={{borderRadius: '20px'}}>
                                        <div className="modal-header border-0 pb-0">
                                            <h5 className="modal-title fw-bold">{editingCourse ? 'Edit Course' : 'Create New Course'}</h5>
                                            <button type="button" className="btn-close" onClick={() => setIsCourseModalOpen(false)}></button>
                                        </div>
                                        <form onSubmit={handleCourseSubmit}>
                                            <div className="modal-body p-4">
                                                <div className="row g-4">
                                                    <div className="col-md-8">
                                                        <label className="form-label fw-semibold text-muted small">COURSE NAME</label>
                                                        <input type="text" name="course_name" className="form-control" placeholder="e.g. Data Structures" value={courseData.course_name} onChange={handleCourseChange} required />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label fw-semibold text-muted small">COURSE CODE</label>
                                                        <input type="text" name="course_code" className="form-control" placeholder="e.g. CS101" value={courseData.course_code} onChange={handleCourseChange} required />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label fw-semibold text-muted small">TOTAL CAPACITY</label>
                                                        <input type="number" name="capacity" className="form-control" min="1" value={courseData.capacity} onChange={handleCourseChange} required />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label fw-semibold text-muted small">CREDITS</label>
                                                        <input type="number" name="credits" className="form-control" min="1" value={courseData.credits} onChange={handleCourseChange} required />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label fw-semibold text-muted small">PREREQUISITES</label>
                                                        <input type="text" name="prerequisites" className="form-control" placeholder="e.g. CS100" value={courseData.prerequisites} onChange={handleCourseChange} />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label fw-semibold text-muted small">DESCRIPTION</label>
                                                        <textarea name="description" className="form-control" rows="3" value={courseData.description} onChange={handleCourseChange}></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="modal-footer border-0 pt-0">
                                                <button type="button" className="btn btn-secondary mt-0" onClick={() => setIsCourseModalOpen(false)}>Cancel</button>
                                                <button type="submit" className="btn btn-primary mt-0" disabled={loading} style={{width: 'auto'}}>{loading ? 'Saving...' : 'Save Course'}</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : activeTab === 'enrollments' ? (
                <div className="portal-card relative">
                    <h4 className="fw-bold text-dark mb-4">Enrollment Requests</h4>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr style={{fontSize: '0.75rem', fontWeight: 800, color: '#64748b'}}>
                                    <th>STUDENT</th>
                                    <th>COURSE / BRANCH</th>
                                    <th>APPROVAL STATUS</th>
                                    <th>REMAINING SEATS</th>
                                    <th>DATE</th>
                                    <th>PAYMENT STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.map(enr => (
                                    <tr key={enr.enrollment_id}>
                                        <td>
                                            <div className="fw-bold text-dark">{enr.student_name}</div>
                                            <small className="text-muted">{enr.jee_app_no}</small>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-uppercase">{enr.course_name}</div>
                                            <small className={enr.type === 'Admission' ? 'badge bg-info-subtle text-info' : 'text-muted'}>
                                                {enr.type === 'Admission' ? 'BRANCH ADMISSION' : enr.course_code}
                                            </small>
                                        </td>
                                        <td>
                                            <span className={`badge ${enr.status === 'Approved' ? 'bg-success' : enr.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                                {enr.status}
                                            </span>
                                        </td>
                                        <td className="fw-bold text-center">
                                            {enr.remaining_seats} / {enr.capacity}
                                        </td>
                                        <td>{new Date(enr.enrolled_at).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge ${enr.fee_status === 'Paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                {enr.fee_status === 'Paid' ? 'Paid' : 'Unpaid'}
                                            </span>
                                            {enr.status === 'Pending' && enr.current_enrolled >= enr.capacity && (
                                                <div className="text-danger small mt-1"><i className="bi bi-exclamation-triangle-fill"></i> Full Capacity</div>
                                            )}
                                        </td>
                                        <td>
                                            {enr.status === 'Pending' && (
                                                <div className="d-flex gap-2">
                                                    <button 
                                                        className="btn btn-sm btn-success" 
                                                        onClick={() => handleEnrollmentAction(enr.enrollment_id, 'approve')} 
                                                        disabled={enr.current_enrolled >= enr.capacity || enr.fee_status !== 'Paid'}
                                                        title={
                                                            enr.fee_status !== 'Paid' ? 'Payment required before approval' :
                                                            enr.current_enrolled >= enr.capacity ? 'Course is full' : 'Approve'
                                                        }
                                                    >
                                                        <i className="bi bi-check-lg"></i> Approve
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-danger" 
                                                        onClick={() => handleEnrollmentAction(enr.enrollment_id, 'reject')}
                                                    >
                                                        <i className="bi bi-x-lg"></i> Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {enrollments.length === 0 && <div className="text-center py-4 text-muted">No enrollment requests found.</div>}
                    </div>
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
                                    <th>BRANCH</th>
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
                                        <td><code className="text-primary fw-bold">{student.jee_app_no || 'NOT REGISTERED'}</code></td>
                                        <td><span className="badge bg-soft-primary text-primary text-uppercase">{student.branch || 'N/A'}</span></td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button 
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => fetchStudentDetail(student.id)}
                                                >
                                                    View Details
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteStudent(student.id)}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Student Detail View */}
                    {selectedStudent && (
                        <div className="modal-backdrop show">
                            <div className="modal show d-block" tabIndex="-1">
                                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                                    <div className="modal-content" style={{borderRadius: '20px'}}>
                                        <div className="modal-header border-0 pb-0">
                                            <h5 className="modal-title fw-bold">Student Verification: {selectedStudent.name}</h5>
                                            <button type="button" className="btn-close" onClick={() => setSelectedStudent(null)}></button>
                                        </div>
                                        <div className="modal-body p-4">
                                            {selectedStudent.jee_app_no ? (
                                                <>
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
                                                            <label className="profile-label">Course / Branch</label>
                                                            <p className="profile-value text-uppercase">{selectedStudent.course || 'N/A'}</p>
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

                                                    <h6 className="fw-bold mb-3 border-bottom pb-2">Academic Performance (SGPA)</h6>
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

                                                    <div className="row g-3 mb-4">
                                                        {selectedStudent.sgpa && (
                                                            <div className="col-md-6">
                                                                <label className="profile-label text-primary fw-bold">Latest Semester SGPA</label>
                                                                <div className="p-3 bg-primary bg-opacity-10 rounded-3 border border-primary border-opacity-10 d-flex align-items-center">
                                                                    <i className="bi bi-graph-up-arrow me-3 text-primary"></i>
                                                                    <div>
                                                                        <span className="fs-4 fw-bold text-primary">{selectedStudent.sgpa}</span>
                                                                        <span className="text-muted ms-2 small">/ 10.0</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {selectedStudent.cgpa && (
                                                            <div className="col-md-6">
                                                                <label className="profile-label text-success fw-bold">Cumulative CGPA</label>
                                                                <div className="p-3 bg-success bg-opacity-10 rounded-3 border border-success border-opacity-10 d-flex align-items-center">
                                                                    <i className="bi bi-mortarboard me-3 text-success"></i>
                                                                    <div>
                                                                        <span className="fs-4 fw-bold text-success">{selectedStudent.cgpa}</span>
                                                                        <span className="text-muted ms-2 small">/ 10.0</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
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
                                                </>
                                            ) : (
                                                <div className="text-center py-5 text-muted">
                                                    <i className="bi bi-exclamation-circle fs-1 mb-3 opacity-25"></i>
                                                    <p>This student has not yet completed their registration details.</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="modal-footer border-0">
                                            <button className="btn btn-secondary" onClick={() => setSelectedStudent(null)}>Close</button>
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
