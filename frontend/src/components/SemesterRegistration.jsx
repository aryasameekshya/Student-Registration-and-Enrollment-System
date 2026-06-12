import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { generateTransactionHistory } from '../utils/transactionUtils';

const SemesterRegistration = ({ user }) => {
    const [profile, setProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('http://localhost:5000/student/profile', { withCredentials: true });
                setProfile(res.data);
                
                const storageKey = `transaction_history_v5_${res.data.id}`;
                let txns = localStorage.getItem(storageKey);
                
                if (txns) {
                    txns = JSON.parse(txns);
                } else {
                    txns = generateTransactionHistory(res.data);
                    localStorage.setItem(storageKey, JSON.stringify(txns));
                }
                
                setTransactions(txns);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching data', err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
    if (!profile) return <div className="alert alert-danger m-4">Profile not found. Please complete registration first.</div>;

    const lastTxn = transactions.length > 0 ? transactions[transactions.length - 1] : null;
    const currentSem = lastTxn ? lastTxn.sem : '1';
    const payStatus = lastTxn ? lastTxn.status : 'Unpaid';

    // Official subjects for 1st Semester (CSE, IT, AIML)
    const getSubjects = (branch) => {
        const commonSubjects = [
            { type: 'PC', code: 'CS1001', name: 'PROGRAMMING IN C & DATA STRUCTURE' },
            { type: 'BS', code: 'MA1001', name: 'MATH 1' },
            { type: 'BS', code: 'PH1001', name: 'PHYSICS' },
            { type: 'ES', code: 'EE1001', name: 'BASIC ELECTRICAL ENGINEERING' },
            { type: 'ES', code: 'CE1001', name: 'BASIC CIVIL ENGINEERING' },
            { type: 'HS', code: 'HM1001', name: 'UNIVERSAL HUMAN VALUES' }
        ];
        
        return commonSubjects;
    };

    const is2026 = String(profile.jee_app_no || '').startsWith('26');
    const isApproved = profile.enrollment_status === 'Approved' || !is2026;

    if (!isApproved && is2026) {
        return (
            <div className="animate-fadeIn p-4 text-center">
                <div className="portal-card p-5 shadow-sm bg-white" style={{borderRadius: '24px'}}>
                    <i className="bi bi-shield-lock-fill text-warning fs-1 mb-4 d-block"></i>
                    <h4 className="fw-bold text-dark">Registration Locked</h4>
                    <p className="text-muted mb-4">1st Semester Registration only can be done after your enrollment status is <span className="badge bg-success">Approved</span> by the administration.</p>
                    <div className="p-3 bg-light rounded-4 small">
                        Current Status: <span className="fw-bold text-primary text-uppercase">{profile.enrollment_status || 'Pending'}</span>
                    </div>
                </div>
            </div>
        );
    }

    const subjects = getSubjects(profile.course);

    return (
        <div className="animate-fadeIn p-2">
            <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: '24px' }}>
                <div className="card-header bg-white border-0 p-4 pb-0">
                    <h4 className="fw-bold text-dark d-flex align-items-center mb-0">
                        <i className="bi bi-calendar-check-fill me-3 text-primary fs-3"></i>
                        Semester Registration
                    </h4>
                </div>
                
                <div className="card-body p-4">
                    {/* Student Info Section */}
                    <div className="mb-5">
                        <h6 className="text-muted small fw-bold mb-4 d-flex align-items-center">
                            <i className="bi bi-person-fill me-2"></i> STUDENT INFO
                        </h6>
                        <div className="p-4 rounded-4 bg-light border border-light-subtle">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="d-flex justify-content-between border-bottom pb-2">
                                        <span className="text-muted small">Registration No.</span>
                                        <span className="fw-bold small">{profile.jee_app_no}</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex justify-content-between border-bottom pb-2">
                                        <span className="text-muted small">Student Name</span>
                                        <span className="fw-bold small text-uppercase">{profile.name}</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                     <div className="d-flex justify-content-between border-bottom pb-2">
                                         <span className="text-muted small">Semester</span>
                                         <span className="fw-bold small">{currentSem}{currentSem === '1' ? 'st' : currentSem === '2' ? 'nd' : currentSem === '3' ? 'rd' : 'th'} Semester</span>
                                     </div>
                                 </div>
                                 <div className="col-md-6">
                                     <div className="d-flex justify-content-between border-bottom pb-2">
                                         <span className="text-muted small">Programme</span>
                                         <span className="fw-bold small">B. Tech.</span>
                                     </div>
                                 </div>
                                 <div className="col-md-6">
                                     <div className="d-flex justify-content-between border-bottom pb-2">
                                         <span className="text-muted small">Branch</span>
                                         <span className="fw-bold small text-uppercase">{profile.course}</span>
                                     </div>
                                 </div>
                                 <div className="col-md-6">
                                     <div className="d-flex justify-content-between border-bottom pb-2">
                                         <span className="text-muted small">Fee Programme Type</span>
                                         <span className="fw-bold small">SSP</span>
                                     </div>
                                 </div>
                                 <div className="col-md-6">
                                     <div className="d-flex justify-content-between border-bottom pb-2">
                                         <span className="text-muted small">Fee Stud Type</span>
                                         <span className="fw-bold small">{profile.caste || 'General'}</span>
                                     </div>
                                 </div>
                                 <div className="col-md-6">
                                     <div className="d-flex justify-content-between border-bottom pb-2">
                                         <span className="text-muted small">Is Hostelier</span>
                                         <span className="fw-bold small">N</span>
                                     </div>
                                 </div>
                                 <div className="col-md-6">
                                     <div className="d-flex justify-content-between border-bottom pb-2 align-items-center">
                                         <span className="text-muted small">Registration Fee Pay Status</span>
                                         <span className={`badge ${payStatus === 'Success' ? 'bg-success' : 'bg-warning text-dark'}`} style={{fontSize: '0.65rem'}}>
                                             {payStatus === 'Success' ? 'SUCCESS' : payStatus.toUpperCase()}
                                         </span>
                                     </div>
                                 </div>
                                 <div className="col-md-6">
                                     <div className="d-flex justify-content-between border-bottom pb-2 align-items-center">
                                         <span className="text-muted small">Semester Registration Status</span>
                                         <div className="d-flex align-items-center gap-2">
                                             {payStatus === 'Success' ? (
                                                 <span className="badge bg-success" style={{fontSize: '0.65rem'}}>COMPLETE</span>
                                             ) : (
                                                 <span className="badge bg-danger" style={{fontSize: '0.65rem'}}>PENDING</span>
                                             )}
                                             {payStatus === 'Success' && <i className="bi bi-printer text-primary" style={{cursor: 'pointer'}}></i>}
                                         </div>
                                     </div>
                                 </div>
                            </div>
                        </div>
                    </div>

                    {/* Registered Subjects Section */}
                    <div>
                        <h6 className="text-muted small fw-bold mb-4 d-flex align-items-center">
                            <i className="bi bi-journal-text me-2"></i> REGISTERED SUBJECTS
                        </h6>
                        <div className="rounded-4 border overflow-hidden">
                            {subjects.map((sub, index) => (
                                <div key={index} className="p-3 border-bottom bg-white hover-bg-light transition-all">
                                    <div className="text-muted x-small fw-bold mb-1">— {sub.type}</div>
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-check2 text-primary fw-bold"></i>
                                        <span className="small fw-semibold">{sub.code}:</span>
                                        <span className="small text-uppercase">{sub.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SemesterRegistration;
