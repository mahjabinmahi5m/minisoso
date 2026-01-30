-- Groups Schema for Group Chat Feature
-- Run this in Supabase SQL Editor

-- 1. Groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    group_picture TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Group members table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- 3. Update messages table for group support
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'direct';

-- Make receiver_id optional (for group messages)
ALTER TABLE messages ALTER COLUMN receiver_id DROP NOT NULL;

-- Add constraint: either receiver_id OR group_id must be set
ALTER TABLE messages DROP CONSTRAINT IF EXISTS check_message_target;
ALTER TABLE messages ADD CONSTRAINT check_message_target 
    CHECK (
        (receiver_id IS NOT NULL AND group_id IS NULL AND message_type = 'direct') OR 
        (receiver_id IS NULL AND group_id IS NOT NULL AND message_type = 'group')
    );

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_group ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);

-- 5. View for user's groups with member count
CREATE OR REPLACE VIEW user_groups AS
SELECT 
    g.id,
    g.name,
    g.description,
    g.group_picture,
    g.created_by,
    g.created_at,
    COUNT(gm.user_id) as member_count
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id
GROUP BY g.id, g.name, g.description, g.group_picture, g.created_by, g.created_at;
