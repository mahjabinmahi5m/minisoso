import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BiArrowBack, BiEdit } from 'react-icons/bi';
import { MdImage } from 'react-icons/md';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { FaRegComment } from 'react-icons/fa';
import { IoSendSharp } from 'react-icons/io5';
import { RiDeleteBin6Line } from 'react-icons/ri';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Profile({ onLogout }) {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        bio: ''
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const navigate = useNavigate();

    // Comment states
    const [expandedComments, setExpandedComments] = useState({});
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState({});
    const [loadingComments, setLoadingComments] = useState({});
    const [postingComment, setPostingComment] = useState({});

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const currentUser = JSON.parse(localStorage.getItem('user'));

            // Fetch user profile and posts
            const response = await axios.get(`${API_URL}/api/posts/user/${currentUser.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUser(response.data.user);
            setPosts(response.data.posts);
            setFormData({
                full_name: response.data.user.full_name || '',
                username: response.data.user.username || '',
                bio: response.data.user.bio || ''
            });

            // Fetch follower counts
            await fetchFollowerCounts(currentUser.id);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchFollowerCounts = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/followers/counts/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFollowersCount(response.data.followers_count || 0);
            setFollowingCount(response.data.following_count || 0);
        } catch (err) {
            console.error('Error fetching follower counts:', err);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size should be less than 5MB');
                return;
            }
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('full_name', formData.full_name);
            data.append('username', formData.username);
            data.append('bio', formData.bio);
            if (selectedImage) {
                data.append('profile_picture', selectedImage);
            }

            const response = await axios.put(`${API_URL}/api/auth/profile`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Clear image states
            setSelectedImage(null);
            setImagePreview(null);

            // Update user state with new data
            setUser(response.data.user);
            setEditing(false);

            // Update localStorage
            const storedUser = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({ ...storedUser, ...response.data.user }));

            // Dispatch event to notify other components
            window.dispatchEvent(new Event('profileUpdated'));

            // Refresh profile
            await fetchUserProfile();
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Remove post from list
            setPosts(posts.filter(post => post.id !== postId));
        } catch (err) {
            console.error('Error deleting post:', err);
            alert('Failed to delete post');
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

    return (
        <div className="profile-container">
            <header className="profile-header">
                <button onClick={() => navigate('/feed')} className="btn-back">
                    <BiArrowBack /> Back to Feed
                </button>
                <button onClick={onLogout} className="btn-logout-profile">
                    Logout
                </button>
            </header>

            <div className="profile-content">
                {!editing ? (
                    // View Mode
                    <>
                        <div className="profile-view">
                            <div className="profile-header-section">
                                {/* Left: Profile Picture */}
                                <div className="profile-avatar-large">
                                    {user?.profile_picture ? (
                                        <img src={user.profile_picture} alt={user.username} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {user?.username?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Middle: User Info */}
                                <div className="profile-info-section">
                                    <div className="profile-top-row">
                                        <h1 className="profile-username">@{user?.username}</h1>
                                        <button onClick={() => setEditing(true)} className="btn-edit-profile-small">
                                            <BiEdit /> Edit Profile
                                        </button>
                                    </div>

                                    {user?.full_name && (
                                        <p className="profile-fullname">{user.full_name}</p>
                                    )}

                                    {user?.bio && (
                                        <p className="profile-bio">{user.bio}</p>
                                    )}

                                    {/* Follower/Following Stats */}
                                    <div className="profile-stats">
                                        <div className="stat-item">
                                            <span className="stat-count">{posts.length}</span>
                                            <span className="stat-label">{posts.length === 1 ? 'Post' : 'Posts'}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-count">{followersCount}</span>
                                            <span className="stat-label">{followersCount === 1 ? 'Follower' : 'Followers'}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-count">{followingCount}</span>
                                            <span className="stat-label">Following</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Posts Section */}
                        <div className="user-posts-section">
                            <div className="posts-header">
                                <h2>My Posts</h2>
                                <span className="post-count-badge">{posts.length} {posts.length === 1 ? 'Post' : 'Posts'}</span>
                            </div>
                            {posts.length === 0 ? (
                                <div className="no-posts">
                                    <p>No posts yet. Share something on the feed!</p>
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
                                                <button
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="btn-delete"
                                                    title="Delete post"
                                                >
                                                    <RiDeleteBin6Line />
                                                </button>
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
                    </>
                ) : (
                    // Edit Mode
                    <div className="profile-edit">
                        <h2>Edit Profile</h2>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSubmit} className="profile-form">
                            <div className="profile-picture-upload">
                                <div className="current-avatar">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" />
                                    ) : user?.profile_picture ? (
                                        <img src={user.profile_picture} alt={user.username} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {user?.username?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    id="profile-picture"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="profile-picture" className="btn-upload-avatar">
                                    <MdImage /> Change Photo
                                </label>
                            </div>

                            <div className="form-group">
                                <label htmlFor="full_name">Full Name</label>
                                <input
                                    type="text"
                                    id="full_name"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    placeholder="Your full name"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Username"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="bio">Bio</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Tell us about yourself..."
                                    rows="4"
                                    maxLength="150"
                                />
                                <span className="char-count">{formData.bio.length}/150</span>
                            </div>

                            {/* Account Info - Read Only */}
                            <div className="account-info-section">
                                <h3>Account Information</h3>
                                <div className="info-row">
                                    <span className="info-label">Email</span>
                                    <span className="info-value">{user?.email}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Joined</span>
                                    <span className="info-value">
                                        {new Date(user?.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditing(false);
                                        setSelectedImage(null);
                                        setImagePreview(null);
                                        setError('');
                                    }}
                                    className="btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save" disabled={updating}>
                                    {updating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Profile;
