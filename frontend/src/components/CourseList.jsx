import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CourseList = ({ user }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const coursesRes = await axios.get('http://localhost:5000/courses', { withCredentials: true });
            setCourses(coursesRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch data', err);
            setLoading(false);
        }
    };

    const handleEnroll = async (courseId) => {
        try {
            await axios.post(`http://localhost:5000/course/enroll/${courseId}`, {}, { withCredentials: true });
            setMessage('Enrollment request submitted!');
            fetchData();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Enrollment failed');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleDrop = async (courseId) => {
        if (!window.confirm("Are you sure you want to drop this course?")) return;
        try {
            await axios.post(`http://localhost:5000/course/drop/${courseId}`, {}, { withCredentials: true });
            setMessage('Course dropped successfully!');
            fetchData();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to drop course');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'Pending': return <span className="badge bg-warning text-dark shadow-sm"><i className="bi bi-hourglass-split me-1"></i>Pending Approval</span>;
            case 'Approved': return <span className="badge bg-success shadow-sm"><i className="bi bi-check-circle-fill me-1"></i>Enrolled</span>;
            case 'Rejected': return <span className="badge bg-danger shadow-sm"><i className="bi bi-x-circle-fill me-1"></i>Rejected</span>;
            default: return null;
        }
    };

    const filteredCourses = courses.filter(course => 
        course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.instructor && course.instructor.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="mt-2 animate-fadeIn">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <h3 className="h4 fw-bold mb-0">
                    <i className="bi bi-book-half me-2 text-primary"></i>
                    {user.role === 'admin' ? 'Course Catalog Management' : 'Select Your Courses'}
                </h3>
                
                <div className="search-box position-relative" style={{ minWidth: '300px' }}>
                    <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    <input 
                        type="text" 
                        className="form-control ps-5 border-0 shadow-sm" 
                        placeholder="Search name, code, or instructor..." 
                        style={{ borderRadius: '12px', background: '#f8fafc' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {message && (
                <div className={`alert ${message.includes('failed') || message.includes('not met') || message.includes('capacity') ? 'alert-danger' : 'alert-success'} border-0 shadow-sm animate-fadeIn py-2 mb-4 d-flex align-items-center`}>
                    <i className={`bi ${message.includes('success') ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                    {message}
                </div>
            )}
            
            <div className="row g-4">
                {filteredCourses.map(course => (
                    <div key={course.id} className="col-md-6 col-xxl-4">
                        <div className="card h-100 border-0 shadow-sm hover-shadow transition-all" style={{ borderRadius: '20px', background: '#ffffff' }}>
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <span className="badge bg-soft-primary text-primary px-3 py-2" style={{ borderRadius: '8px' }}>{course.credits} Credits</span>
                                    <code className="text-muted fw-bold small">{course.course_code}</code>
                                </div>
                                <h5 className="card-title fw-bold text-dark mb-3">{course.course_name}</h5>
                                
                                <div className="d-flex flex-column gap-2 mb-3">
                                    <div className="d-flex align-items-center text-muted small">
                                        <i className="bi bi-person-badge me-2"></i>{course.instructor || 'Staff TBD'}
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center small text-muted">
                                            <i className="bi bi-people me-2"></i> 
                                            {course.enrolled_count || 0} / {course.capacity}
                                        </div>
                                        <div className="progress flex-grow-1 mx-3" style={{ height: '6px', maxWidth: '100px' }}>
                                            <div 
                                                className={`progress-bar ${((course.enrolled_count || 0) / course.capacity) > 0.9 ? 'bg-danger' : 'bg-success'}`} 
                                                style={{ width: `${((course.enrolled_count || 0) / course.capacity) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {course.prerequisites && course.prerequisites !== 'None' && (
                                    <div className="mb-3 p-2 rounded-3 bg-soft-danger text-danger border-start border-danger border-3" style={{ fontSize: '0.8rem' }}>
                                        <i className="bi bi-shield-lock-fill me-2"></i>
                                        <strong>Prerequisites:</strong> {course.prerequisites}
                                    </div>
                                )}
                                
                                <p className="card-text text-secondary mb-4" style={{ fontSize: '0.85rem', lineHeight: '1.5', minHeight: '3.8rem' }}>
                                    {course.description || 'No description available for this course.'}
                                </p>
                                
                                {user.role === 'student' && course.enrollment_status !== 'Not Enrolled' && (
                                    <div className="mt-auto pt-2">
                                        {getStatusBadge(course.enrollment_status)}
                                    </div>
                                )}
                            </div>
                            
                            {user.role === 'student' && (
                                <div className="card-footer bg-transparent border-0 p-4 pt-0">
                                    {course.enrollment_status === 'Not Enrolled' ? (
                                        <button 
                                            onClick={() => handleEnroll(course.id)} 
                                            className="btn btn-primary w-100 fw-bold py-2 shadow-sm"
                                            disabled={course.enrolled_count >= course.capacity}
                                            style={{ borderRadius: '12px' }}
                                        >
                                            {course.enrolled_count >= course.capacity ? 'Course Full' : 'Request Enrollment'}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleDrop(course.id)} 
                                            className="btn btn-outline-danger w-100 fw-bold py-2"
                                            style={{ borderRadius: '12px' }}
                                        >
                                            <i className="bi bi-trash3 me-2"></i>Drop / Cancel
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            {filteredCourses.length === 0 && (
                <div className="text-center py-5 mt-4" style={{ background: '#f8fafc', borderRadius: '20px' }}>
                    <i className="bi bi-search display-4 text-muted mb-3 d-block opacity-25"></i>
                    <p className="text-muted fw-semibold">No courses found matching "{searchTerm}"</p>
                    <button className="btn btn-link text-decoration-none" onClick={() => setSearchTerm('')}>Clear search</button>
                </div>
            )}
        </div>
    );
};

export default CourseList;
