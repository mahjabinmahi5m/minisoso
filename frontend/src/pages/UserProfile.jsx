import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BiArrowBack } from 'react-icons/bi';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { FaRegComment } from 'react-icons/fa';
import { IoSendSharp } from 'react-icons/io5';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function UserProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    // Comment states
    const [expandedComments, setExpandedComments] = useState({});
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState({});
    const [loadingComments, setLoadingComments] = useState({});
    const [postingComment, setPostingComment] = useState({});

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);
        fetchUserProfile();
    }, [userId]);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/posts/user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserData(response.data.user);
            setPosts(response.data.posts);
        } catch (err) {
            console.error('Error fetching user profile:', err);
            setError('Failed to load user profile');
        } finally {
            setLoading(false);
        }
    };

    const handleLikeToggle = async (postId, isLiked) => {
        try {
            const token = localStorage.getItem('token');

            // Optimistic update
            setPosts(posts.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        is_liked: !isLiked,
                        like_count: isLiked ? post.like_count - 1 : post.like_count + 1
                    };
                }
                return post;
            }));

            if (isLiked) {
                await axios.delete(`${API_URL}/api/posts/${postId}/like`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (err) {
            console.error('Error toggling like:', err);
            // Revert optimistic update
            setPosts(posts.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        is_liked: isLiked,
                        like_count: isLiked ? post.like_count + 1 : post.like_count - 1
                    };
                }
                return post;
            }));
        }
    };

    const toggleComments = async (postId) => {
        const isExpanded = expandedComments[postId];
        setExpandedComments({
            ...expandedComments,
            [postId]: !isExpanded
        });

        if (!isExpanded && !comments[postId]) {
            await fetchComments(postId);
        }
    };

    const fetchComments = async (postId) => {
        setLoadingComments({ ...loadingComments, [postId]: true });
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/posts/${postId}/comments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments({ ...comments, [postId]: response.data.comments });
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setLoadingComments({ ...loadingComments, [postId]: false });
        }
    };

    const handleAddComment = async (e, postId) => {
        e.preventDefault();
        const commentText = newComment[postId];
        if (!commentText || !commentText.trim()) return;

        setPostingComment({ ...postingComment, [postId]: true });

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/posts/${postId}/comments`,
                { content: commentText },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setComments({
                ...comments,
                [postId]: [response.data.comment, ...(comments[postId] || [])]
            });

            setPosts(posts.map(post => {
                if (post.id === postId) {
                    return { ...post, comment_count: response.data.comment_count };
                }
                return post;
            }));

            setNewComment({ ...newComment, [postId]: '' });
        } catch (err) {
            console.error('Error adding comment:', err);
        } finally {
            setPostingComment({ ...postingComment, [postId]: false });
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-screen">
                <p>{error}</p>
                <button onClick={() => navigate('/feed')} className="btn-primary">
                    Back to Feed
                </button>
            </div>
        );
    }

    return (
        <div className="user-profile-container">
            <header className="user-profile-header">
                <button onClick={() => navigate('/feed')} className="btn-back">
                    <BiArrowBack /> Back
                </button>
            </header>

            <div className="user-profile-content">
                {/* Profile Info Section */}
                <div className="user-profile-info">
                    <div className="profile-avatar-large">
                        {userData?.profile_picture ? (
                            <img src={userData.profile_picture} alt={userData.username} />
                        ) : (
                            <div className="avatar-placeholder">
                                {userData?.username?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <h1 className="profile-username">@{userData?.username}</h1>

                    {userData?.full_name && (
                        <p className="profile-fullname">{userData.full_name}</p>
                    )}

                    {userData?.bio && (
                        <p className="profile-bio">{userData.bio}</p>
                    )}

                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-value">{posts.length}</span>
                            <span className="stat-label">Posts</span>
                        </div>
                    </div>
                </div>

                {/* Posts Section */}
                <div className="user-posts-section">
                    <h2>Posts</h2>
                    {posts.length === 0 ? (
                        <div className="no-posts">
                            <p>No posts yet</p>
                        </div>
                    ) : (
                        <div className="posts-list">
                            {posts.map((post) => (
                                <div key={post.id} className="post-card">
                                    <div className="post-header">
                                        <div className="post-user">
                                            <div className="user-avatar">
                                                {post.users?.profile_picture ? (
                                                    <img
                                                        src={post.users.profile_picture}
                                                        alt={post.users.username}
                                                        className="avatar-img"
                                                    />
                                                ) : (
                                                    <span className="avatar-letter">
                                                        {post.users?.username?.charAt(0).toUpperCase() || 'U'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="user-details">
                                                <span className="post-username">@{post.users?.username}</span>
                                                <span className="post-time">{formatDate(post.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="post-content">
                                        <p>{post.content}</p>
                                    </div>

                                    {post.image_url && (
                                        <div className="post-image">
                                            <img src={post.image_url} alt="Post" />
                                        </div>
                                    )}

                                    <div className="post-actions">
                                        <button
                                            className={`action-btn like-btn ${post.is_liked ? 'liked' : ''}`}
                                            onClick={() => handleLikeToggle(post.id, post.is_liked)}
                                        >
                                            {post.is_liked ? <AiFillHeart className="icon" /> : <AiOutlineHeart className="icon" />}
                                            <span className="count">{post.like_count || 0}</span>
                                        </button>

                                        <button
                                            className="action-btn comment-btn"
                                            onClick={() => toggleComments(post.id)}
                                        >
                                            <FaRegComment className="icon" />
                                            <span className="count">{post.comment_count || 0}</span>
                                        </button>
                                    </div>

                                    {expandedComments[post.id] && (
                                        <div className="comments-section">
                                            <form
                                                onSubmit={(e) => handleAddComment(e, post.id)}
                                                className="comment-form"
                                            >
                                                <input
                                                    type="text"
                                                    placeholder="Write a comment..."
                                                    value={newComment[post.id] || ''}
                                                    onChange={(e) => setNewComment({
                                                        ...newComment,
                                                        [post.id]: e.target.value
                                                    })}
                                                    maxLength="500"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={postingComment[post.id] || !newComment[post.id]?.trim()}
                                                    className="btn-comment-submit"
                                                >
                                                    {postingComment[post.id] ? '...' : <IoSendSharp />}
                                                </button>
                                            </form>

                                            <div className="comments-list">
                                                {loadingComments[post.id] ? (
                                                    <div className="loading-comments">Loading comments...</div>
                                                ) : comments[post.id]?.length > 0 ? (
                                                    comments[post.id].map((comment) => (
                                                        <div key={comment.id} className="comment-item">
                                                            <div className="comment-avatar">
                                                                {comment.users?.profile_picture ? (
                                                                    <img
                                                                        src={comment.users.profile_picture}
                                                                        alt={comment.users.username}
                                                                        className="avatar-img"
                                                                    />
                                                                ) : (
                                                                    <span className="avatar-letter">
                                                                        {comment.users?.username?.charAt(0).toUpperCase() || 'U'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="comment-content">
                                                                <div className="comment-header">
                                                                    <span className="comment-username">
                                                                        @{comment.users?.username}
                                                                    </span>
                                                                    <span className="comment-time">
                                                                        {formatDate(comment.created_at)}
                                                                    </span>
                                                                </div>
                                                                <p className="comment-text">{comment.content}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="no-comments">No comments yet. Be the first!</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserProfile;
