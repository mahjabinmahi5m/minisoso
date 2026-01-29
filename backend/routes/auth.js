const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');

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

// Signup Route
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${email},username.eq.${username}`)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'User with this email or username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([
                {
                    username,
                    email,
                    password_hash: passwordHash
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Error creating user' });
        }

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        // Find user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profile_picture: user.profile_picture,
                bio: user.bio,
                full_name: user.full_name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Current User
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, email, profile_picture, bio, full_name, created_at')
            .eq('id', req.user.userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Profile (with optional profile picture)
router.put('/profile', authMiddleware, upload.single('profile_picture'), async (req, res) => {
    try {
        const { full_name, bio, username } = req.body;
        const profilePicture = req.file;
        const userId = req.user.userId;

        let profilePictureUrl = null;

        // Upload profile picture to Supabase Storage if provided
        if (profilePicture) {
            const fileExt = profilePicture.originalname.split('.').pop();
            const fileName = `profile.${fileExt}`;
            const filePath = `profiles/${userId}/${fileName}`;

            // Delete old profile picture if exists
            const { data: oldUser } = await supabase
                .from('users')
                .select('profile_picture')
                .eq('id', userId)
                .single();

            if (oldUser?.profile_picture) {
                const oldPath = oldUser.profile_picture.split('/').slice(-2).join('/');
                await supabase.storage
                    .from('minisoso')
                    .remove([oldPath]);
            }

            const { error: uploadError } = await supabase.storage
                .from('minisoso')
                .upload(filePath, profilePicture.buffer, {
                    contentType: profilePicture.mimetype,
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                console.error('Image upload error:', uploadError);
                return res.status(500).json({ error: 'Error uploading profile picture' });
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('minisoso')
                .getPublicUrl(filePath);

            profilePictureUrl = publicUrl;
        }

        // Build update object
        const updateData = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (bio !== undefined) updateData.bio = bio;
        if (username !== undefined) updateData.username = username;
        if (profilePictureUrl) updateData.profile_picture = profilePictureUrl;

        // Update user profile
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select('id, username, email, profile_picture, bio, full_name')
            .single();

        if (error) {
            console.error('Profile update error:', error);
            return res.status(500).json({ error: 'Error updating profile' });
        }

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

