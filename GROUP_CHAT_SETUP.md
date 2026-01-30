# 🚀 Group Chat - Quick Setup Guide

## ✅ Progress So Far

### Backend Complete:
- ✅ Database schema created (`groups_schema.sql`)
- ✅ API routes implemented (`routes/groups.js`)
- ✅ Server updated with group routes

---

## 📋 Setup Steps

### Step 1: Run Database Migration ⚠️ REQUIRED

**Go to Supabase Dashboard:**
1. Open https://supabase.com
2. Login and select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"

**Copy and paste this SQL:**

Open file: `d:\minisoso\backend\database\groups_schema.sql`

Or copy from here:
```sql
-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    group_picture TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group members table  
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- Update messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'direct';

ALTER TABLE messages ALTER COLUMN receiver_id DROP NOT NULL;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS check_message_target;
ALTER TABLE messages ADD CONSTRAINT check_message_target 
    CHECK (
        (receiver_id IS NOT NULL AND group_id IS NULL AND message_type = 'direct') OR 
        (receiver_id IS NULL AND group_id IS NOT NULL AND message_type = 'group')
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_group ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);

-- View for user groups
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
```

**Run the SQL:**
- Click "Run" button (or Ctrl + Enter)
- Wait for success message
- ✅ Tables created!

---

### Step 2: Verify Tables Created

**In Supabase Table Editor:**
1. Click "Table Editor" in left sidebar
2. You should see new tables:
   - ✅ `groups`
   - ✅ `group_members`
   - ✅ `messages` (updated with new columns)

---

### Step 3: Backend is Ready!

Backend server will auto-reload with new routes.

**API Endpoints Available:**
```
GET    /api/groups                    - Get user's groups
POST   /api/groups/create             - Create new group
GET    /api/groups/:groupId           - Get group details
GET    /api/groups/:groupId/messages  - Get group messages
POST   /api/groups/:groupId/messages  - Send group message
POST   /api/groups/:groupId/members   - Add members (admin only)
POST   /api/groups/:groupId/leave     - Leave group
```

---

## 🎯 Next: Frontend Components

After running the SQL, I will create:

### 1. GroupsList Component
- Display user's groups
- "Create Group" button
- Navigate to group chat

### 2. GroupChat Component
- Group message display
- Send messages
- Show members
- Group header with info

### 3. CreateGroup Modal
- Group name input
- Select members
- Create button

### 4. Update Messages Page
- Add "Groups" tab
- Toggle between Direct/Groups
- Unified interface

---

## 📊 Database Structure

### Tables Created:

**groups:**
```
id (UUID)
name (VARCHAR)
description (TEXT)
group_picture (TEXT)
created_by (UUID → users)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**group_members:**
```
id (UUID)
group_id (UUID → groups)
user_id (UUID → users)
role (VARCHAR: 'admin' or 'member')
joined_at (TIMESTAMP)
```

**messages (updated):**
```
... existing columns ...
group_id (UUID → groups) [NEW]
message_type (VARCHAR: 'direct' or 'group') [NEW]
receiver_id (now NULLABLE) [UPDATED]
```

---

## ⚡ Quick Test (After SQL)

### Test API with Browser Console:

```javascript
// Get your groups
fetch('http://localhost:5000/api/groups', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(console.log);

// Should return: { success: true, groups: [] }
```

---

## 🔄 Status

- ✅ **Database Schema** - Ready (need to run SQL)
- ✅ **Backend API** - Complete
- ⏳ **Frontend Components** - Next step
- ⏳ **UI/Styling** - After components
- ⏳ **Testing** - Final step

---

## 📝 Important Notes

1. **Run SQL first!** Backend won't work without tables
2. **Backup not needed** - Using `IF NOT EXISTS` and `IF NOT EXISTS`
3. **Safe to re-run** - SQL is idempotent
4. **No data loss** - Only adds columns, doesn't delete

---

## 🚨 After Running SQL

Tell me **"SQL done"** and I'll create the frontend components!

---

**Ready? Go run that SQL in Supabase! 🎯**
