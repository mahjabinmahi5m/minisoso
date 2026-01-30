const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authenticateToken = require('../middleware/auth');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Get all conversations for the current user
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get all messages where user is sender or receiver
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:users!messages_sender_id_fkey(id, username, full_name, profile_picture),
                receiver:users!messages_receiver_id_fkey(id, username, full_name, profile_picture)
            `)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching conversations:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
        }

        // Group messages by conversation partner
        const conversationsMap = new Map();

        messages.forEach(msg => {
            const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;

            if (!conversationsMap.has(otherUserId)) {
                // Count unread messages from this user
                const unreadCount = messages.filter(m =>
                    m.sender_id === otherUserId &&
                    m.receiver_id === userId &&
                    !m.is_read
                ).length;

                conversationsMap.set(otherUserId, {
                    id: msg.id,
                    other_user_id: otherUserId,
                    username: otherUser.username,
                    full_name: otherUser.full_name,
                    profile_picture: otherUser.profile_picture,
                    content: msg.content,
                    created_at: msg.created_at,
                    is_sent_by_me: msg.sender_id === userId,
                    unread_count: unreadCount
                });
            }
        });

        const conversations = Array.from(conversationsMap.values());

        res.json({
            success: true,
            conversations
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch conversations'
        });
    }
});

// Get messages between current user and another user
router.get('/chat/:userId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const otherUserId = req.params.userId; // UUID, no parseInt needed

        if (!otherUserId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Get all messages between these two users
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:users!messages_sender_id_fkey(username, profile_picture),
                receiver:users!messages_receiver_id_fkey(username, profile_picture)
            `)
            .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
        }

        // Mark messages as read
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('receiver_id', currentUserId)
            .eq('sender_id', otherUserId)
            .eq('is_read', false);

        // Get other user info
        const { data: otherUser, error: userError } = await supabase
            .from('users')
            .select('id, username, full_name, profile_picture')
            .eq('id', otherUserId)
            .single();

        if (userError) {
            console.error('Error fetching user:', userError);
        }

        // Format messages with sender/receiver info
        const formattedMessages = messages.map(msg => ({
            ...msg,
            sender_username: msg.sender?.username,
            sender_profile_picture: msg.sender?.profile_picture,
            receiver_username: msg.receiver?.username,
            receiver_profile_picture: msg.receiver?.profile_picture
        }));

        res.json({
            success: true,
            messages: formattedMessages,
            otherUser
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages'
        });
    }
});

// Send a message
router.post('/send', authenticateToken, async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { receiverId, content } = req.body;

        if (!receiverId || !content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Receiver ID and message content are required'
            });
        }

        // Check if receiver exists
        const { data: receiver, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('id', receiverId)
            .single();

        if (userError || !receiver) {
            return res.status(404).json({
                success: false,
                message: 'Receiver not found'
            });
        }

        // Insert message
        const { data: newMessage, error } = await supabase
            .from('messages')
            .insert([{
                sender_id: senderId,
                receiver_id: receiverId,
                content: content.trim()
            }])
            .select()
            .single();

        if (error) {
            console.error('Error sending message:', error);
            return res.status(500).json({ success: false, message: 'Failed to send message' });
        }

        // Get sender info
        const { data: sender } = await supabase
            .from('users')
            .select('username, profile_picture')
            .eq('id', senderId)
            .single();

        res.status(201).json({
            success: true,
            message: {
                ...newMessage,
                sender_username: sender?.username,
                sender_profile_picture: sender?.profile_picture
            }
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
});

// Mark messages as read
router.put('/mark-read/:userId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const otherUserId = req.params.userId; // UUID, no parseInt needed

        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('receiver_id', currentUserId)
            .eq('sender_id', otherUserId)
            .eq('is_read', false);

        if (error) {
            console.error('Error marking messages as read:', error);
            return res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
        }

        res.json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark messages as read'
        });
    }
});

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('Error fetching unread count:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
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

// Search users to start a conversation
router.get('/search-users', authenticateToken, async (req, res) => {
    try {
        const { query } = req.query;
        const currentUserId = req.user.userId;

        if (!query || query.trim().length < 2) {
            return res.json({
                success: true,
                users: []
            });
        }

        const searchTerm = `%${query.trim()}%`;

        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, full_name, profile_picture')
            .neq('id', currentUserId)
            .or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
            .limit(20);

        if (error) {
            console.error('Error searching users:', error);
            return res.status(500).json({ success: false, message: 'Failed to search users' });
        }

        res.json({
            success: true,
            users: users || []
        });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search users'
        });
    }
});

module.exports = router;
