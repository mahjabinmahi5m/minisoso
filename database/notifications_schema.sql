-- Notifications Table
-- This table stores all user notifications (likes, comments, follows, etc.)

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who will receive this notification
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Who triggered this notification (the actor)
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Type of notification
    type VARCHAR(50) NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention')),
    
    -- Reference to the related entity
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    
    -- Notification content/message
    content TEXT,
    
    -- Read status
    is_read BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    CONSTRAINT unique_notification UNIQUE (recipient_id, actor_id, type, post_id, comment_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable Row Level Security (optional, for additional security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own notifications
CREATE POLICY notifications_select_policy ON notifications
    FOR SELECT
    USING (recipient_id = auth.uid() OR actor_id = auth.uid());

-- Create policy to allow users to update their own notifications
CREATE POLICY notifications_update_policy ON notifications
    FOR UPDATE
    USING (recipient_id = auth.uid());

-- Create policy to allow creating notifications
CREATE POLICY notifications_insert_policy ON notifications
    FOR INSERT
    WITH CHECK (true);

COMMENT ON TABLE notifications IS 'Stores user notifications for likes, comments, follows, etc.';
COMMENT ON COLUMN notifications.recipient_id IS 'User who receives the notification';
COMMENT ON COLUMN notifications.actor_id IS 'User who triggered the notification';
COMMENT ON COLUMN notifications.type IS 'Type of notification: like, comment, follow, mention';
COMMENT ON COLUMN notifications.post_id IS 'Reference to post if notification is about a post';
COMMENT ON COLUMN notifications.comment_id IS 'Reference to comment if notification is about a comment';
