import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Auth.css';
import CourseList from './CourseList';
import AdminPanel from './AdminPanel';
import StudentProfile from './StudentProfile';
import outrLogo from '../assets/outr_logo.png';

const Home = () => {
    const [user, setUser] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'profile', 'courses'
    const navigate = useNavigate();

    // Mapping steps to human readable names or just using this to show "Continue Registration"
    const canContinueRegistration = user && user.role === 'student' && user.registration_step < 7;

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await axios.get('http://localhost:5000/logout', { withCredentials: true });
            localStorage.removeItem('user');
            navigate('/login');
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    const handleCourseAdded = () => {
        setRefreshKey(prev => prev + 1);
    };

    if (!user) return null;

    return (
        <div className="portal-wrapper">
            {/* Sidebar Navigation */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <img src={outrLogo} alt="OUTR Logo" className="outr-logo-sidebar" />
                    <div className="sidebar-branding">
                        <div className="sidebar-title">OUTR</div>
                    </div>
                </div>
                
                <div className="nav-menu">
                    <button 
                        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <i className="bi bi-grid-1x2-fill me-3"></i> <span>Dashboard</span>
                    </button>

                    <button 
                        className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <i className="bi bi-person-badge-fill me-3"></i> <span>Student Profile</span>
                    </button>

                    {canContinueRegistration && (
                        <button 
                            className="nav-item registration-alert"
                            onClick={() => navigate('/register')}
                        >
                            <i className="bi bi-pencil-square me-3"></i> <span>Complete Registration</span>
                        </button>
                    )}
                </div>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        <i className="bi bi-power me-3 text-danger"></i> <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content-wrapper">
                <header className="main-top-header">
                    <h2 className="university-title">Odisha University of Technology and Research</h2>
                    <div className="user-profile-header">
                        <div className="user-avatar-circle">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                </header>

                <div className="content-area animate-fadeIn">
                    {activeTab === 'dashboard' ? (
                        <div className="dashboard-view">
                            <div className="welcome-banner-card">
                                <div className="banner-content">
                                    <h3 className="welcome-text">Welcome <span>{user.name}</span> 🎉</h3>
                                    <div className="reg-no-badge">
                                        REG. NO: {user.jee_app_no || 'N/A'}
                                    </div>
                                    <div className="portal-description mt-3">
                                        <strong>OUTR Portal</strong><br/>
                                        This is your Dashboard. Use the menu bar to proceed.
                                    </div>

                                    {canContinueRegistration && (
                                        <div className="incomplete-reg-card mt-3">
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-exclamation-circle-fill text-warning fs-4 me-3"></i>
                                                <div>
                                                    <div className="fw-bold text-dark">Registration Incomplete</div>
                                                    <div className="small text-muted">You have pending steps to complete your profile.</div>
                                                </div>
                                                <button 
                                                    className="btn btn-primary btn-sm ms-auto"
                                                    onClick={() => navigate('/register')}
                                                >
                                                    Finish Now
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="banner-illustration">
                                    <div className="monitor-illustration">
                                        <i className="bi bi-display"></i>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Course List as part of dashboard or separate tab */}
                            <div className="portal-card mt-4">
                                <div className="card-header-flex">
                                    <h5 className="fw-bold mb-0">Course Catalog</h5>
                                </div>
                                <hr className="my-3"/>
                                <CourseList key={refreshKey} user={user} />
                            </div>
                        </div>
                    ) : activeTab === 'profile' ? (
                        <div className="portal-card">
                             <StudentProfile user={user} />
                        </div>
                    ) : (
                        <div className="portal-card">
                            <CourseList key={refreshKey} user={user} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Home;
