import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IoMdAdd, IoMdClose } from 'react-icons/io';
import { MdImage } from 'react-icons/md';
import '../styles/Stories.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Stories({ currentUser }) {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedStoryGroup, setSelectedStoryGroup] = useState(null);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/stories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStories(response.data.stories);
        } catch (error) {
            console.error('Error fetching stories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('Image size should be less than 10MB');
                return;
            }
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleCreateStory = async () => {
        if (!selectedImage) return;

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('image', selectedImage);

            await axios.post(`${API_URL}/api/stories`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setShowCreateModal(false);
            setSelectedImage(null);
            setImagePreview(null);
            fetchStories();
        } catch (error) {
            console.error('Error creating story:', error);
            alert('Failed to create story');
        } finally {
            setUploading(false);
        }
    };

    const handleViewStory = async (storyGroup, index = 0) => {
        setSelectedStoryGroup(storyGroup);
        setCurrentStoryIndex(index);
        setShowViewModal(true);

        // Mark as viewed
        const story = storyGroup.stories[index];
        if (!story.viewed) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(
                    `${API_URL}/api/stories/${story.id}/view`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                // Update local state
                fetchStories();
            } catch (error) {
                console.error('Error marking story as viewed:', error);
            }
        }
    };

    const handleNextStory = () => {
        if (currentStoryIndex < selectedStoryGroup.stories.length - 1) {
            const nextIndex = currentStoryIndex + 1;
            setCurrentStoryIndex(nextIndex);
            handleViewStory(selectedStoryGroup, nextIndex);
        } else {
            // Move to next user's stories
            const currentUserIndex = stories.findIndex(
                s => s.user.id === selectedStoryGroup.user.id
            );
            if (currentUserIndex < stories.length - 1) {
                handleViewStory(stories[currentUserIndex + 1], 0);
            } else {
                setShowViewModal(false);
            }
        }
    };

    const handlePrevStory = () => {
        if (currentStoryIndex > 0) {
            const prevIndex = currentStoryIndex - 1;
            setCurrentStoryIndex(prevIndex);
            handleViewStory(selectedStoryGroup, prevIndex);
        }
    };

    const handleDeleteStory = async (storyId) => {
        if (!window.confirm('Delete this story?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/stories/${storyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowViewModal(false);
            fetchStories();
        } catch (error) {
            console.error('Error deleting story:', error);
            alert('Failed to delete story');
        }
    };

    if (loading) {
        return <div className="stories-loading">Loading stories...</div>;
    }

    return (
        <>
            <div className="stories-container">
                <div className="stories-scroll">
                    {/* Add Story Button */}
                    <div className="story-item add-story" onClick={() => setShowCreateModal(true)}>
                        <div className="story-avatar">
                            <div className="add-story-circle">
                                <IoMdAdd />
                            </div>
                        </div>
                        <span className="story-username">Your Story</span>
                    </div>

                    {/* Stories List */}
                    {stories.map((storyGroup) => (
                        <div
                            key={storyGroup.user.id}
                            className="story-item"
                            onClick={() => handleViewStory(storyGroup)}
                        >
                            <div className={`story-avatar ${!storyGroup.hasViewed ? 'unviewed' : 'viewed'}`}>
                                {storyGroup.user.profile_picture ? (
                                    <img src={storyGroup.user.profile_picture} alt={storyGroup.user.username} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {storyGroup.user.username?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <span className="story-username">{storyGroup.user.username}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Story Modal */}
            {showCreateModal && (
                <div className="story-modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="story-modal create-story-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create Story</h2>
                            <button onClick={() => setShowCreateModal(false)} className="btn-close-modal">
                                <IoMdClose />
                            </button>
                        </div>
                        <div className="modal-content">
                            {!imagePreview ? (
                                <div className="upload-area">
                                    <input
                                        type="file"
                                        id="story-upload"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="story-upload" className="upload-label">
                                        <MdImage />
                                        <span>Choose Photo</span>
                                    </label>
                                </div>
                            ) : (
                                <div className="story-preview">
                                    <img src={imagePreview} alt="Preview" />
                                    <div className="preview-actions">
                                        <button onClick={() => { setSelectedImage(null); setImagePreview(null); }} className="btn-change">
                                            Change Photo
                                        </button>
                                        <button onClick={handleCreateStory} disabled={uploading} className="btn-share">
                                            {uploading ? 'Sharing...' : 'Share Story'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* View Story Modal */}
            {showViewModal && selectedStoryGroup && (
                <div className="story-modal-overlay" onClick={() => setShowViewModal(false)}>
                    <div className="story-modal view-story-modal" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowViewModal(false)} className="btn-close-story">
                            <IoMdClose />
                        </button>

                        {/* Story Header */}
                        <div className="story-header">
                            <div className="story-progress">
                                {selectedStoryGroup.stories.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`progress-bar ${index <= currentStoryIndex ? 'active' : ''}`}
                                    />
                                ))}
                            </div>
                            <div className="story-user-info">
                                <div className="story-user-avatar">
                                    {selectedStoryGroup.user.profile_picture ? (
                                        <img src={selectedStoryGroup.user.profile_picture} alt={selectedStoryGroup.user.username} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {selectedStoryGroup.user.username?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <span className="story-user-name">{selectedStoryGroup.user.username}</span>
                                {selectedStoryGroup.user.id === currentUser?.id && (
                                    <button
                                        onClick={() => handleDeleteStory(selectedStoryGroup.stories[currentStoryIndex].id)}
                                        className="btn-delete-story"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Story Image */}
                        <div className="story-image-container">
                            <img
                                src={`${API_URL}${selectedStoryGroup.stories[currentStoryIndex].image_url}`}
                                alt="Story"
                                className="story-image"
                            />
                        </div>

                        {/* Navigation */}
                        <div className="story-navigation">
                            {currentStoryIndex > 0 && (
                                <button onClick={handlePrevStory} className="btn-nav btn-prev">‹</button>
                            )}
                            {(currentStoryIndex < selectedStoryGroup.stories.length - 1 ||
                                stories.findIndex(s => s.user.id === selectedStoryGroup.user.id) < stories.length - 1) && (
                                    <button onClick={handleNextStory} className="btn-nav btn-next">›</button>
                                )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Stories;
