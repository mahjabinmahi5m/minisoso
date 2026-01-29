const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Get All Posts
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select(`
        *,
        users (
          id,
          username,
          email
        )
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Error fetching posts' });
        }

        res.json({ posts });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create Post
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Post content cannot be empty' });
        }

        const { data: newPost, error } = await supabase
            .from('posts')
            .insert([
                {
                    user_id: req.user.userId,
                    content: content.trim()
                }
            ])
            .select(`
        *,
        users (
          id,
          username,
          email
        )
      `)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Error creating post' });
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

module.exports = router;
