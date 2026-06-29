import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Auth.css';
import CourseList from './CourseList';
import AdminPanel from './AdminPanel';
import StudentProfile from './StudentProfile';
import AdminDashboardStats from './AdminDashboardStats';
import NotificationPanel from './NotificationPanel';
import AdminProfile from './AdminProfile';
import SemesterRegistration from './SemesterRegistration';
import StudentDashboardStats from './StudentDashboardStats';


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
                                className={`nav-item ${activeTab === 'admin-departments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('admin-departments')}
                            >
                                <i className="bi bi-building me-3"></i> <span>Manage Departments</span>
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
                                className={`nav-item ${activeTab === 'courses' ? 'active' : ''}`}
                                onClick={() => setActiveTab('courses')}
                            >
                                <i className="bi bi-book-half me-3"></i> <span>Select Courses</span>
                            </button>
                            <button 
                                className={`nav-item ${activeTab === 'enrollment_status' ? 'active' : ''}`}
                                onClick={() => setActiveTab('enrollment_status')}
                            >
                                <i className="bi bi-clipboard-check me-3"></i> <span>My Enrollment Status</span>
                            </button>
                            <button 
                                className={`nav-item ${activeTab === 'semester-registration' ? 'active' : ''}`}
                                onClick={() => setActiveTab('semester-registration')}
                            >
                                <i className="bi bi-pencil-square me-3"></i> <span>Register</span>
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

                                     {user.role === 'student' && !canContinueRegistration && (
                                         <div className="mt-4">
                                             <StudentDashboardStats showTable={true} />
                                         </div>
                                     )}

                            {user.role === 'admin' && (
                                <AdminDashboardStats />
                            )}
                        </div>
                    ) : activeTab === 'enrollment_status' ? (
                        <StudentDashboardStats showTable={true} />
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
                    ) : activeTab === 'admin-departments' ? (
                        <div className="portal-card">
                             <AdminPanel activeTab="departments" />
                        </div>
                    ) : activeTab === 'admin-enrollments' ? (
                        <div className="portal-card">
                             <AdminPanel activeTab="enrollments" />
                        </div>
                    ) : activeTab === 'admin-reports' ? (
                        <div className="portal-card">
                             <AdminPanel activeTab="reports" />
                        </div>
                    ) : activeTab === 'semester-registration' ? (
                        <div className="animate-fadeIn">
                            <SemesterRegistration />
                        </div>
                    ) : (
                        <div className="animate-fadeIn">
                            <CourseList key={refreshKey} user={user} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Home;
