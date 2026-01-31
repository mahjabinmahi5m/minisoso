const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authenticateToken = require('../middleware/auth');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Helper function to create a notification
async function createNotification(recipientId, actorId, type, postId = null, commentId = null, content = '') {
    try {
        // Don't create notification if user is notifying themselves
        if (recipientId === actorId) {
            return null;
        }

        // Check if similar notification already exists (to avoid duplicates)
        const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('recipient_id', recipientId)
            .eq('actor_id', actorId)
            .eq('type', type)
            .eq('post_id', postId)
            .eq('comment_id', commentId)
            .single();

        if (existing) {
            // Update the timestamp of existing notification
            await supabase
                .from('notifications')
                .update({
                    created_at: new Date().toISOString(),
                    is_read: false
                })
                .eq('id', existing.id);
            return existing;
        }

        // Create new notification
        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                recipient_id: recipientId,
                actor_id: actorId,
                type,
                post_id: postId,
                comment_id: commentId,
                content
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating notification:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in createNotification:', error);
        return null;
    }
}

// Get all notifications for the current user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const { data: notifications, error } = await supabase
            .from('notifications')
            .select(`
                *,
                actor:users!notifications_actor_id_fkey(id, username, full_name, profile_picture),
                post:posts(id, content, image_url),
                comment:comments(id, content)
            `)
            .eq('recipient_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching notifications:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch notifications'
            });
        }

        res.json({
            success: true,
            notifications: notifications || []
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
});

// Get unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('Error fetching unread count:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch unread count'
            });
        }

        res.json({
            success: true,
            count: count || 0
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count'
        });
    }
});

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { notificationId } = req.params;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('recipient_id', userId);

        if (error) {
            console.error('Error marking notification as read:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read'
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('recipient_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('Error marking all notifications as read:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to mark all notifications as read'
            });
        }

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read'
        });
    }
});

// Delete a notification
router.delete('/:notificationId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { notificationId } = req.params;

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('recipient_id', userId);

        if (error) {
            console.error('Error deleting notification:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete notification'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
});

// Create notification when someone likes a post
router.post('/like', authenticateToken, async (req, res) => {
    try {
        const actorId = req.user.userId;
        const { postId, postOwnerId } = req.body;

        const notification = await createNotification(
            postOwnerId,
            actorId,
            'like',
            postId,
            null,
            'liked your post'
        );

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Error creating like notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification'
        });
    }
});

// Create notification when someone comments on a post
router.post('/comment', authenticateToken, async (req, res) => {
    try {
        const actorId = req.user.userId;
        const { postId, postOwnerId, commentId } = req.body;

        const notification = await createNotification(
            postOwnerId,
            actorId,
            'comment',
            postId,
            commentId,
            'commented on your post'
        );

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Error creating comment notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification'
        });
    }
});

// Create notification when someone follows you
router.post('/follow', authenticateToken, async (req, res) => {
    try {
        const actorId = req.user.userId;
        const { followedUserId } = req.body;

        const notification = await createNotification(
            followedUserId,
            actorId,
            'follow',
            null,
            null,
            'started following you'
        );

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Error creating follow notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification'
        });
    }
});

module.exports = router;
