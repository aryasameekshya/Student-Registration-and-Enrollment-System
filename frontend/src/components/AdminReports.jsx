import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];

const AdminReports = () => {
    const [studentData, setStudentData] = useState(null);
    const [courseData, setCourseData] = useState(null);
    const [enrollmentData, setEnrollmentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAllReports();
    }, []);

    const fetchAllReports = async () => {
        setLoading(true);
        try {
            const [students, courses, enrollments] = await Promise.all([
                axios.get('http://localhost:5000/admin/reports/students', { withCredentials: true }),
                axios.get('http://localhost:5000/admin/reports/courses', { withCredentials: true }),
                axios.get('http://localhost:5000/admin/reports/enrollments', { withCredentials: true })
            ]);
            setStudentData(students.data);
            setCourseData(courses.data);
            setEnrollmentData(enrollments.data);
        } catch (err) {
            setError('Failed to fetch reports. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row =>
            Object.values(row).map(val =>
                typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
            ).join(',')
        );

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div><p className="mt-2 text-muted">Generating insights...</p></div>;
    if (error) return <div className="alert alert-danger m-4">{error}</div>;

    return (
        <div className="reports-container animate-fadeIn px-2">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold text-dark mb-0"><i className="bi bi-graph-up-arrow me-2 text-primary"></i>System Insights</h3>
                <button className="btn btn-outline-primary btn-sm" onClick={fetchAllReports}>
                    <i className="bi bi-arrow-clockwise me-2"></i>Refresh Data
                </button>
            </div>

            {/* Student Demographics Section */}
            <div className="report-section mb-5">
                <div className="d-flex justify-content-between align-items-end mb-3 border-bottom pb-2">
                    <h5 className="fw-bold mb-0">1. Student Demographics & Status</h5>
                </div>

                <div className="row g-4">
                    <div className="col-lg-6">
                        <div className="portal-card p-4 shadow-sm bg-white h-100" style={{ borderRadius: '16px' }}>
                            <h6 className="text-muted small fw-bold mb-4">GENDER SPLIT</h6>
                            <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={studentData.gender} dataKey="count" nameKey="gender" cx="50%" cy="50%" outerRadius={80}>
                                            {studentData.gender.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="portal-card p-4 shadow-sm bg-white h-100" style={{ borderRadius: '16px' }}>
                            <h6 className="text-muted small fw-bold mb-4">ENROLLMENT STATUS</h6>
                            <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={enrollmentData.status_distribution} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                            {enrollmentData.status_distribution.map((entry, index) => (
                                                <Cell key={index} fill={entry.status === 'Approved' ? '#10b981' : entry.status === 'Rejected' ? '#ef4444' : '#f59e0b'} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Enrollment Section */}
            <div className="report-section mb-5">
                <div className="d-flex justify-content-between align-items-end mb-3 border-bottom pb-2">
                    <h5 className="fw-bold mb-0">2. Course Enrollment Report</h5>
                    <button className="btn btn-link btn-sm text-decoration-none p-0" onClick={() => exportToCSV(courseData, 'course_enrollment_report')}>
                        <i className="bi bi-download me-1"></i> Export Course Data
                    </button>
                </div>

                <div className="portal-card p-0 shadow-sm bg-white overflow-hidden" style={{ borderRadius: '16px' }}>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr className="small fw-bold text-muted">
                                    <th className="ps-4">COURSE NAME</th>
                                    <th>ENROLLED</th>
                                    <th>PENDING</th>
                                    <th>CAPACITY</th>
                                    <th className="pe-4">UTILIZATION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courseData.map((course, idx) => {
                                    const percent = Math.round((course.enrolled_count / course.capacity) * 100);
                                    return (
                                        <tr key={idx}>
                                            <td className="ps-4">
                                                <div className="fw-bold">{course.course_name}</div>
                                                <code className="text-primary small">{course.course_code}</code>
                                            </td>
                                            <td><span className="badge bg-soft-success text-success">{course.enrolled_count}</span></td>
                                            <td><span className="badge bg-soft-warning text-warning">{course.pending_count}</span></td>
                                            <td>{course.capacity}</td>
                                            <td className="pe-4">
                                                <div className="d-flex align-items-center">
                                                    <div className="progress flex-grow-1 me-2" style={{ height: '4px' }}>
                                                        <div className={`progress-bar ${percent > 90 ? 'bg-danger' : percent > 70 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${percent}%` }}></div>
                                                    </div>
                                                    <span className="small fw-bold">{percent}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
