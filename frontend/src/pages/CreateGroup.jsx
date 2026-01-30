import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BiX, BiSearch } from 'react-icons/bi';
import { BsCheckCircleFill } from 'react-icons/bs';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function CreateGroup({ onClose, onGroupCreated }) {
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [searching, setSearching] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (searchQuery.trim().length >= 2) {
            searchUsers();
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

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

    const toggleMember = (user) => {
        if (selectedMembers.find(m => m.id === user.id)) {
            setSelectedMembers(selectedMembers.filter(m => m.id !== user.id));
        } else {
            setSelectedMembers([...selectedMembers, user]);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();

        if (!groupName.trim()) {
            setError('Group name is required');
            return;
        }

        if (selectedMembers.length === 0) {
            setError('Please add at least one member');
            return;
        }

        setCreating(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/groups/create`,
                {
                    name: groupName.trim(),
                    description: description.trim() || null,
                    memberIds: selectedMembers.map(m => m.id)
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                onGroupCreated();
            }
        } catch (error) {
            console.error('Error creating group:', error);
            setError(error.response?.data?.message || 'Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content create-group-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create New Group</h2>
                    <button onClick={onClose} className="btn-close">
                        <BiX />
                    </button>
                </div>

                <form onSubmit={handleCreateGroup} className="create-group-form">
                    <div className="form-group">
                        <label htmlFor="groupName">Group Name *</label>
                        <input
                            id="groupName"
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name"
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description (Optional)</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this group about?"
                            rows={3}
                            maxLength={500}
                        />
                    </div>

                    <div className="form-group">
                        <label>Add Members *</label>
                        <div className="search-box">
                            <BiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {selectedMembers.length > 0 && (
                            <div className="selected-members">
                                {selectedMembers.map((member) => (
                                    <div key={member.id} className="selected-member-chip">
                                        <span>@{member.username}</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleMember(member)}
                                            className="btn-remove-member"
                                        >
                                            <BiX />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searching && <div className="searching">Searching...</div>}

                        {searchResults.length > 0 && (
                            <div className="search-results">
                                {searchResults.map((user) => {
                                    const isSelected = selectedMembers.find(m => m.id === user.id);
                                    return (
                                        <div
                                            key={user.id}
                                            className={`user-result ${isSelected ? 'selected' : ''}`}
                                            onClick={() => toggleMember(user)}
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
                                            {isSelected && (
                                                <BsCheckCircleFill className="check-icon" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-create"
                            disabled={creating || !groupName.trim() || selectedMembers.length === 0}
                        >
                            {creating ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateGroup;
