// ESLINT ERROR FIX - Feed.jsx

// The errors are caused by references to removed position states.
// These need to be manually removed from Feed.jsx

// ERROR 1: Line 356 - setMentionPosition
// ERROR 2: Line 417 - setCommentMentionPosition  
// ERROR 3: Line 846 - mentionPosition prop
// ERROR 4: Line 999 - commentMentionPosition prop

// FIXES APPLIED:

// ✅ Fix 1: Line 846 - Removed position prop from post MentionAutocomplete
// Before:
<MentionAutocomplete
    users={mentionUsers}
    onSelect={handleMentionSelect}
    position={mentionPosition}  // ← REMOVE THIS
/>

// After:
<MentionAutocomplete
    users={mentionUsers}
    onSelect={handleMentionSelect}
/>

// ✅ Fix 2: Line 999 - Removed position prop from comment MentionAutocomplete
// Before:
<MentionAutocomplete
    users={commentMentionUsers[post.id] || []}
    onSelect={(user) => handleCommentMentionSelect(post.id, user)}
    position={commentMentionPosition[post.id] || { top: 0, left: 0 }}  // ← REMOVE THIS
/>

// After:
<MentionAutocomplete
    users={commentMentionUsers[post.id] || []}
    onSelect={(user) => handleCommentMentionSelect(post.id, user)}
/>

// ✅ Fix 3 & 4: Remove position calculation blocks

// In handlePostTextChange (around line 351-360):
// REMOVE these lines:
/*
const textarea = postTextareaRef.current;
if (textarea) {
    const rect = textarea.getBoundingClientRect();
    setMentionPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
    });
}
*/

// In handleCommentTextChange (around line 413-423):
// REMOVE these lines:
/*
const textarea = commentTextareaRefs.current[postId];
if (textarea) {
    const rect = textarea.getBoundingClientRect();
    setCommentMentionPosition(prev => ({
        ...prev,
        [postId]: {
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX
        }
    }));
}
*/

// RESULT: All position calculations removed, CSS handles positioning now!
