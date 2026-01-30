import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { BiArrowBack } from 'react-icons/bi';
import { IoSendSharp, IoCheckmark, IoCheckmarkDone } from 'react-icons/io5';
import { BsMoonStarsFill, BsSunFill } from 'react-icons/bs';
import { useTheme } from '../context/ThemeContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Chat() {
    const navigate = useNavigate();
    const { userId } = useParams();
    const { theme, toggleTheme } = useTheme();
    const [messages, setMessages] = useState([]);
    const [otherUser, setOtherUser] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const messagesEndRef = useRef(null);
    const pollingInterval = useRef(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);
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
    }, [userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async (silent = false) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/messages/chat/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data.messages);
            setOtherUser(response.data.otherUser);
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
                `${API_URL}/api/messages/send`,
                {
                    receiverId: userId, // UUID, no parseInt needed
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

        // Parse the UTC timestamp from Supabase
        const date = new Date(utcString);
        const now = new Date();

        // Calculate difference in seconds
        const diffInSeconds = Math.floor((now - date) / 1000);

        // Less than 1 minute
        if (diffInSeconds < 60) return 'Just now';

        // Less than 1 hour
        if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m ago`;
        }

        // Less than 24 hours
        if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h ago`;
        }

        // More than 24 hours - show time
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
                    <p>Loading chat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <header className="chat-header">
                <div className="header-content">
                    <button onClick={() => navigate('/messages')} className="btn-back">
                        <BiArrowBack />
                    </button>
                    <div
                        className="chat-user-info"
                        onClick={() => navigate(`/user/${userId}`)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="chat-avatar">
                            {otherUser?.profile_picture ? (
                                <img src={otherUser.profile_picture} alt={otherUser.username} />
                            ) : (
                                <div className="avatar-placeholder">
                                    {otherUser?.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="chat-user-details">
                            <div className="chat-username">@{otherUser?.username}</div>
                            {otherUser?.full_name && (
                                <div className="chat-fullname">{otherUser.full_name}</div>
                            )}
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
                                            <p className="message-content">{message.content}</p>
                                            <div className="message-footer">
                                                <span className="message-time">
                                                    {formatTime(message.created_at)}
                                                </span>
                                                {isSentByMe && (
                                                    <span className={`message-status ${message.is_read ? 'read' : 'delivered'}`}>
                                                        {message.is_read ? (
                                                            <IoCheckmarkDone />
                                                        ) : (
                                                            <IoCheckmark />
                                                        )}
                                                    </span>
                                                )}
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

export default Chat;
