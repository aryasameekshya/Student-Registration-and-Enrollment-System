import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Auth.css';
import CourseList from './CourseList';
import AboutCourses from './AboutCourses';
import Transactions from './Transactions';
import AdminPanel from './AdminPanel';
import StudentProfile from './StudentProfile';
import AdminDashboardStats from './AdminDashboardStats';
import NotificationPanel from './NotificationPanel';
import AdminProfile from './AdminProfile';
import SemesterRegistration from './SemesterRegistration';
import MiscTransactions from './MiscTransactions';
import Attendance from './Attendance';


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
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            // Sync user data on mount to ensure full name is updated
            if (parsedUser.role === 'student') {
                axios.get('http://localhost:5000/register/status', { withCredentials: true })
                    .then(res => {
                        if (res.data && res.data.user_data) {
                            const updatedUser = { 
                                ...parsedUser, 
                                name: res.data.user_data.name || parsedUser.name,
                                registration_step: res.data.user_data.registration_step || parsedUser.registration_step
                            };
                            setUser(updatedUser);
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                        }
                    })
                    .catch(err => console.error("Could not sync profile data", err));
            }
        }
    }, [navigate, activeTab]); // Added activeTab to effect dependencies to ensure UI syncs when switching back

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

    const handleAvatarClick = () => {
        if (user.role === 'admin') {
            setActiveTab('admin-profile');
        } else {
            setActiveTab('profile');
        }
    };

    if (!user) return null;

    return (
        <div className="portal-wrapper">
            {/* Sidebar Navigation */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-branding">
                        <img 
                            src="/logo_4.png" 
                            alt="OUTR Logo" 
                            className="outr-logo-sidebar" 
                        />
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

                    {user.role !== 'admin' && (
                        <button
                            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <i className="bi bi-person-badge-fill me-3"></i> <span>Student Profile</span>
                        </button>
                    )}

                    {user.role === 'admin' ? (
                        <>
                            <button
                                className={`nav-item ${activeTab === 'admin-students' ? 'active' : ''}`}
                                onClick={() => setActiveTab('admin-students')}
                            >
                                <i className="bi bi-people-fill me-3"></i> <span>Manage Students</span>
                            </button>
                            <button
                                className={`nav-item ${activeTab === 'admin-courses' ? 'active' : ''}`}
                                onClick={() => setActiveTab('admin-courses')}
                            >
                                <i className="bi bi-journal-bookmark-fill me-3"></i> <span>Manage Courses</span>
                            </button>
                            <button
                                className={`nav-item ${activeTab === 'admin-enrollments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('admin-enrollments')}
                            >
                                <i className="bi bi-file-earmark-check-fill me-3"></i> <span>Enrollment Requests</span>
                            </button>
                            <button
                                className={`nav-item ${activeTab === 'admin-reports' ? 'active' : ''}`}
                                onClick={() => setActiveTab('admin-reports')}
                            >
                                <i className="bi bi-bar-chart-line-fill me-3"></i> <span>System Reports</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
                                onClick={() => setActiveTab('transactions')}
                            >
                                <i className="bi bi-credit-card-fill me-3"></i> <span>Transactions</span>
                            </button>
                            <button 
                                className={`nav-item ${activeTab === 'misc-txns' ? 'active' : ''}`}
                                onClick={() => setActiveTab('misc-txns')}
                            >
                                <i className="bi bi-receipt-cutoff me-3"></i> <span>Misc Transactions</span>
                            </button>
                             <button 
                                className={`nav-item ${activeTab === 'sem-reg' ? 'active' : ''}`}
                                onClick={() => setActiveTab('sem-reg')}
                            >
                                <i className="bi bi-calendar-check-fill me-3"></i> <span>Semester Registration</span>
                            </button>
                            <button 
                                className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
                                onClick={() => setActiveTab('attendance')}
                            >
                                <i className="bi bi-clock-history me-3"></i> <span>Attendance</span>
                            </button>
                        </>
                    )}

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
                    <div className="user-profile-header gap-3">
                        <NotificationPanel />
                        <div 
                            className={`user-avatar-circle ${activeTab === (user.role === 'admin' ? 'admin-profile' : 'profile') ? 'active-avatar' : ''}`} 
                            onClick={handleAvatarClick}
                            title="My Profile"
                        >
                            {user.name.charAt(0)}
                        </div>
                    </div>
                </header>

                <div className="content-area animate-fadeIn">
                    {activeTab === 'dashboard' ? (
                        <div className="dashboard-view">
                            {user.role === 'student' && (
                                <div className="welcome-banner-card mb-4 animate-fadeIn">
                                    <div className="welcome-content">
                                        <div className="reg-no-badge mb-3">REGN NO: {user.jee_app_no || 'N/A'}</div>
                                        <h1 className="welcome-text">
                                            Welcome back, <span>{user.name}</span>!
                                        </h1>
                                        <p className="text-muted lead mb-0">
                                            Your academic portal is ready. Access your courses, 
                                            track your attendance, and manage your fees effortlessly.
                                        </p>
                                    </div>
                                    <div className="banner-illustration">
                                        <img 
                                            src="/logo_4.png" 
                                            alt="OUTR Logo" 
                                            className="outr-dashboard-logo"
                                            style={{ width: '180px', height: '180px', objectFit: 'contain' }}
                                        />
                                    </div>
                                </div>
                            )}

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

                             {/* Notification Alert for Students */}
                             {user.role === 'student' && !canContinueRegistration && (
                                 <div className="alert alert-info mt-3 border-0 shadow-sm" style={{borderRadius: '12px', background: 'rgba(59, 130, 246, 0.05)'}}>
                                     <div className="d-flex align-items-center">
                                         <i className="bi bi-info-circle-fill text-primary fs-5 me-3"></i>
                                         <div className="small">
                                             Check your <span className="fw-bold">notifications</span> for updates on your enrollment requests.
                                         </div>
                                     </div>
                                 </div>
                             )}

                            {user.role === 'student' && (
                                <div className="text-start mt-5 animate-fadeIn" style={{ paddingLeft: '2.5rem' }}>
                                    <h2 className="text-primary fw-bold mb-0" style={{ fontSize: '2.2rem', opacity: '0.9', letterSpacing: '2px' }}>
                                        कर्मणैव हि संसिद्धिः
                                    </h2>
                                    <div className="text-muted small mt-2">Odisha University of Technology and Research</div>
                                </div>
                            )}

                            {user.role === 'admin' && (
                                <AdminDashboardStats />
                            )}
                        </div>
                    ) : activeTab === 'profile' ? (
                        <div className="animate-fadeIn">
                             <StudentProfile user={user} />
                        </div>
                    ) : activeTab === 'admin-profile' ? (
                        <div className="animate-fadeIn">
                             <AdminProfile />
                        </div>
                    ) : activeTab === 'admin-students' ? (
                        <div className="portal-card">
                             <AdminPanel activeTab="students" />
                        </div>
                    ) : activeTab === 'admin-courses' ? (
                        <div className="portal-card">
                             <AdminPanel activeTab="courses" onCourseAdded={handleCourseAdded} />
                        </div>
                    ) : activeTab === 'admin-enrollments' ? (
                        <div className="portal-card">
                             <AdminPanel activeTab="enrollments" />
                        </div>
                    ) : activeTab === 'admin-reports' ? (
                        <div className="portal-card">
                             <AdminPanel activeTab="reports" />
                        </div>
                    ) : activeTab === 'transactions' ? (
                        <div className="animate-fadeIn">
                            <Transactions user={user} />
                        </div>
                    ) : activeTab === 'sem-reg' ? (
                        <div className="animate-fadeIn">
                            <SemesterRegistration user={user} />
                        </div>
                    ) : activeTab === 'misc-txns' ? (
                        <div className="animate-fadeIn">
                            <MiscTransactions />
                        </div>
                    ) : activeTab === 'attendance' ? (
                        <div className="animate-fadeIn">
                            <Attendance user={user} />
                        </div>
                    ) : (
                        <div className="animate-fadeIn">
                            <Transactions user={user} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Home;
