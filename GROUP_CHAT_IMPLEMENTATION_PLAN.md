# 🎯 Group Chat Implementation Plan

## Overview
Adding WhatsApp/Instagram-style group chat functionality to the messaging system.

---

## Phase 1: Database Schema

### New Tables Needed:

#### 1. `groups` Table
```sql
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    group_picture TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. `group_members` Table
```sql
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- 'admin' or 'member'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);
```

#### 3. Update `messages` Table
```sql
-- Add group support to existing messages table
ALTER TABLE messages ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'direct'; -- 'direct' or 'group'

-- Make receiver_id optional for group messages
ALTER TABLE messages ALTER COLUMN receiver_id DROP NOT NULL;

-- Add constraint: either receiver_id OR group_id must be set
ALTER TABLE messages ADD CONSTRAINT check_message_target 
    CHECK (
        (receiver_id IS NOT NULL AND group_id IS NULL) OR 
        (receiver_id IS NULL AND group_id IS NOT NULL)
    );
```

#### 4. Indexes
```sql
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_messages_group ON messages(group_id);
```

---

## Phase 2: Backend API Routes

### New Routes in `routes/groups.js`:

```javascript
// Group Management
POST   /api/groups/create          // Create new group
GET    /api/groups                 // Get user's groups
GET    /api/groups/:groupId        // Get group details
PUT    /api/groups/:groupId        // Update group info
DELETE /api/groups/:groupId        // Delete group (admin only)

// Group Members
POST   /api/groups/:groupId/members/add      // Add members
DELETE /api/groups/:groupId/members/:userId  // Remove member
PUT    /api/groups/:groupId/members/:userId  // Update member role
GET    /api/groups/:groupId/members          // Get group members

// Group Messages
GET    /api/groups/:groupId/messages         // Get group messages
POST   /api/groups/:groupId/messages         // Send group message
```

---

## Phase 3: Frontend Components

### New Components:

#### 1. `GroupsList.jsx`
- Display user's groups
- Create new group button
- Group search

#### 2. `GroupChat.jsx`
- Group message display
- Send messages to group
- Show member list
- Group info header

#### 3. `CreateGroup.jsx`
- Group name input
- Group description
- Select members
- Upload group picture

#### 4. `GroupSettings.jsx`
- Edit group info
- Manage members
- Add/remove members
- Change member roles
- Leave group
- Delete group (admin)

---

## Phase 4: Features

### Core Features:
✅ Create group with name and picture
✅ Add multiple members
✅ Send messages to group
✅ All members see messages
✅ Group admin role
✅ Add/remove members
✅ Leave group
✅ Delete group (admin only)

### Advanced Features (Optional):
- Group description
- Member roles (admin/member)
- Mute group notifications
- Group message search
- Reply to specific messages
- @mention members
- Group media gallery
- Read receipts (who read)

---

## Phase 5: UI/UX Design

### Messages Page:
```
┌─────────────────────────────────────┐
│ Messages                    [+] [⚙] │
├─────────────────────────────────────┤
│ Tabs: [Direct] [Groups]             │
├─────────────────────────────────────┤
│ 👥 Family Group              2h ago │
│    Mom: Dinner ready?          [3]  │
├─────────────────────────────────────┤
│ 👥 Work Team                 5h ago │
│    You: Meeting at 3pm             │
├─────────────────────────────────────┤
│ 👤 @john                     1d ago │
│    You: See you tomorrow           │
└─────────────────────────────────────┘
```

### Group Chat:
```
┌─────────────────────────────────────┐
│ ← 👥 Family Group (5)          ⋮   │
├─────────────────────────────────────┤
│                                     │
│ 👤 Mom                              │
│    Dinner ready?        6h ago      │
│                                     │
│              You replied   5h ago   │
│              Coming! 🍽️             │
│                                     │
│ 👤 Dad                              │
│    Great! See you soon   5h ago     │
│                                     │
├─────────────────────────────────────┤
│ [Type a message...]           [📤]  │
└─────────────────────────────────────┘
```

### Create Group:
```
┌─────────────────────────────────────┐
│ ← Create New Group                  │
├─────────────────────────────────────┤
│                                     │
│     [Upload Group Picture]          │
│                                     │
│ Group Name:                         │
│ [_____________________________]     │
│                                     │
│ Description (optional):             │
│ [_____________________________]     │
│                                     │
│ Add Members:                        │
│ [Search users...]                   │
│                                     │
│ Selected (3):                       │
│ ☑ @john    ☑ @sarah    ☑ @mike     │
│                                     │
│         [Create Group]              │
└─────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Database Setup ⏱️ 15 min
1. Create SQL migration file
2. Run in Supabase
3. Verify tables created

### Step 2: Backend Routes ⏱️ 45 min
1. Create `routes/groups.js`
2. Implement all endpoints
3. Add authentication
4. Test with Postman/Thunder Client

### Step 3: Frontend Components ⏱️ 2 hours
1. Create GroupsList component
2. Create GroupChat component
3. Create CreateGroup modal
4. Add routing

### Step 4: Styling ⏱️ 30 min
1. Add CSS for group components
2. Match Instagram/WhatsApp style
3. Add group icons
4. Responsive design

### Step 5: Integration ⏱️ 30 min
1. Update Messages page with tabs
2. Add group navigation
3. Test end-to-end
4. Fix bugs

### Step 6: Polish ⏱️ 30 min
1. Add loading states
2. Error handling
3. Empty states
4. Animations

**Total Time: ~4.5 hours**

---

## Database Migration File

### `backend/database/groups_schema.sql`

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

-- Update messages table for group support
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'direct';

-- Make receiver_id optional
ALTER TABLE messages ALTER COLUMN receiver_id DROP NOT NULL;

-- Add constraint
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
```

---

## Next Steps

### Option 1: Full Implementation
Implement all phases (4-5 hours work)

### Option 2: MVP (Minimum Viable Product)
- Basic group creation
- Add members
- Send/receive group messages
- Simple UI
**Time: ~2 hours**

### Option 3: Phased Approach
1. Week 1: Database + Backend
2. Week 2: Frontend components
3. Week 3: Polish + advanced features

---

## Questions to Decide:

1. **Scope:** Full feature or MVP first?
2. **Timeline:** Implement now or later?
3. **Features:** Which features are must-have?
4. **Design:** Match Instagram or WhatsApp style?

---

**Ready to start implementation? Let me know which approach you prefer!** 🚀
