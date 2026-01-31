import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BiArrowBack } from 'react-icons/bi';
import { BsMoonStarsFill, BsSunFill } from 'react-icons/bs';
import { useTheme } from '../context/ThemeContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AccountInfo() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const currentUser = JSON.parse(localStorage.getItem('user'));

            const response = await axios.get(`${API_URL}/api/posts/user/${currentUser.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUser(response.data.user);
        } catch (err) {
            console.error('Error fetching user info:', err);
            setError('Failed to load account information');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading account information...</p>
            </div>
        );
    }

    return (
        <div className="account-info-container">
            <header className="account-info-header">
                <div className="header-content">
                    <button onClick={() => navigate('/feed')} className="btn-back">
                        <BiArrowBack /> Back to Feed
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="btn-theme-toggle"
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? <BsMoonStarsFill /> : <BsSunFill />}
                    </button>
                </div>
            </header>

            <div className="account-info-content">
                <div className="account-info-card">
                    <h1>Account Information</h1>
                    <p className="account-info-subtitle">
                        View your account details and activity information
                    </p>

                    {error && <div className="error-message">{error}</div>}

                    <div className="info-sections">
                        {/* Personal Information */}
                        <div className="info-section">
                            <h2 className="section-title">Personal Information</h2>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Username</span>
                                    <span className="info-value">@{user?.username}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Full Name</span>
                                    <span className="info-value">
                                        {user?.full_name || 'Not set'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Email</span>
                                    <span className="info-value">{user?.email}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Bio</span>
                                    <span className="info-value">
                                        {user?.bio || 'No bio added'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Account Details */}
                        <div className="info-section">
                            <h2 className="section-title">Account Details</h2>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Account ID</span>
                                    <span className="info-value info-value-mono">
                                        {user?.id?.substring(0, 8)}...
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Joined</span>
                                    <span className="info-value">
                                        {formatDate(user?.created_at)}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Last Updated</span>
                                    <span className="info-value">
                                        {formatDateTime(user?.updated_at)}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Account Status</span>
                                    <span className="info-value">
                                        <span className="status-badge active">Active</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AccountInfo;
