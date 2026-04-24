import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];

const AdminDashboardStats = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/admin/dashboard', { withCredentials: true });
            setData(res.data);
        } catch (err) {
            setError('Failed to fetch dashboard statistics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-5 text-muted">
            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
            Loading system analytics...
        </div>;
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    if (!data || !data.courses || data.courses.length === 0) {
        return <div className="text-center py-5 text-muted">No data available for analytics.</div>;
    }

    const { stats, courses } = data;

    // Prepare data for BarChart (Capacity vs Enrolled)
    const barData = courses.map(course => ({
        name: course.course_code,
        fullName: course.course_name,
        Capacity: course.capacity,
        Enrolled: course.enrolled || 0
    }));

    // Prepare data for PieChart (Enrollment Distribution)
    const pieData = courses
        .filter(course => course.enrolled > 0)
        .map(course => ({
            name: course.course_code,
            value: course.enrolled || 0
        }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const fullName = payload[0].payload.fullName || label;
            return (
                <div className="custom-tooltip bg-white p-3 border shadow-sm rounded">
                    <p className="fw-bold mb-1" style={{color: '#1e293b'}}>{fullName}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} className="mb-0 small fw-semibold" style={{ color: entry.dataKey === 'Capacity' ? '#64748b' : entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="admin-stats-container animate-fadeIn">
            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="portal-card h-100 p-3 border-0 shadow-sm bg-white" style={{borderRadius: '16px', borderLeft: '4px solid #3b82f6 !important'}}>
                        <div className="text-muted small fw-bold mb-1">TOTAL STUDENTS</div>
                        <div className="d-flex align-items-center">
                            <h3 className="fw-bold mb-0 me-2">{stats.total_students}</h3>
                            <i className="bi bi-people text-primary opacity-50"></i>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="portal-card h-100 p-3 border-0 shadow-sm bg-white" style={{borderRadius: '16px', borderLeft: '4px solid #10b981 !important'}}>
                        <div className="text-muted small fw-bold mb-1">TOTAL COURSES</div>
                        <div className="d-flex align-items-center">
                            <h3 className="fw-bold mb-0 me-2">{stats.total_courses}</h3>
                            <i className="bi bi-book text-success opacity-50"></i>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="portal-card h-100 p-3 border-0 shadow-sm bg-white" style={{borderRadius: '16px', borderLeft: '4px solid #f59e0b !important'}}>
                        <div className="text-muted small fw-bold mb-1">TOTAL ENROLLED</div>
                        <div className="d-flex align-items-center">
                            <h3 className="fw-bold mb-0 me-2">{stats.total_enrollments}</h3>
                            <i className="bi bi-check2-circle text-warning opacity-50"></i>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="portal-card h-100 p-3 border-0 shadow-sm bg-white" style={{borderRadius: '16px', borderLeft: '4px solid #ef4444 !important'}}>
                        <div className="text-muted small fw-bold mb-1">PENDING REQUESTS</div>
                        <div className="d-flex align-items-center">
                            <h3 className="fw-bold mb-0 me-2">{stats.pending_requests}</h3>
                            <i className="bi bi-clock-history text-danger opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="row g-4">
                {/* Bar Chart Section */}
                <div className="col-lg-8">
                    <div className="portal-card h-100 p-4 shadow-sm border-0 bg-white" style={{borderRadius: '20px'}}>
                        <h6 className="fw-bold text-dark mb-4"><i className="bi bi-bar-chart-fill me-2 text-primary"></i>Capacity vs. Enrollments</h6>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer>
                                <BarChart
                                    data={barData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="Capacity" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Enrolled" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Pie Chart Section */}
                <div className="col-lg-4">
                    <div className="portal-card h-100 p-4 shadow-sm border-0 bg-white d-flex flex-column" style={{borderRadius: '20px'}}>
                        <h6 className="fw-bold text-dark mb-4"><i className="bi bi-pie-chart-fill me-2 text-success"></i>Enrollment Distribution</h6>
                        {pieData.length > 0 ? (
                            <div style={{ width: '100%', flex: 1, minHeight: 300 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ fontWeight: 600, color: '#334155' }}
                                        />
                                        <Legend iconType="circle" iconSize={8} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted bg-light rounded-4 p-4">
                                <i className="bi bi-inbox fs-1 mb-2 opacity-20"></i>
                                <div className="small">No enrollment data to display</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardStats;
