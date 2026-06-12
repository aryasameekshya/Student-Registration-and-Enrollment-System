import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MiscTransactions = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [wantRecheck, setWantRecheck] = useState(false);
    const [numSubjects, setNumSubjects] = useState(1);
    const [paymentDone, setPaymentDone] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get('http://localhost:5000/student/profile', { withCredentials: true });
                setProfile(res.data);
            } catch (err) {
                console.error("Error fetching profile for Misc Transactions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handlePayment = () => {
        const total = numSubjects * 1500;
        if (window.confirm(`Proceed to pay ₹${total} for recheck of ${numSubjects} subject(s)?`)) {
            setPaymentDone(true);
            alert("Payment successful! Your recheck application has been submitted.");
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    const sgpaVal = profile?.sgpa ? parseFloat(profile.sgpa) : 10.0;
    const isLowSgpa = !isNaN(sgpaVal) && sgpaVal < 5.0;

    return (
        <div className="animate-fadeIn p-2">
            {!isLowSgpa ? (
                <div className="portal-card p-5 text-center shadow-sm bg-white" style={{borderRadius: '24px'}}>
                    <div className="mb-4">
                        <i className="bi bi-receipt-cutoff text-muted opacity-25" style={{fontSize: '5rem'}}></i>
                    </div>
                    <h4 className="fw-bold text-dark">Miscellaneous Transactions</h4>
                    <p className="text-muted">No miscellaneous transactions found for your account at this time.</p>
                    <div className="mt-4 pt-3 border-top w-50 mx-auto">
                        <span className="badge bg-light text-muted px-3 py-2">ALL CLEAR</span>
                    </div>
                </div>
            ) : (
                <div className="portal-card p-4 shadow-sm bg-white" style={{borderRadius: '24px'}}>
                    {!paymentDone ? (
                        <div className="p-3">
                            <div className="mb-4">
                                <label className="form-check-label fw-bold mb-3 d-block">Want to apply for recheck?</label>
                                <div className="d-flex gap-4">
                                    <div className="form-check">
                                        <input 
                                            className="form-check-input" 
                                            type="radio" 
                                            name="recheckChoice" 
                                            id="recheckYes" 
                                            checked={wantRecheck} 
                                            onChange={() => setWantRecheck(true)} 
                                        />
                                        <label className="form-check-label" htmlFor="recheckYes">Yes, Apply Now</label>
                                    </div>
                                    <div className="form-check">
                                        <input 
                                            className="form-check-input" 
                                            type="radio" 
                                            name="recheckChoice" 
                                            id="recheckNo" 
                                            checked={!wantRecheck} 
                                            onChange={() => setWantRecheck(false)} 
                                        />
                                        <label className="form-check-label" htmlFor="recheckNo">No, Not Now</label>
                                    </div>
                                </div>
                            </div>

                            {wantRecheck && (
                                <div className="animate-fadeIn">
                                    <div className="mb-4">
                                        <label className="form-label fw-bold small text-muted text-uppercase mb-2">No. of subjects you want to apply for recheck</label>
                                        <select 
                                            className="form-select form-select-sm rounded-3 border-2" 
                                            value={numSubjects} 
                                            onChange={(e) => setNumSubjects(parseInt(e.target.value))}
                                            style={{borderColor: '#e2e8f0', maxWidth: '300px'}}
                                        >
                                            {[1, 2, 3, 4, 5, 6].map(num => (
                                                <option key={num} value={num}>{num} Subject{num > 1 ? 's' : ''}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="p-4 rounded-4 bg-light mb-4 border border-dashed border-2">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="text-muted">Fee per Subject</span>
                                            <span className="fw-bold">₹1,500.00</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <span className="text-muted">Selected Subjects</span>
                                            <span className="fw-bold">{numSubjects}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center pt-3 border-top border-2">
                                            <span className="h6 mb-0 fw-bold">Total Amount to Pay</span>
                                            <span className="h4 mb-0 fw-bold text-primary">₹{(numSubjects * 1500).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <button 
                                        className="btn btn-primary btn-sm px-4 rounded-pill py-2 fw-bold shadow-sm transition-all"
                                        onClick={handlePayment}
                                        style={{width: 'auto'}}
                                    >
                                        <i className="bi bi-credit-card-fill me-2"></i>Pay Now
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-5 animate-fadeIn">
                            <div className="bg-success bg-opacity-10 p-4 rounded-circle d-inline-block mb-4">
                                <i className="bi bi-check-circle-fill text-success" style={{fontSize: '4rem'}}></i>
                            </div>
                            <h4 className="fw-bold text-dark">Application Submitted!</h4>
                            <p className="text-muted px-5">Your recheck application for {numSubjects} subject(s) has been successfully processed. You will be notified of the results soon.</p>
                            <button className="btn btn-outline-success mt-3 rounded-pill px-4" onClick={() => setPaymentDone(false)}>View Receipt</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MiscTransactions;
