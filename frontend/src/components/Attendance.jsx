import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Attendance = ({ user }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get('http://localhost:5000/student/profile', { withCredentials: true });
                setProfile(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching profile', err);
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const subjects = [
        { code: 'CS1001', name: 'PROGRAMMING IN C & DATA STRUCTURE' },
        { code: 'MA1001', name: 'MATH 1' },
        { code: 'PH1001', name: 'PHYSICS' },
        { code: 'EE1001', name: 'BASIC ELECTRICAL ENGINEERING' },
        { code: 'CE1001', name: 'BASIC CIVIL ENGINEERING' },
        { code: 'HM1001', name: 'UNIVERSAL HUMAN VALUES' }
    ];

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
    if (!profile) return <div className="alert alert-danger m-4">Profile not found.</div>;

    const is2026 = String(profile.jee_app_no || '').startsWith('26');
    const isApproved = profile.enrollment_status === 'Approved' || !is2026;

    if (!isApproved && is2026) {
        return (
            <div className="animate-fadeIn p-4 text-center">
                <div className="portal-card p-5 shadow-sm bg-white" style={{borderRadius: '24px'}}>
                    <i className="bi bi-calendar-x-fill text-muted opacity-50 fs-1 mb-4 d-block"></i>
                    <h4 className="fw-bold text-dark">Attendance Not Available</h4>
                    <p className="text-muted mb-4">Attendance tracking will begin once your **Semester Registration** is complete and approved.</p>
                    <div className="p-3 bg-light rounded-4 small">
                        Current Enrollment Status: <span className="fw-bold text-primary text-uppercase">{profile.enrollment_status || 'Pending'}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn p-2">
            <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: '24px' }}>
                <div className="card-header bg-white border-0 p-4">
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="fw-bold text-dark d-flex align-items-center mb-0">
                            <i className="bi bi-clock-history me-3 text-primary fs-3"></i>
                            Attendance Overview
                        </h4>
                        <div className="text-end">
                            <div className="text-muted small">AGGREGATE</div>
                            <div className="fw-bold text-danger">0.00%</div>
                        </div>
                    </div>
                </div>
                
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr className="small fw-bold text-muted">
                                    <th className="ps-4">SUBJECT CODE & NAME</th>
                                    <th>ATTENDED</th>
                                    <th>TOTAL</th>
                                    <th className="pe-4 text-end">PERCENTAGE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.map((sub, idx) => (
                                    <tr key={idx}>
                                        <td className="ps-4 py-3">
                                            <div className="fw-bold text-dark small">{sub.name}</div>
                                            <code className="text-primary x-small">{sub.code}</code>
                                        </td>
                                        <td className="small">0</td>
                                        <td className="small">0</td>
                                        <td className="pe-4 text-end">
                                            <div className="d-flex align-items-center justify-content-end">
                                                <div className="progress flex-grow-0 me-3" style={{height: '6px', width: '100px'}}>
                                                    <div className="progress-bar bg-danger" style={{width: '0%'}}></div>
                                                </div>
                                                <span className="fw-bold text-danger small">0%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="p-4 bg-light-subtle">
                        <div className="alert alert-info border-0 rounded-4 mb-0 small">
                            <i className="bi bi-info-circle-fill me-2"></i>
                            Attendance is updated daily by the respective faculty members. Please contact the department for any discrepancies.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
