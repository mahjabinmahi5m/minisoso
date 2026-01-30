import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BiArrowBack, BiSearch } from 'react-icons/bi';
import { BsPlusCircle, BsMoonStarsFill, BsSunFill } from 'react-icons/bs';
import { HiUserGroup } from 'react-icons/hi';
import { useTheme } from '../context/ThemeContext';
import CreateGroup from './CreateGroup';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Groups() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/groups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroups(response.data.groups);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching groups:', error);
            setLoading(false);
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';

        // Ensure UTC parsing - add 'Z' if missing
        let utcString = dateString;
        if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
            utcString = dateString + 'Z';
        }

        const date = new Date(utcString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
        return date.toLocaleDateString();
    };

    const openGroup = (groupId) => {
        navigate(`/group/${groupId}`);
    };

    const handleGroupCreated = () => {
        setShowCreateGroup(false);
        fetchGroups();
    };

    return (
        <div className="messages-container">
            <header className="messages-header">
                <div className="header-content">
                    <div className="header-left">
                        <button onClick={() => navigate('/feed')} className="btn-back">
                            <BiArrowBack />
                        </button>
                        <h1>Groups</h1>
                    </div>
                    <div className="header-actions">
                        <button
                            onClick={toggleTheme}
                            className="btn-theme-toggle"
                            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        >
                            {theme === 'light' ? <BsMoonStarsFill /> : <BsSunFill />}
                        </button>
                        <button
                            onClick={() => setShowCreateGroup(true)}
                            className="btn-new-message"
                            title="Create new group"
                        >
                            <BsPlusCircle />
                        </button>
                    </div>
                </div>
            </header>

            <main className="messages-main">
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Loading groups...</p>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="no-conversations">
                        <HiUserGroup size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>No groups yet</p>
                        <p className="hint">Click the + button to create a group</p>
                    </div>
                ) : (
                    <div className="conversations-list">
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                className="conversation-item"
                                onClick={() => openGroup(group.id)}
                            >
                                <div className="conversation-avatar">
                                    {group.group_picture ? (
                                        <img src={group.group_picture} alt={group.name} />
                                    ) : (
                                        <div className="avatar-placeholder group-avatar">
                                            <HiUserGroup />
                                        </div>
                                    )}
                                </div>
                                <div className="conversation-content">
                                    <div className="conversation-header">
                                        <span className="conversation-username">{group.name}</span>
                                        <span className="conversation-time">
                                            {formatTime(group.updated_at || group.created_at)}
                                        </span>
                                    </div>
                                    <div className="conversation-preview">
                                        <span className="group-members">
                                            {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                                        </span>
                                        {group.last_message && (
                                            <span className="last-message">
                                                {' • '}
                                                {group.last_message.users?.username}: {group.last_message.content.substring(0, 30)}
                                                {group.last_message.content.length > 30 ? '...' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {showCreateGroup && (
                <CreateGroup
                    onClose={() => setShowCreateGroup(false)}
                    onGroupCreated={handleGroupCreated}
                />
            )}
        </div>
    );
}

export default Groups;
