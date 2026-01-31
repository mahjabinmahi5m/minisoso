import React from 'react';
import '../styles/MentionAutocomplete.css';

function MentionAutocomplete({ users, onSelect }) {
    if (!users || users.length === 0) {
        return null;
    }

    return (
        <div className="mention-autocomplete">
            <div className="mention-list">
                {users.map((user, index) => (
                    <div
                        key={user.id || index}
                        className="mention-item"
                        onClick={() => onSelect(user)}
                    >
                        <div className="mention-avatar">
                            {user.profile_picture ? (
                                <img src={user.profile_picture} alt={user.username} />
                            ) : (
                                <div className="avatar-placeholder">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="mention-info">
                            <div className="mention-username">@{user.username}</div>
                            {user.full_name && (
                                <div className="mention-fullname">{user.full_name}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MentionAutocomplete;
