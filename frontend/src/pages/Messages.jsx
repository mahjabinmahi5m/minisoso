import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BiArrowBack, BiSearch } from 'react-icons/bi';
import { BsPlusCircle, BsMoonStarsFill, BsSunFill } from 'react-icons/bs';
import { HiUserGroup } from 'react-icons/hi';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { useTheme } from '../context/ThemeContext';
import CreateGroup from './CreateGroup';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Messages() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    // Tab state
    const [activeTab, setActiveTab] = useState('messages'); // 'messages' or 'groups'

    // Messages states
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // Groups states
    const [groups, setGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    useEffect(() => {
        // Reset search when switching tabs
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);

        if (activeTab === 'messages') {
            fetchConversations();
        } else {
            fetchGroups();
        }
    }, [activeTab]);

    useEffect(() => {
        if (searchQuery.trim().length >= 2) {
            searchUsers();
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Fetching conversations...');
            const response = await axios.get(`${API_URL}/api/messages/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Conversations response:', response.data);
            setConversations(response.data.conversations);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/groups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroups(response.data.groups);
            setGroupsLoading(false);
        } catch (error) {
            console.error('Error fetching groups:', error);
            setGroupsLoading(false);
        }
    };

    const searchUsers = async () => {
        setSearching(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/api/messages/search-users?query=${encodeURIComponent(searchQuery)}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setSearchResults(response.data.users);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearching(false);
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

    const startChat = (userId) => {
        navigate(`/chat/${userId}`);
    };

    const openGroup = (groupId) => {
        navigate(`/group/${groupId}`);
    };

    const handleGroupCreated = () => {
        setShowCreateGroup(false);
        fetchGroups();
    };

    const handleNewClick = () => {
        if (activeTab === 'messages') {
            setShowSearch(!showSearch);
        } else {
            setShowCreateGroup(true);
        }
    };

    return (
        <div className="messages-container">
            <header className="messages-header">
                <div className="header-content">
                    <div className="header-left">
                        <button onClick={() => navigate('/feed')} className="btn-back">
                            <BiArrowBack />
                        </button>
                        <h1>Messages</h1>
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
                            onClick={handleNewClick}
                            className="btn-new-message"
                            title={activeTab === 'messages' ? 'New message' : 'Create new group'}
                        >
                            <BsPlusCircle />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="messages-tabs">
                    <button
                        className={`tab-button ${activeTab === 'messages' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('messages');
                            setShowSearch(false);
                        }}
                    >
                        <IoChatbubbleEllipsesOutline />
                        <span>Messages</span>
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('groups');
                            setShowSearch(false);
                        }}
                    >
                        <HiUserGroup />
                        <span>Groups</span>
                    </button>
                </div>
            </header>

            <main className="messages-main">
                {/* Messages Tab Content */}
                {activeTab === 'messages' && (
                    <>
                        {/* Search Section */}
                        {showSearch && (
                            <div className="search-section">
                                <div className="search-box">
                                    <BiSearch className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                {searching && <div className="searching">Searching...</div>}
                                {searchResults.length > 0 && (
                                    <div className="search-results">
                                        {searchResults.map((user) => (
                                            <div
                                                key={user.id}
                                                className="user-result"
                                                onClick={() => {
                                                    startChat(user.id);
                                                    setShowSearch(false);
                                                    setSearchQuery('');
                                                }}
                                            >
                                                <div className="user-avatar">
                                                    {user.profile_picture ? (
                                                        <img src={user.profile_picture} alt={user.username} />
                                                    ) : (
                                                        <div className="avatar-placeholder">
                                                            {user.username?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="user-info">
                                                    <div className="username">@{user.username}</div>
                                                    {user.full_name && (
                                                        <div className="full-name">{user.full_name}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Conversations List */}
                        {loading ? (
                            <div className="loading">
                                <div className="spinner"></div>
                                <p>Loading conversations...</p>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="no-conversations">
                                <IoChatbubbleEllipsesOutline size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <p>No messages yet</p>
                                <p className="hint">Click the + button to start a conversation</p>
                            </div>
                        ) : (
                            <div className="conversations-list">
                                {conversations.map((conv) => (
                                    <div
                                        key={conv.id}
                                        className="conversation-item"
                                        onClick={() => startChat(conv.other_user_id)}
                                    >
                                        <div className="conversation-avatar">
                                            {conv.profile_picture ? (
                                                <img src={conv.profile_picture} alt={conv.username} />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {conv.username?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="conversation-content">
                                            <div className="conversation-header">
                                                <span className="conversation-username">@{conv.username}</span>
                                                <span className="conversation-time">
                                                    {formatTime(conv.created_at)}
                                                </span>
                                            </div>
                                            <div className="conversation-preview">
                                                <span className={conv.unread_count > 0 && !conv.is_sent_by_me ? 'unread' : ''}>
                                                    {conv.is_sent_by_me && 'You: '}
                                                    {conv.content.length > 50
                                                        ? conv.content.substring(0, 50) + '...'
                                                        : conv.content}
                                                </span>
                                                {conv.unread_count > 0 && !conv.is_sent_by_me && (
                                                    <span className="unread-badge">{conv.unread_count}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Groups Tab Content */}
                {activeTab === 'groups' && (
                    <>
                        {groupsLoading ? (
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
                    </>
                )}
            </main>

            {/* Create Group Modal */}
            {showCreateGroup && (
                <CreateGroup
                    onClose={() => setShowCreateGroup(false)}
                    onGroupCreated={handleGroupCreated}
                />
            )}
        </div>
    );
}

export default Messages;
