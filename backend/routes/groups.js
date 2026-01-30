const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authenticateToken = require('../middleware/auth');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Get user's groups
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get groups where user is a member
        const { data: memberGroups, error: memberError } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', userId);

        if (memberError) throw memberError;

        const groupIds = memberGroups.map(m => m.group_id);

        if (groupIds.length === 0) {
            return res.json({ success: true, groups: [] });
        }

        // Get group details with member count
        const { data: groups, error: groupsError } = await supabase
            .from('groups')
            .select(`
                *,
                group_members(count)
            `)
            .in('id', groupIds)
            .order('updated_at', { ascending: false });

        if (groupsError) throw groupsError;

        // Get last message for each group
        const groupsWithLastMessage = await Promise.all(
            groups.map(async (group) => {
                const { data: lastMessage } = await supabase
                    .from('messages')
                    .select('content, created_at, sender_id, users!messages_sender_id_fkey(username)')
                    .eq('group_id', group.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                return {
                    ...group,
                    member_count: group.group_members[0]?.count || 0,
                    last_message: lastMessage
                };
            })
        );

        res.json({
            success: true,
            groups: groupsWithLastMessage
        });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch groups'
        });
    }
});

// Create new group
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, description, memberIds } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Group name is required'
            });
        }

        // Create group
        const { data: newGroup, error: groupError } = await supabase
            .from('groups')
            .insert([{
                name: name.trim(),
                description: description?.trim() || null,
                created_by: userId
            }])
            .select()
            .single();

        if (groupError) throw groupError;

        // Add creator as admin
        const membersToAdd = [
            { group_id: newGroup.id, user_id: userId, role: 'admin' }
        ];

        // Add other members
        if (memberIds && Array.isArray(memberIds)) {
            memberIds.forEach(memberId => {
                if (memberId !== userId) {
                    membersToAdd.push({
                        group_id: newGroup.id,
                        user_id: memberId,
                        role: 'member'
                    });
                }
            });
        }

        const { error: membersError } = await supabase
            .from('group_members')
            .insert(membersToAdd);

        if (membersError) throw membersError;

        res.status(201).json({
            success: true,
            group: newGroup
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create group'
        });
    }
});

// Get group details
router.get('/:groupId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { groupId } = req.params;

        // Check if user is member
        const { data: membership } = await supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Get group details
        const { data: group, error } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single();

        if (error) throw error;

        // Get members
        const { data: members } = await supabase
            .from('group_members')
            .select(`
                role,
                joined_at,
                users!group_members_user_id_fkey(id, username, full_name, profile_picture)
            `)
            .eq('group_id', groupId);

        res.json({
            success: true,
            group: {
                ...group,
                members: members.map(m => ({
                    ...m.users,
                    role: m.role,
                    joined_at: m.joined_at
                })),
                user_role: membership.role
            }
        });
    } catch (error) {
        console.error('Error fetching group details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch group details'
        });
    }
});

// Get group messages
router.get('/:groupId/messages', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { groupId } = req.params;

        // Check if user is member
        const { data: membership } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Get messages
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:users!messages_sender_id_fkey(id, username, full_name, profile_picture)
            `)
            .eq('group_id', groupId)
            .eq('message_type', 'group')
            .order('created_at', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            messages: messages.map(m => ({
                ...m,
                sender_id: m.sender.id,
                sender_username: m.sender.username,
                sender_full_name: m.sender.full_name,
                sender_profile_picture: m.sender.profile_picture
            }))
        });
    } catch (error) {
        console.error('Error fetching group messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages'
        });
    }
});

// Send group message
router.post('/:groupId/messages', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { groupId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        // Check if user is member
        const { data: membership } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Send message
        const { data: newMessage, error } = await supabase
            .from('messages')
            .insert([{
                sender_id: userId,
                group_id: groupId,
                message_type: 'group',
                content: content.trim()
            }])
            .select()
            .single();

        if (error) throw error;

        // Update group's updated_at
        await supabase
            .from('groups')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', groupId);

        // Get sender info
        const { data: sender } = await supabase
            .from('users')
            .select('username, full_name, profile_picture')
            .eq('id', userId)
            .single();

        res.status(201).json({
            success: true,
            message: {
                ...newMessage,
                sender_username: sender?.username,
                sender_full_name: sender?.full_name,
                sender_profile_picture: sender?.profile_picture
            }
        });
    } catch (error) {
        console.error('Error sending group message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
});

// Add member to group
router.post('/:groupId/members', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { groupId } = req.params;
        const { userIds } = req.body;

        // Check if requester is admin
        const { data: membership } = await supabase
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (!membership || membership.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can add members'
            });
        }

        // Add members
        const membersToAdd = userIds.map(uid => ({
            group_id: groupId,
            user_id: uid,
            role: 'member'
        }));

        const { error } = await supabase
            .from('group_members')
            .insert(membersToAdd);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Members added successfully'
        });
    } catch (error) {
        console.error('Error adding members:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add members'
        });
    }
});

// Leave group
router.post('/:groupId/leave', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { groupId } = req.params;

        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Left group successfully'
        });
    } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to leave group'
        });
    }
});

module.exports = router;
