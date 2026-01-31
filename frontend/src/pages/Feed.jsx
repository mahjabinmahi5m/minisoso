import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { FaRegComment } from 'react-icons/fa';
import { IoSendSharp, IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { BiLogOut } from 'react-icons/bi';
import { MdImage, MdClose } from 'react-icons/md';
import { HiMenuAlt2 } from 'react-icons/hi';
import Sidebar from '../components/Sidebar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Feed({ onLogout }) {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [isPostExpanded, setIsPostExpanded] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Comment states
    const [expandedComments, setExpandedComments] = useState({});
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState({});
    const [loadingComments, setLoadingComments] = useState({});
    const [postingComment, setPostingComment] = useState({});

    useEffect(() => {
        // Get current user from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);
        fetchPosts();

        // Listen for profile updates
        const handleProfileUpdate = () => {
            const updatedUser = JSON.parse(localStorage.getItem('user'));
            setCurrentUser(updatedUser);
        };

        window.addEventListener('profileUpdated', handleProfileUpdate);

        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate);
        };
    }, []);

    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/posts`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setPosts(response.data.posts);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching posts:', err);
            setError('Failed to load posts');
            setLoading(false);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Image size should be less than 5MB');
                return;
            }
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();

        if (!newPost.trim()) {
            return;
        }

        setPosting(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            // Create FormData for multipart/form-data
            const formData = new FormData();
            formData.append('content', newPost);
            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            const response = await axios.post(
                `${API_URL}/api/posts`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Add new post to the beginning of the list with initial counts
            setPosts([{
                ...response.data.post,
                like_count: 0,
                comment_count: 0,
                is_liked: false
            }, ...posts]);
            setNewPost('');
            handleRemoveImage();
            setIsPostExpanded(false); // Collapse the post box
        } catch (err) {
            console.error('Error creating post:', err);
            setError('Failed to create post');
        } finally {
            setPosting(false);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/posts/${postId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Remove post from list
            setPosts(posts.filter(post => post.id !== postId));
        } catch (err) {
            console.error('Error deleting post:', err);
            alert('Failed to delete post');
        }
    };

    // Like/Unlike functionality
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
                // Unlike
                await axios.delete(`${API_URL}/api/posts/${postId}/like`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // Like
                await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (err) {
            console.error('Error toggling like:', err);
            // Revert optimistic update on error
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

    // Comment functionality
    const toggleComments = async (postId) => {
        const isExpanded = expandedComments[postId];

        setExpandedComments({
            ...expandedComments,
            [postId]: !isExpanded
        });

        // Fetch comments if expanding and not already loaded
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
        if (!commentText || !commentText.trim()) {
            return;
        }

        setPostingComment({ ...postingComment, [postId]: true });

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/posts/${postId}/comments`,
                { content: commentText },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Add new comment to the list
            setComments({
                ...comments,
                [postId]: [response.data.comment, ...(comments[postId] || [])]
            });

            // Update comment count in post
            setPosts(posts.map(post => {
                if (post.id === postId) {
                    return { ...post, comment_count: response.data.comment_count };
                }
                return post;
            }));

            // Clear input
            setNewComment({ ...newComment, [postId]: '' });
        } catch (err) {
            console.error('Error adding comment:', err);
            alert('Failed to add comment');
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

    return (
        <div className="feed-container">
            <header className="feed-header">
                <div className="header-content">
                    <div className="header-left">
                        <button
                            className="btn-hamburger"
                            onClick={() => setIsSidebarOpen(true)}
                            title="Menu"
                        >
                            <HiMenuAlt2 />
                        </button>
                        <div className="logo-title">
                            <img src="/logo.svg" alt="Minisoso Logo" className="app-logo" />
                            <h1>Minisoso</h1>
                        </div>
                        <button
                            onClick={() => window.location.href = '/profile'}
                            className="btn-profile"
                            title="View Profile"
                        >
                            {currentUser?.profile_picture ? (
                                <img
                                    src={currentUser.profile_picture}
                                    alt={currentUser.username}
                                    className="header-avatar"
                                />
                            ) : (
                                <div className="header-avatar-placeholder">
                                    {currentUser?.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="username">@{currentUser?.username}</span>
                        </button>
                    </div>
                    <div className="header-right">
                        <button
                            onClick={() => navigate('/messages')}
                            className="btn-messages"
                            title="Messages"
                        >
                            <IoChatbubbleEllipsesOutline />
                        </button>
                        <button onClick={onLogout} className="btn-logout">
                            <BiLogOut /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="feed-main">
                <div className="create-post-section">
                    {error && <div className="error-message">{error}</div>}

                    {!isPostExpanded ? (
                        // Collapsed state - compact input
                        <div className="create-post-collapsed" onClick={() => setIsPostExpanded(true)}>
                            <div className="collapsed-user-avatar">
                                {currentUser?.profile_picture ? (
                                    <img
                                        src={currentUser.profile_picture}
                                        alt={currentUser.username}
                                        className="avatar-img"
                                    />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {currentUser?.username?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="collapsed-input-placeholder">
                                What's on your mind, {currentUser?.username}?
                            </div>
                        </div>
                    ) : (
                        // Expanded state - full form
                        <div className="create-post-expanded">
                            <div className="expanded-header">
                                <h2>Create Post</h2>
                                <button
                                    className="btn-collapse"
                                    onClick={() => {
                                        setIsPostExpanded(false);
                                        setNewPost('');
                                        handleRemoveImage();
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            <form onSubmit={handleCreatePost} className="create-post-form">
                                <div className="form-user-info">
                                    <div className="form-user-avatar">
                                        {currentUser?.profile_picture ? (
                                            <img
                                                src={currentUser.profile_picture}
                                                alt={currentUser.username}
                                                className="avatar-img"
                                            />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {currentUser?.username?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <span className="form-username">@{currentUser?.username}</span>
                                </div>

                                <textarea
                                    value={newPost}
                                    onChange={(e) => setNewPost(e.target.value)}
                                    placeholder={`What's on your mind, ${currentUser?.username}?`}
                                    rows="4"
                                    maxLength="500"
                                    autoFocus
                                />

                                {imagePreview && (
                                    <div className="image-preview">
                                        <img src={imagePreview} alt="Preview" />
                                        <button
                                            type="button"
                                            className="btn-remove-image"
                                            onClick={handleRemoveImage}
                                        >
                                            <MdClose />
                                        </button>
                                    </div>
                                )}

                                <div className="form-footer">
                                    <div className="form-footer-left">
                                        <input
                                            type="file"
                                            id="image-upload"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            style={{ display: 'none' }}
                                        />
                                        <label htmlFor="image-upload" className="btn-image-upload">
                                            <MdImage /> Photo
                                        </label>
                                        <span className="char-count">{newPost.length}/500</span>
                                    </div>
                                    <button type="submit" className="btn-post" disabled={posting || !newPost.trim()}>
                                        {posting ? 'Posting...' : 'Post'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                <div className="posts-section">
                    <h2>Feed</h2>
                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            <p>Loading posts...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="no-posts">
                            <p>No posts yet. Be the first to share something! 🎉</p>
                        </div>
                    ) : (
                        <div className="posts-list">
                            {posts.map((post) => (
                                <div key={post.id} className="post-card">
                                    <div className="post-header">
                                        <div
                                            className="post-user clickable"
                                            onClick={() => navigate(`/user/${post.user_id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
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
                                        {currentUser?.id === post.user_id && (
                                            <button
                                                onClick={() => handleDeletePost(post.id)}
                                                className="btn-delete"
                                                title="Delete post"
                                            >
                                                <RiDeleteBin6Line />
                                            </button>
                                        )}
                                    </div>
                                    <div className="post-content">
                                        <p>{post.content}</p>
                                    </div>

                                    {post.image_url && (
                                        <div className="post-image">
                                            <img src={post.image_url} alt="Post" />
                                        </div>
                                    )}

                                    {/* Like and Comment Actions */}
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

                                    {/* Comments Section */}
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
            </main>

            {/* Sidebar Navigation */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                currentUser={currentUser}
                onLogout={onLogout}
            />
        </div>
    );
}

export default Feed;
