import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { generateTransactionHistory } from '../utils/transactionUtils';

const Transactions = ({ user: initialUser }) => {
    const [transactions, setTransactions] = useState([]);
    const [sgpa, setSgpa] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sync total fee status to backend
    const syncFeeStatus = async (txns) => {
        console.log("[DEBUG] Checking if student has paid all initial dues...", txns);
        // Condition: Admission, Sem 1 Regn, and Sem 1 Fee all Success
        const admissionPaid = txns.some(t => t.ref_no.startsWith('ADM') && t.status === 'Success');
        const regnPaid = txns.some(t => t.sem === '1' && t.ref_no.startsWith('REG') && t.status === 'Success');
        const semPaid = txns.some(t => t.sem === '1' && t.ref_no.startsWith('SEM') && t.status === 'Success');

        console.log(`[DEBUG] Conditions - Admission: ${admissionPaid}, Regn: ${regnPaid}, Sem: ${semPaid}`);

        if (admissionPaid && regnPaid && semPaid) {
            console.log("[DEBUG] All conditions met! Sending 'Paid' status to backend...");
            try {
                const res = await axios.post('http://localhost:5000/student/update-fee-status', 
                    { fee_status: 'Paid' }, 
                    { withCredentials: true }
                );
                console.log("[DEBUG] Backend sync successful:", res.data);
                // Optional: alert("Your payment status has been updated to 'Paid' for the Admin Panel.");
            } catch (err) {
                console.error("[DEBUG] Failed to sync fee status", err);
            }
        }
    };

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await axios.get('http://localhost:5000/student/profile', { withCredentials: true });
                const profile = res.data;
                const storageKey = `transaction_history_v5_${profile.id}`;
                
                let txns = localStorage.getItem(storageKey);
                let txnsList = [];
                if (txns) {
                    txnsList = JSON.parse(txns);
                } else {
                    txnsList = generateTransactionHistory(profile);
                    localStorage.setItem(storageKey, JSON.stringify(txnsList));
                }
                setTransactions(txnsList);
                setSgpa(profile.sgpa);
                syncFeeStatus(txnsList);
            } catch (err) {
                console.error("Failed to fetch profile for transactions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    // Helper to format currency
    const formatCurrency = (amount) => {
        return parseFloat(amount).toFixed(2);
    };

    // Handle payment simulation
    const handlePayment = async (index) => {
        const txn = transactions[index];
        if (txn.status === 'Success') return;

        // Check if any previous transactions are pending
        const previousPending = transactions.slice(0, index).some(t => t.status !== 'Success');
        if (previousPending) {
            alert("Please pay your previous dues first before proceeding with this transaction.");
            return;
        }

        // Restriction for last 2 transactions if SGPA < 5
        if (index >= transactions.length - 2 && sgpa && !isNaN(sgpa) && parseFloat(sgpa) < 5) {
            alert("your latest sgpa is below 5");
            return;
        }

        const confirmPay = window.confirm(`Proceed to pay ${formatCurrency(txn.total)}? \n\nClick OK to 'Pay Now' or Cancel to 'Pay Later'.`);
        
        if (confirmPay) {
            const updatedTxns = [...transactions];
            updatedTxns[index] = { 
                ...updatedTxns[index], 
                status: 'Success',
                message: updatedTxns[index].message.replace('Processed', 'Paid Successfully')
            };
            setTransactions(updatedTxns);
            
            // Persist to localStorage
            try {
                const res = await axios.get('http://localhost:5000/student/profile', { withCredentials: true });
                const storageKey = `transaction_history_v5_${res.data.id}`;
                localStorage.setItem(storageKey, JSON.stringify(updatedTxns));
                
                // Sync to backend
                syncFeeStatus(updatedTxns);
            } catch (err) {
                console.error("Error saving payment", err);
            }
        }
    };

    if (loading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    return (
        <div className="animate-fadeIn p-2">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '24px' }}>
                <div className="card-header bg-white border-0 p-4 pb-0">
                    <div className="d-flex justify-content-between align-items-center">
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb mb-0">
                                <li className="breadcrumb-item text-muted small">Fees</li>
                                <li className="breadcrumb-item active small fw-bold" aria-current="page">Registration Fee Transactions</li>
                            </ol>
                        </nav>
                    </div>
                </div>

                <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-4">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                            <i className="bi bi-card-list text-primary fs-4"></i>
                        </div>
                        <h5 className="mb-0 fw-bold">Transaction History</h5>
                    </div>

                    <div className="text-muted small mb-3">
                        Showing 1 to {transactions.length} of {transactions.length} entry
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle custom-table">
                            <thead>
                                <tr className="text-center">
                                    <th>TRANSACTION DATE</th>
                                    <th>SEM</th>
                                    <th>REGN FEE</th>
                                    <th>HOSTEL FEE</th>
                                    <th>FINE</th>
                                    <th>TOTAL AMOUNT</th>
                                    <th>TRANS. AMOUNT</th>
                                    <th>STATUS</th>
                                    <th>MESSAGE</th>
                                    <th>REFERENCENO.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length > 0 ? (
                                    transactions.map((txn, index) => (
                                        <tr key={index} className="text-center">
                                            <td className="small">{txn.date}</td>
                                            <td className="fw-bold">{txn.sem}</td>
                                            <td>{formatCurrency(txn.regn_fee)}</td>
                                            <td>{formatCurrency(txn.hostel_fee)}</td>
                                            <td>{formatCurrency(txn.fine)}</td>
                                            <td className="fw-bold">{formatCurrency(txn.total)}</td>
                                            <td className="fw-bold text-primary">{formatCurrency(txn.trans_amount)}</td>
                                            <td>
                                                <div className="d-flex align-items-center justify-content-center gap-2">
                                                    <span 
                                                        onClick={() => handlePayment(index)}
                                                        className={`badge ${
                                                            txn.status === 'Success' ? 'bg-success' : 
                                                            txn.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'
                                                        }`} 
                                                        style={{ 
                                                            padding: '6px 12px', 
                                                            borderRadius: '8px', 
                                                            fontSize: '0.75rem',
                                                            cursor: txn.status === 'Success' ? 'default' : 'pointer'
                                                        }}
                                                    >
                                                        {txn.status}
                                                    </span>
                                                    <i className="bi bi-printer text-primary" style={{ cursor: 'pointer' }}></i>
                                                </div>
                                            </td>
                                            <td className="small text-muted" style={{ maxWidth: '200px' }}>
                                                {txn.message}
                                            </td>
                                            <td className="small font-monospace">{txn.ref_no}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="text-center py-4 text-muted italic">No transactions found</td>
                                    </tr>
                                )
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
