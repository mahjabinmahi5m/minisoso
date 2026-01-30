-- ============================================
-- FOLLOWERS/FOLLOWING SYSTEM
-- Instagram-style follow feature
-- ============================================

-- 1. Create Followers Table
CREATE TABLE IF NOT EXISTS followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- 2. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);

-- 3. Add follower/following counts to users (optional - for caching)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- 4. Create function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment following count for follower
        UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        -- Increment followers count for following
        UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement following count for follower
        UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
        -- Decrement followers count for following
        UPDATE users SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to auto-update counts
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON followers;
CREATE TRIGGER trigger_update_follower_counts
AFTER INSERT OR DELETE ON followers
FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'followers';

-- Check if columns exist in users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('followers_count', 'following_count');

-- ============================================
-- SAMPLE QUERIES (for testing)
-- ============================================

-- Get followers of a user
-- SELECT u.* FROM users u
-- JOIN followers f ON u.id = f.follower_id
-- WHERE f.following_id = 'USER_ID';

-- Get following of a user
-- SELECT u.* FROM users u
-- JOIN followers f ON u.id = f.following_id
-- WHERE f.follower_id = 'USER_ID';

-- Check if user A follows user B
-- SELECT EXISTS(
--     SELECT 1 FROM followers 
--     WHERE follower_id = 'USER_A_ID' 
--     AND following_id = 'USER_B_ID'
-- );
