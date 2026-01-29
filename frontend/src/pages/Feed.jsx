import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Feed({ onLogout }) {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Get current user from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);
        fetchPosts();
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

    const handleCreatePost = async (e) => {
        e.preventDefault();

        if (!newPost.trim()) {
            return;
        }

        setPosting(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/posts`,
                { content: newPost },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Add new post to the beginning of the list
            setPosts([response.data.post, ...posts]);
            setNewPost('');
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
                    <h1>🌟 Mini Social</h1>
                    <div className="user-info">
                        <span className="username">@{currentUser?.username}</span>
                        <button onClick={onLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="feed-main">
                <div className="create-post-section">
                    <h2>What's on your mind?</h2>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleCreatePost} className="create-post-form">
                        <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="Share your thoughts..."
                            rows="4"
                            maxLength="500"
                        />
                        <div className="form-footer">
                            <span className="char-count">{newPost.length}/500</span>
                            <button type="submit" className="btn-post" disabled={posting || !newPost.trim()}>
                                {posting ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </form>
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
                                        <div className="post-user">
                                            <div className="user-avatar">
                                                {post.users?.username?.charAt(0).toUpperCase() || 'U'}
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
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                    <div className="post-content">
                                        <p>{post.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Feed;
