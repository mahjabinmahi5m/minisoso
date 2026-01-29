import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BiArrowBack, BiEdit } from 'react-icons/bi';
import { MdImage } from 'react-icons/md';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Profile({ onLogout }) {
    const [user, setUser] = useState(null);
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
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(response.data.user);
            setFormData({
                full_name: response.data.user.full_name || '',
                username: response.data.user.username || '',
                bio: response.data.user.bio || ''
            });
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
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

            setUser(response.data.user);
            setEditing(false);
            setSelectedImage(null);
            setImagePreview(null);

            // Update localStorage
            const storedUser = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({ ...storedUser, ...response.data.user }));
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setUpdating(false);
        }
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
                    <div className="profile-view">
                        <div className="profile-avatar-large">
                            {user?.profile_picture ? (
                                <img src={user.profile_picture} alt={user.username} />
                            ) : (
                                <div className="avatar-placeholder">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        <h1 className="profile-username">@{user?.username}</h1>

                        {user?.full_name && (
                            <p className="profile-fullname">{user.full_name}</p>
                        )}

                        {user?.bio && (
                            <p className="profile-bio">{user.bio}</p>
                        )}

                        <div className="profile-info">
                            <div className="info-item">
                                <span className="info-label">Email</span>
                                <span className="info-value">{user?.email}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Joined</span>
                                <span className="info-value">
                                    {new Date(user?.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <button onClick={() => setEditing(true)} className="btn-edit-profile">
                            <BiEdit /> Edit Profile
                        </button>
                    </div>
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
