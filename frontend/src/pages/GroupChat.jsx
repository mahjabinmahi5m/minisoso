import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { BiArrowBack, BiInfoCircle } from 'react-icons/bi';
import { IoSendSharp } from 'react-icons/io5';
import { BsMoonStarsFill, BsSunFill } from 'react-icons/bs';
import { HiUserGroup } from 'react-icons/hi';
import { useTheme } from '../context/ThemeContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function GroupChat() {
    const navigate = useNavigate();
    const { groupId } = useParams();
    const { theme, toggleTheme } = useTheme();
    const [messages, setMessages] = useState([]);
    const [group, setGroup] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const messagesEndRef = useRef(null);
    const pollingInterval = useRef(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);
        fetchGroupDetails();
        fetchMessages();

        // Poll for new messages every 3 seconds
        pollingInterval.current = setInterval(() => {
            fetchMessages(true); // silent fetch
        }, 3000);

        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
            }
        };
    }, [groupId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchGroupDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/groups/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroup(response.data.group);
        } catch (error) {
            console.error('Error fetching group details:', error);
            if (error.response?.status === 403) {
                alert('You are not a member of this group');
                navigate('/groups');
            }
        }
    };

    const fetchMessages = async (silent = false) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/groups/${groupId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data.messages);
            if (!silent) {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) {
            return;
        }

        setSending(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/groups/${groupId}/messages`,
                {
                    content: newMessage.trim()
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Add the new message to the list
            setMessages([...messages, response.data.message]);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
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
        if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m ago`;
        }
        if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h ago`;
        }

        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes < 10 ? '0' + minutes : minutes;

        return `${displayHours}:${displayMinutes} ${ampm}`;
    };

    if (loading) {
        return (
            <div className="chat-container">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading group chat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <header className="chat-header">
                <div className="header-content">
                    <button onClick={() => navigate('/groups')} className="btn-back">
                        <BiArrowBack />
                    </button>
                    <div
                        className="chat-user-info"
                        onClick={() => setShowGroupInfo(!showGroupInfo)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="chat-avatar">
                            {group?.group_picture ? (
                                <img src={group.group_picture} alt={group.name} />
                            ) : (
                                <div className="avatar-placeholder group-avatar">
                                    <HiUserGroup />
                                </div>
                            )}
                        </div>
                        <div className="chat-user-details">
                            <div className="chat-username">{group?.name}</div>
                            <div className="chat-fullname">
                                {group?.members?.length} {group?.members?.length === 1 ? 'member' : 'members'}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="btn-theme-toggle"
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? <BsMoonStarsFill /> : <BsSunFill />}
                    </button>
                </div>
            </header>

            {showGroupInfo && (
                <div className="group-info-panel">
                    <div className="group-info-content">
                        <h3>Group Information</h3>
                        {group?.description && (
                            <p className="group-description">{group.description}</p>
                        )}
                        <div className="group-members-list">
                            <h4>Members ({group?.members?.length})</h4>
                            {group?.members?.map((member) => (
                                <div key={member.id} className="member-item">
                                    <div className="member-avatar">
                                        {member.profile_picture ? (
                                            <img src={member.profile_picture} alt={member.username} />
                                        ) : (
                                            <div className="avatar-placeholder-small">
                                                {member.username?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="member-info">
                                        <div className="member-username">@{member.username}</div>
                                        {member.full_name && (
                                            <div className="member-fullname">{member.full_name}</div>
                                        )}
                                    </div>
                                    {member.role === 'admin' && (
                                        <span className="admin-badge">Admin</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <main className="chat-main">
                <div className="chat-messages-area">
                    {messages.length === 0 ? (
                        <div className="no-messages">
                            <p>No messages yet</p>
                            <p className="hint">Send a message to start the conversation</p>
                        </div>
                    ) : (
                        <div className="messages-list">
                            {messages.map((message) => {
                                const isSentByMe = message.sender_id === currentUser?.id;
                                return (
                                    <div
                                        key={message.id}
                                        className={`message-item ${isSentByMe ? 'sent' : 'received'}`}
                                    >
                                        {!isSentByMe && (
                                            <div className="message-avatar">
                                                {message.sender_profile_picture ? (
                                                    <img
                                                        src={message.sender_profile_picture}
                                                        alt={message.sender_username}
                                                    />
                                                ) : (
                                                    <div className="avatar-placeholder-small">
                                                        {message.sender_username?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="message-bubble">
                                            {!isSentByMe && (
                                                <div className="message-sender">
                                                    {message.sender_full_name || message.sender_username}
                                                </div>
                                            )}
                                            <p className="message-content">{message.content}</p>
                                            <div className="message-footer">
                                                <span className="message-time">
                                                    {formatTime(message.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </main>

            <footer className="chat-footer">
                <form onSubmit={handleSendMessage} className="message-form">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        maxLength="1000"
                        disabled={sending}
                    />
                    <button type="submit" disabled={sending || !newMessage.trim()}>
                        {sending ? '...' : <IoSendSharp />}
                    </button>
                </form>
            </footer>
        </div>
    );
}

export default GroupChat;
