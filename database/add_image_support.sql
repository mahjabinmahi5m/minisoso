-- Add image_url column to posts table
-- Run this in Supabase SQL Editor

ALTER TABLE posts 
ADD COLUMN image_url TEXT;

-- Create a storage bucket for post images (run in SQL Editor)
-- Note: You also need to create the bucket in Supabase Storage UI
-- Go to Storage -> Create a new bucket named 'minisoso' with public access

-- Storage policies for minisoso bucket
-- These allow authenticated users to upload and everyone to view images
