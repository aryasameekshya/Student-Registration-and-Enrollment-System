import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentDashboardStats = ({ showTable = true }) => {
    const [stats, setStats] = useState({
        semester: 'N/A',
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, enrollRes] = await Promise.all([
                    axios.get('http://localhost:5000/student/enrollment-stats', { withCredentials: true }),
                    axios.get('http://localhost:5000/student/my-enrollments', { withCredentials: true })
                ]);
                setStats(statsRes.data);
                setEnrollments(enrollRes.data);
            } catch (err) {
                console.error("Error fetching dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;

    const cards = [
        { title: 'Current Semester', value: stats.semester, icon: '🎓', color: 'primary' },
        { title: 'Enrolled Courses', value: stats.total, icon: '📘', color: 'info' },
        { title: 'Pending Requests', value: stats.pending, icon: '⏳', color: 'warning' },
        { title: 'Approved Courses', value: stats.approved, icon: '✅', color: 'success' }
    ];

    return (
        <div className="animate-fadeIn">
            {/* Dashboard Cards */}
            <div className="row g-4 mb-5">
                {cards.map((card, idx) => (
                    <div key={idx} className="col-md-6 col-lg-3">
                        <div className="portal-card h-100 border-0 shadow-sm hover-up transition-all" style={{borderRadius: '20px'}}>
                            <div className="d-flex align-items-center">
                                <div className={`rounded-circle bg-soft-${card.color} p-3 me-3 fs-4`}>
                                    {card.icon}
                                </div>
                                <div>
                                    <div className="text-muted small fw-semibold text-uppercase" style={{letterSpacing: '0.5px'}}>{card.title}</div>
                                    <div className="fs-3 fw-bold text-dark">{card.value}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Enrollment Status Section */}
            {showTable && (
                <div className="portal-card border-0 shadow-sm" style={{borderRadius: '20px'}}>
                    <div className="d-flex align-items-center mb-4">
                        <div className="rounded-circle bg-soft-primary p-2 me-3">📋</div>
                        <h5 className="fw-bold text-dark mb-0">My Enrollment Status</h5>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr style={{fontSize: '0.75rem', fontWeight: 800, color: '#64748b'}}>
                                    <th>COURSE</th>
                                    <th>STATUS</th>
                                    <th>REQUESTED ON</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.map((enr, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <div className="fw-bold text-dark">{enr.course_name}</div>
                                            <code className="text-primary small">{enr.course_code}</code>
                                        </td>
                                        <td>
                                            <span className={`badge ${
                                                enr.status === 'Approved' ? 'bg-soft-success text-success' : 
                                                enr.status === 'Rejected' ? 'bg-soft-danger text-danger' : 
                                                'bg-soft-warning text-warning'
                                            } px-3 py-2 rounded-pill`}>
                                                {enr.status === 'Approved' ? '✅ Approved' : 
                                                 enr.status === 'Rejected' ? '❌ Rejected' : 
                                                 '⏳ Pending'}
                                            </span>
                                        </td>
                                        <td className="text-muted small">
                                            {new Date(enr.enrolled_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                        </td>
                                    </tr>
                                ))}
                                {enrollments.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="text-center py-4 text-muted small">
                                            No enrollment requests found. Start by selecting courses!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboardStats;
