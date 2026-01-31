// Simplified mention handling - just remove position calculations

// In handlePostTextChange, replace lines 303-312 with:
if (users.length > 0) {
    setShowMentionAutocomplete(true);
} else {
    setShowMentionAutocomplete(false);
}

// In handleCommentTextChange, replace the position calculation block with:
if (users.length > 0) {
    setShowCommentMention(prev => ({ ...prev, [postId]: true }));
} else {
    setShowCommentMention(prev => ({ ...prev, [postId]: false }));
}

// In Feed.jsx, update MentionAutocomplete calls:

// For post mention (around line 685):
{showMentionAutocomplete && (
    <MentionAutocomplete
        users={mentionUsers}
        onSelect={handleMentionSelect}
    />
)}

// For comment mention (around line 895):
{showCommentMention[post.id] && (
    <MentionAutocomplete
        users={commentMentionUsers[post.id] || []}
        onSelect={(user) => handleCommentMentionSelect(post.id, user)}
    />
)}
