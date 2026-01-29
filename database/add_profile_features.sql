-- Add profile_picture and bio columns to users table
-- Run this in Supabase SQL Editor

ALTER TABLE users 
ADD COLUMN profile_picture TEXT,
ADD COLUMN bio TEXT,
ADD COLUMN full_name TEXT;

-- Create a storage bucket for profile pictures
-- Note: You also need to create the bucket in Supabase Storage UI
-- Go to Storage -> Create a new bucket named 'minisoso' (if not exists) with public access
-- Profile pictures will be stored in: minisoso/profiles/{user_id}/

-- Storage policies are already set for the minisoso bucket
