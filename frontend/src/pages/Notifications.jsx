import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BiArrowBack, BiHeart, BiComment, BiUserPlus } from 'react-icons/bi';
import { IoCheckmarkDoneOutline } from 'react-icons/io5';
import { MdDelete } from 'react-icons/md';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Notifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/notifications`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setNotifications(response.data.notifications);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Failed to load notifications');
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/api/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Update local state
            setNotifications(notifications.map(notif =>
                notif.id === notificationId ? { ...notif, is_read: true } : notif
            ));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/api/notifications/mark-all-read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Update local state
            setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/notifications/${notificationId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Remove from local state
            setNotifications(notifications.filter(notif => notif.id !== notificationId));
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const handleNotificationClick = (notification) => {
        // Mark as read
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        // Navigate based on notification type
        if (notification.type === 'follow') {
            // For follow notifications, go to the follower's profile
            navigate(`/user/${notification.actor_id}`);
        } else if (notification.type === 'like') {
            // For like notifications, go to Feed and scroll to the post
            if (notification.post_id) {
                navigate('/feed', {
                    state: {
                        scrollToPost: notification.post_id,
                        highlightPost: true
                    }
                });
            }
        } else if (notification.type === 'comment') {
            // For comment notifications, go to Feed, scroll to post and expand comments
            if (notification.post_id) {
                navigate('/feed', {
                    state: {
                        scrollToPost: notification.post_id,
                        expandComments: true,
                        highlightComment: notification.comment_id,
                        highlightPost: true
                    }
                });
            }
        } else if (notification.type === 'mention') {
            // For mention notifications, go to the post/comment
            if (notification.comment_id) {
                // Mentioned in a comment
                navigate('/feed', {
                    state: {
                        scrollToPost: notification.post_id,
                        expandComments: true,
                        highlightComment: notification.comment_id,
                        highlightPost: true
                    }
                });
            } else if (notification.post_id) {
                // Mentioned in a post
                navigate('/feed', {
                    state: {
                        scrollToPost: notification.post_id,
                        highlightPost: true
                    }
                });
            }
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'like':
                return <BiHeart className="notif-icon like" />;
            case 'comment':
                return <BiComment className="notif-icon comment" />;
            case 'follow':
                return <BiUserPlus className="notif-icon follow" />;
            default:
                return null;
        }
    };

    const getNotificationText = (notification) => {
        const username = notification.actor?.username || 'Someone';
        switch (notification.type) {
            case 'like':
                return (
                    <>
                        <strong>@{username}</strong> {notification.content}
                    </>
                );
            case 'comment':
                return (
                    <>
                        <strong>@{username}</strong> {notification.content}
                    </>
                );
            case 'follow':
                return (
                    <>
                        <strong>@{username}</strong> {notification.content}
                    </>
                );
            default:
                return notification.content;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading notifications...</p>
            </div>
        );
    }

    return (
        <div className="notifications-container">
            <header className="notifications-header">
                <button onClick={() => navigate('/feed')} className="btn-back">
                    <BiArrowBack /> Back
                </button>
                <h1>Notifications</h1>
                {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="btn-mark-all-read">
                        <IoCheckmarkDoneOutline /> Mark all read
                    </button>
                )}
            </header>

            <div className="notifications-content">
                {error && <div className="error-message">{error}</div>}

                {notifications.length === 0 ? (
                    <div className="no-notifications">
                        <p>No notifications yet</p>
                        <span>When someone likes, comments, or follows you, you'll see it here</span>
                    </div>
                ) : (
                    <div className="notifications-list">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="notification-avatar">
                                    {notification.actor?.profile_picture ? (
                                        <img
                                            src={notification.actor.profile_picture}
                                            alt={notification.actor.username}
                                        />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {notification.actor?.username?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </div>

                                <div className="notification-content">
                                    <div className="notification-text">
                                        {getNotificationIcon(notification.type)}
                                        <span>{getNotificationText(notification)}</span>
                                    </div>
                                    <div className="notification-time">
                                        {formatTime(notification.created_at)}
                                    </div>
                                </div>

                                {notification.post?.image_url && (
                                    <div className="notification-post-preview">
                                        <img src={notification.post.image_url} alt="Post" />
                                    </div>
                                )}

                                <button
                                    className="btn-delete-notification"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                    }}
                                >
                                    <MdDelete />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Notifications;
