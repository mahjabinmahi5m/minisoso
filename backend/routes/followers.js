const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authenticateToken = require('../middleware/auth');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Follow a user
router.post('/follow/:userId', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.userId;
        const followingId = req.params.userId;

        // Check if trying to follow self
        if (followerId === followingId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot follow yourself'
            });
        }

        // Check if user exists
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('id', followingId)
            .single();

        if (userError || !user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already following
        const { data: existing } = await supabase
            .from('followers')
            .select('id')
            .eq('follower_id', followerId)
            .eq('following_id', followingId)
            .single();

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Already following this user'
            });
        }

        // Create follow relationship
        const { data, error } = await supabase
            .from('followers')
            .insert([{
                follower_id: followerId,
                following_id: followingId
            }])
            .select()
            .single();

        if (error) {
            console.error('Error following user:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to follow user'
            });
        }

        res.json({
            success: true,
            message: 'Successfully followed user',
            data
        });
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to follow user'
        });
    }
});

// Unfollow a user
router.delete('/unfollow/:userId', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.userId;
        const followingId = req.params.userId;

        const { error } = await supabase
            .from('followers')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followingId);

        if (error) {
            console.error('Error unfollowing user:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to unfollow user'
            });
        }

        res.json({
            success: true,
            message: 'Successfully unfollowed user'
        });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unfollow user'
        });
    }
});

// Get followers of a user
router.get('/followers/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        const { data: followers, error } = await supabase
            .from('followers')
            .select(`
                follower_id,
                created_at,
                follower:users!followers_follower_id_fkey(
                    id,
                    username,
                    full_name,
                    profile_picture
                )
            `)
            .eq('following_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching followers:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch followers'
            });
        }

        // Format response
        const formattedFollowers = followers.map(f => ({
            id: f.follower.id,
            username: f.follower.username,
            full_name: f.follower.full_name,
            profile_picture: f.follower.profile_picture,
            followed_at: f.created_at
        }));

        res.json({
            success: true,
            followers: formattedFollowers,
            count: formattedFollowers.length
        });
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch followers'
        });
    }
});

// Get following of a user
router.get('/following/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        const { data: following, error } = await supabase
            .from('followers')
            .select(`
                following_id,
                created_at,
                following:users!followers_following_id_fkey(
                    id,
                    username,
                    full_name,
                    profile_picture
                )
            `)
            .eq('follower_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching following:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch following'
            });
        }

        // Format response
        const formattedFollowing = following.map(f => ({
            id: f.following.id,
            username: f.following.username,
            full_name: f.following.full_name,
            profile_picture: f.following.profile_picture,
            followed_at: f.created_at
        }));

        res.json({
            success: true,
            following: formattedFollowing,
            count: formattedFollowing.length
        });
    } catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch following'
        });
    }
});

// Check if current user follows another user
router.get('/is-following/:userId', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.userId;
        const followingId = req.params.userId;

        const { data, error } = await supabase
            .from('followers')
            .select('id')
            .eq('follower_id', followerId)
            .eq('following_id', followingId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
            console.error('Error checking follow status:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to check follow status'
            });
        }

        res.json({
            success: true,
            isFollowing: !!data
        });
    } catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check follow status'
        });
    }
});

// Get follower/following counts for a user
router.get('/counts/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Get counts from users table (cached counts)
        const { data: user, error } = await supabase
            .from('users')
            .select('followers_count, following_count')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching counts:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch counts'
            });
        }

        res.json({
            success: true,
            followers_count: user.followers_count || 0,
            following_count: user.following_count || 0
        });
    } catch (error) {
        console.error('Error fetching counts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch counts'
        });
    }
});

module.exports = router;
