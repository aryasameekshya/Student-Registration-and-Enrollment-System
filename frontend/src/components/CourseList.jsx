import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CourseList = ({ user }) => {
    const [courses, setCourses] = useState([]);
    const [enrolledIds, setEnrolledIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const coursesRes = await axios.get('http://localhost:5000/courses');
            setCourses(coursesRes.data);

            if (user.role === 'student') {
                const enrollmentRes = await axios.get('http://localhost:5000/my-enrollments', { withCredentials: true });
                setEnrolledIds(enrollmentRes.data.map(c => c.id));
            }
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch data', err);
            setLoading(false);
        }
    };

    const handleEnroll = async (courseId) => {
        try {
            await axios.post('http://localhost:5000/enroll', { course_id: courseId }, { withCredentials: true });
            setMessage('Enrolled successfully!');
            setEnrolledIds([...enrolledIds, courseId]);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Enrollment failed');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    if (loading) return <div className="text-center p-5">Loading courses...</div>;

    return (
        <div className="mt-2">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h4 fw-bold mb-0">{user.role === 'admin' ? 'Manage Courses' : 'Available Courses'}</h3>
                {message && <div className={`alert ${message.includes('failed') ? 'alert-danger' : 'alert-success'} py-2 mb-0 ms-3 small`}>{message}</div>}
            </div>
            
            <div className="row g-4">
                {courses.map(course => (
                    <div key={course.id} className="col-md-6 col-xxl-4">
                        <div className="card h-100 border shadow-sm hover-shadow transition-all" style={{ borderRadius: '16px' }}>
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <span className="badge bg-light text-primary border px-2 py-1">{course.credits} Credits</span>
                                    <i className="bi bi-bookmark text-muted"></i>
                                </div>
                                <h5 className="card-title fw-bold text-dark mb-2">{course.title}</h5>
                                <div className="d-flex align-items-center text-muted mb-3 small">
                                    <i className="bi bi-person-badge me-2"></i>
                                    <span>Instructor: {course.instructor || 'TBD'}</span>
                                </div>
                                <p className="card-text text-secondary line-clamp-3" style={{ fontSize: '0.9rem' }}>{course.description}</p>
                            </div>
                            <div className="card-footer bg-light border-0 p-4 pt-0">
                                {user.role === 'student' && (
                                    <button 
                                        onClick={() => handleEnroll(course.id)} 
                                        className={`btn w-100 fw-bold py-2 ${enrolledIds.includes(course.id) ? 'btn-success disabled' : 'btn-primary'}`}
                                        style={{ borderRadius: '10px' }}
                                    >
                                        {enrolledIds.includes(course.id) ? (
                                            <><i className="bi bi-check-circle me-2"></i>Enrolled</>
                                        ) : 'Enroll Now'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {courses.length === 0 && (
                <div className="text-center py-5 border rounded-3 bg-light">
                    <i className="bi bi-inbox display-4 text-muted mb-3 d-block"></i>
                    <p className="text-muted">No courses available yet.</p>
                </div>
            )}
        </div>
    );
};

export default CourseList;
