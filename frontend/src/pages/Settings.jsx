import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BiArrowBack } from 'react-icons/bi';
import { BsMoonStarsFill, BsSunFill } from 'react-icons/bs';
import { useTheme } from '../context/ThemeContext';

function Settings() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="settings-container">
            <header className="settings-header">
                <div className="header-content">
                    <button onClick={() => navigate('/feed')} className="btn-back">
                        <BiArrowBack /> Back to Feed
                    </button>
                </div>
            </header>

            <div className="settings-content">
                <div className="settings-card">
                    <h1>Settings</h1>
                    <p className="settings-subtitle">
                        Manage your app preferences and settings
                    </p>

                    <div className="settings-sections">
                        {/* Appearance Section */}
                        <div className="settings-section">
                            <h2 className="section-title">Appearance</h2>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <div className="setting-label">Theme</div>
                                    <div className="setting-description">
                                        Choose your preferred color theme
                                    </div>
                                </div>
                                <div className="setting-control">
                                    <button
                                        onClick={toggleTheme}
                                        className="btn-theme-switch"
                                    >
                                        <div className={`theme-option ${theme === 'light' ? 'active' : ''}`}>
                                            <BsSunFill />
                                            <span>Light</span>
                                        </div>
                                        <div className={`theme-option ${theme === 'dark' ? 'active' : ''}`}>
                                            <BsMoonStarsFill />
                                            <span>Dark</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Privacy Section */}
                        <div className="settings-section">
                            <h2 className="section-title">Privacy & Security</h2>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <div className="setting-label">Account Privacy</div>
                                    <div className="setting-description">
                                        Your account is currently public
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notifications Section */}
                        <div className="settings-section">
                            <h2 className="section-title">Notifications</h2>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <div className="setting-label">Push Notifications</div>
                                    <div className="setting-description">
                                        Get notified about new messages and activity
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* About Section */}
                        <div className="settings-section">
                            <h2 className="section-title">About</h2>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <div className="setting-label">Version</div>
                                    <div className="setting-description">
                                        Minisoso v1.0
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;
