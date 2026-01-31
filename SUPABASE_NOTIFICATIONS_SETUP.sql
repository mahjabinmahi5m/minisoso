-- =====================================================
-- NOTIFICATIONS TABLE FOR SUPABASE
-- Copy this entire code and paste in Supabase SQL Editor
-- =====================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention')),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own notifications
CREATE POLICY notifications_select_policy ON notifications
    FOR SELECT
    USING (recipient_id = auth.uid() OR actor_id = auth.uid());

-- Policy: Users can update their own notifications
CREATE POLICY notifications_update_policy ON notifications
    FOR UPDATE
    USING (recipient_id = auth.uid());

-- Policy: Allow creating notifications
CREATE POLICY notifications_insert_policy ON notifications
    FOR INSERT
    WITH CHECK (true);

-- Policy: Users can delete their own notifications
CREATE POLICY notifications_delete_policy ON notifications
    FOR DELETE
    USING (recipient_id = auth.uid());
