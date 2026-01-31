import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BiUser, BiEdit, BiLogOut, BiGroup } from 'react-icons/bi';
import { IoSettingsOutline, IoInformationCircleOutline } from 'react-icons/io5';
import { MdClose } from 'react-icons/md';
import '../styles/Sidebar.css';

function Sidebar({ isOpen, onClose, currentUser, onLogout }) {
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        navigate(path);
        onClose();
    };

    const handleLogout = () => {
        onLogout();
        onClose();
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

            {/* Sidebar */}
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-user-info">
                        <div className="sidebar-avatar">
                            {currentUser?.profile_picture ? (
                                <img
                                    src={currentUser.profile_picture}
                                    alt={currentUser.username}
                                />
                            ) : (
                                <div className="avatar-placeholder">
                                    {currentUser?.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="sidebar-user-details">
                            <div className="sidebar-username">@{currentUser?.username}</div>
                            {currentUser?.full_name && (
                                <div className="sidebar-fullname">{currentUser.full_name}</div>
                            )}
                        </div>
                    </div>
                    <button className="btn-close-sidebar" onClick={onClose}>
                        <MdClose />
                    </button>
                </div>

                <div className="sidebar-menu">
                    <button
                        className="menu-item"
                        onClick={() => handleNavigation('/profile')}
                    >
                        <BiUser className="menu-icon" />
                        <span>My Profile</span>
                    </button>

                    <button
                        className="menu-item"
                        onClick={() => handleNavigation('/profile?edit=true')}
                    >
                        <BiEdit className="menu-icon" />
                        <span>Edit Profile</span>
                    </button>

                    <button
                        className="menu-item"
                        onClick={() => handleNavigation('/groups')}
                    >
                        <BiGroup className="menu-icon" />
                        <span>Groups</span>
                    </button>

                    <div className="menu-divider"></div>

                    <button
                        className="menu-item"
                        onClick={() => handleNavigation('/account-info')}
                    >
                        <IoInformationCircleOutline className="menu-icon" />
                        <span>Account Information</span>
                    </button>

                    <button
                        className="menu-item"
                        onClick={() => handleNavigation('/settings')}
                    >
                        <IoSettingsOutline className="menu-icon" />
                        <span>Settings</span>
                    </button>

                    <div className="menu-divider"></div>

                    <button
                        className="menu-item logout"
                        onClick={handleLogout}
                    >
                        <BiLogOut className="menu-icon" />
                        <span>Logout</span>
                    </button>
                </div>

                <div className="sidebar-footer">
                    <div className="app-version">Minisoso v1.0</div>
                </div>
            </div>
        </>
    );
}

export default Sidebar;
