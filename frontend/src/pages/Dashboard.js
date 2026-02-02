import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    if (!user) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div className="header-content">
                        <h1>Welcome, {user.name}! 🎉</h1>
                        <p>Your account has been successfully verified</p>
                    </div>
                    <button className="logout-button" onClick={handleLogout}>
                        Logout →
                    </button>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <div className="card-icon">✓</div>
                        <h3 className="card-title">Account Status</h3>
                        <div className="card-value">Verified</div>
                        <p className="card-description">
                            Your account has been verified via OTP
                        </p>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">📱</div>
                        <h3 className="card-title">Phone Verified</h3>
                        <div className="card-value">Active</div>
                        <p className="card-description">
                            WhatsApp verification completed
                        </p>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">🔐</div>
                        <h3 className="card-title">Security</h3>
                        <div className="card-value">High</div>
                        <p className="card-description">
                            Protected with JWT authentication
                        </p>
                    </div>
                </div>

                <div className="user-info-section">
                    <h2 className="section-title">
                        <span>👤</span>
                        Your Information
                    </h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-label">Full Name</div>
                            <div className="info-value">{user.name}</div>
                        </div>

                        <div className="info-item">
                            <div className="info-label">Email Address</div>
                            <div className="info-value">{user.email}</div>
                        </div>

                        <div className="info-item">
                            <div className="info-label">Phone Number</div>
                            <div className="info-value">{user.phone}</div>
                        </div>

                        <div className="info-item">
                            <div className="info-label">Verification Status</div>
                            <div className="info-value">
                                {user.isVerified ? (
                                    <span className="verified-badge">
                                        ✓ Verified
                                    </span>
                                ) : (
                                    'Not Verified'
                                )}
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="info-label">User ID</div>
                            <div className="info-value">{user.id}</div>
                        </div>

                        <div className="info-item">
                            <div className="info-label">Account Created</div>
                            <div className="info-value">
                                {new Date(user.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
