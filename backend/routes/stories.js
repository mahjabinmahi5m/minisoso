const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { supabase } = require('../config/supabase');
const auth = require('../middleware/auth');

// Configure multer for story image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/stories');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'story-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Get all active stories (not expired)
router.get('/', auth, async (req, res) => {
    try {
        const { data: stories, error } = await supabase
            .from('stories')
            .select(`
                *,
                users:user_id (
                    id,
                    username,
                    full_name,
                    profile_picture
                ),
                story_views (
                    id,
                    viewer_id
                )
            `)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Group stories by user
        const storiesByUser = {};
        stories.forEach(story => {
            const userId = story.user_id;
            if (!storiesByUser[userId]) {
                storiesByUser[userId] = {
                    user: story.users,
                    stories: [],
                    hasViewed: false
                };
            }

            // Check if current user has viewed this story
            const viewedByCurrentUser = story.story_views.some(
                view => view.viewer_id === req.user.id
            );

            storiesByUser[userId].stories.push({
                ...story,
                viewed: viewedByCurrentUser,
                view_count: story.story_views.length
            });

            // If any story is unviewed, mark the user's stories as unviewed
            if (!viewedByCurrentUser) {
                storiesByUser[userId].hasViewed = false;
            }
        });

        // Convert to array and sort (current user first, then by latest story)
        const storiesArray = Object.values(storiesByUser).sort((a, b) => {
            // Current user's stories first
            if (a.user.id === req.user.id) return -1;
            if (b.user.id === req.user.id) return 1;

            // Then sort by latest story
            const latestA = new Date(a.stories[0].created_at);
            const latestB = new Date(b.stories[0].created_at);
            return latestB - latestA;
        });

        res.json({ stories: storiesArray });
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({ error: 'Failed to fetch stories' });
    }
});

// Create a new story
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image is required' });
        }

        const imageUrl = `/uploads/stories/${req.file.filename}`;

        const { data: story, error } = await supabase
            .from('stories')
            .insert([{
                user_id: req.user.id,
                image_url: imageUrl
            }])
            .select(`
                *,
                users:user_id (
                    id,
                    username,
                    full_name,
                    profile_picture
                )
            `)
            .single();

        if (error) throw error;

        res.status(201).json({ story });
    } catch (error) {
        console.error('Error creating story:', error);
        res.status(500).json({ error: 'Failed to create story' });
    }
});

// View a story (mark as viewed)
router.post('/:storyId/view', auth, async (req, res) => {
    try {
        const { storyId } = req.params;

        // Check if already viewed
        const { data: existingView } = await supabase
            .from('story_views')
            .select('id')
            .eq('story_id', storyId)
            .eq('viewer_id', req.user.id)
            .single();

        if (!existingView) {
            const { error } = await supabase
                .from('story_views')
                .insert([{
                    story_id: storyId,
                    viewer_id: req.user.id
                }]);

            if (error) throw error;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking story as viewed:', error);
        res.status(500).json({ error: 'Failed to mark story as viewed' });
    }
});

// Delete a story
router.delete('/:storyId', auth, async (req, res) => {
    try {
        const { storyId } = req.params;

        // Get story to check ownership and get image path
        const { data: story, error: fetchError } = await supabase
            .from('stories')
            .select('*')
            .eq('id', storyId)
            .single();

        if (fetchError) throw fetchError;

        if (story.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to delete this story' });
        }

        // Delete from database
        const { error: deleteError } = await supabase
            .from('stories')
            .delete()
            .eq('id', storyId);

        if (deleteError) throw deleteError;

        // Delete image file
        const imagePath = path.join(__dirname, '..', story.image_url);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting story:', error);
        res.status(500).json({ error: 'Failed to delete story' });
    }
});

// Get story viewers
router.get('/:storyId/viewers', auth, async (req, res) => {
    try {
        const { storyId } = req.params;

        // Check if story belongs to current user
        const { data: story } = await supabase
            .from('stories')
            .select('user_id')
            .eq('id', storyId)
            .single();

        if (story.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { data: viewers, error } = await supabase
            .from('story_views')
            .select(`
                viewed_at,
                users:viewer_id (
                    id,
                    username,
                    full_name,
                    profile_picture
                )
            `)
            .eq('story_id', storyId)
            .order('viewed_at', { ascending: false });

        if (error) throw error;

        res.json({ viewers });
    } catch (error) {
        console.error('Error fetching story viewers:', error);
        res.status(500).json({ error: 'Failed to fetch viewers' });
    }
});

module.exports = router;
