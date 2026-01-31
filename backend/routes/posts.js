const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Helper function to extract @mentions from text
function extractMentions(text) {
    if (!text) return [];
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
        if (!mentions.includes(match[1])) {
            mentions.push(match[1]);
        }
    }
    return mentions;
}

// Helper function to create mention notifications
async function createMentionNotifications(mentionedUsernames, actorId, postId, commentId = null) {
    if (!mentionedUsernames || mentionedUsernames.length === 0) return;

    try {
        // Get user IDs for mentioned usernames
        const { data: mentionedUsers, error: userError } = await supabase
            .from('users')
            .select('id, username')
            .in('username', mentionedUsernames);

        if (userError || !mentionedUsers) {
            console.error('Error fetching mentioned users:', userError);
            return;
        }

        // Create notifications for each mentioned user
        const notifications = mentionedUsers
            .filter(user => user.id !== actorId) // Don't notify if mentioning self
            .map(user => ({
                recipient_id: user.id,
                actor_id: actorId,
                type: 'mention',
                post_id: postId,
                comment_id: commentId,
                content: commentId ? 'mentioned you in a comment' : 'mentioned you in a post'
            }));

        if (notifications.length > 0) {
            await supabase
                .from('notifications')
                .insert(notifications);
        }
    } catch (error) {
        console.error('Error creating mention notifications:', error);
    }
}


// Get All Posts
router.get('/', authMiddleware, async (req, res) => {
    try {
        const currentUserId = req.user.userId;

        // Fetch posts with user info
        const { data: posts, error } = await supabase
            .from('posts')
            .select(`
                *,
                users (
                    id,
                    username,
                    email,
                    profile_picture
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Error fetching posts' });
        }

        // For each post, get like count, comment count, and user's like status
        const postsWithCounts = await Promise.all(posts.map(async (post) => {
            // Get like count
            const { count: likeCount } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            // Get comment count
            const { count: commentCount } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            // Check if current user has liked this post
            const { data: userLike } = await supabase
                .from('likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', currentUserId)
                .single();

            return {
                ...post,
                like_count: likeCount || 0,
                comment_count: commentCount || 0,
                is_liked: !!userLike
            };
        }));

        res.json({ posts: postsWithCounts });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Posts by User ID
router.get('/user/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        // Fetch user info
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, username, email, full_name, bio, profile_picture, created_at')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch posts by this user
        const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select(`
                *,
                users (
                    id,
                    username,
                    email,
                    profile_picture
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (postsError) {
            console.error('Supabase error:', postsError);
            return res.status(500).json({ error: 'Error fetching user posts' });
        }

        // For each post, get like count, comment count, and user's like status
        const postsWithCounts = await Promise.all((posts || []).map(async (post) => {
            // Get like count
            const { count: likeCount } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            // Get comment count
            const { count: commentCount } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            // Check if current user has liked this post
            const { data: userLike } = await supabase
                .from('likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', currentUserId)
                .single();

            return {
                ...post,
                like_count: likeCount || 0,
                comment_count: commentCount || 0,
                is_liked: !!userLike
            };
        }));

        // Get post count
        const postCount = postsWithCounts.length;

        res.json({
            user,
            posts: postsWithCounts,
            post_count: postCount
        });
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create Post (with optional image)
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        const imageFile = req.file;

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Post content cannot be empty' });
        }

        let imageUrl = null;

        // Upload image to Supabase Storage if provided
        if (imageFile) {
            // Optimize image with sharp
            const optimizedBuffer = await sharp(imageFile.buffer)
                .resize(1200, 1200, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80 })
                .toBuffer();

            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            const filePath = `${req.user.userId}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('minisoso')
                .upload(filePath, optimizedBuffer, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                });

            if (uploadError) {
                console.error('Image upload error:', uploadError);
                return res.status(500).json({ error: 'Error uploading image' });
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('minisoso')
                .getPublicUrl(filePath);

            imageUrl = publicUrl;
        }

        const { data: newPost, error } = await supabase
            .from('posts')
            .insert([
                {
                    user_id: req.user.userId,
                    content: content.trim(),
                    image_url: imageUrl
                }
            ])
            .select(`
        *,
        users (
          id,
          username,
          email,
          profile_picture
        )
      `)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Error creating post' });
        }

        // Extract mentions from post content and create notifications
        const mentions = extractMentions(content);
        if (mentions.length > 0) {
            await createMentionNotifications(mentions, req.user.userId, newPost.id);
        }

        res.status(201).json({
            message: 'Post created successfully',
            post: newPost
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete Post
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if post exists and belongs to user
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.user_id !== req.user.userId) {
            return res.status(403).json({ error: 'You can only delete your own posts' });
        }

        // Delete post
        const { error: deleteError } = await supabase
            .from('posts')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Supabase error:', deleteError);
            return res.status(500).json({ error: 'Error deleting post' });
        }

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// =====================================================
// LIKE ENDPOINTS
// =====================================================

// Like a post
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const { id: postId } = req.params;
        const userId = req.user.userId;

        // Check if post exists and get post owner
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('id, user_id')
            .eq('id', postId)
            .single();

        if (postError || !post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if user already liked this post
        const { data: existingLike } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .single();

        if (existingLike) {
            return res.status(400).json({ error: 'You already liked this post' });
        }

        // Create like
        const { error: likeError } = await supabase
            .from('likes')
            .insert([{ post_id: postId, user_id: userId }]);

        if (likeError) {
            console.error('Supabase error:', likeError);
            return res.status(500).json({ error: 'Error liking post' });
        }

        // Create notification for post owner (if not liking own post)
        if (post.user_id !== userId) {
            await supabase
                .from('notifications')
                .insert([{
                    recipient_id: post.user_id,
                    actor_id: userId,
                    type: 'like',
                    post_id: postId,
                    content: 'liked your post'
                }])
                .select()
                .single();
        }

        // Get updated like count
        const { count: likeCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        res.json({
            message: 'Post liked successfully',
            like_count: likeCount || 0
        });
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Unlike a post
router.delete('/:id/like', authMiddleware, async (req, res) => {
    try {
        const { id: postId } = req.params;
        const userId = req.user.userId;

        // Delete like
        const { error: deleteError } = await supabase
            .from('likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId);

        if (deleteError) {
            console.error('Supabase error:', deleteError);
            return res.status(500).json({ error: 'Error unliking post' });
        }

        // Get updated like count
        const { count: likeCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        res.json({
            message: 'Post unliked successfully',
            like_count: likeCount || 0
        });
    } catch (error) {
        console.error('Unlike post error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// =====================================================
// COMMENT ENDPOINTS
// =====================================================

// Get comments for a post
router.get('/:id/comments', authMiddleware, async (req, res) => {
    try {
        const { id: postId } = req.params;

        // Fetch comments with user info
        const { data: comments, error } = await supabase
            .from('comments')
            .select(`
                *,
                users (
                    id,
                    username,
                    email,
                    profile_picture
                )
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Error fetching comments' });
        }

        res.json({ comments: comments || [] });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add a comment to a post
router.post('/:id/comments', authMiddleware, async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        // Validate content
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Comment content cannot be empty' });
        }

        if (content.length > 500) {
            return res.status(400).json({ error: 'Comment is too long (max 500 characters)' });
        }

        // Check if post exists and get post owner
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('id, user_id')
            .eq('id', postId)
            .single();

        if (postError || !post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Create comment
        const { data: newComment, error: commentError } = await supabase
            .from('comments')
            .insert([{
                post_id: postId,
                user_id: userId,
                content: content.trim()
            }])
            .select(`
                *,
                users (
                    id,
                    username,
                    email,
                    profile_picture
                )
            `)
            .single();

        if (commentError) {
            console.error('Supabase error:', commentError);
            return res.status(500).json({ error: 'Error creating comment' });
        }

        // Create notification for post owner (if not commenting on own post)
        if (post.user_id !== userId) {
            await supabase
                .from('notifications')
                .insert([{
                    recipient_id: post.user_id,
                    actor_id: userId,
                    type: 'comment',
                    post_id: postId,
                    comment_id: newComment.id,
                    content: 'commented on your post'
                }])
                .select()
                .single();
        }

        // Extract mentions from comment content and create notifications
        const mentions = extractMentions(content);
        if (mentions.length > 0) {
            await createMentionNotifications(mentions, userId, postId, newComment.id);
        }


        // Get updated comment count
        const { count: commentCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        res.status(201).json({
            message: 'Comment added successfully',
            comment: newComment,
            comment_count: commentCount || 0
        });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
