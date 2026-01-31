# 🚀 Supabase-এ Notifications Table Setup করার Guide

## Step 1: Supabase Dashboard খুলুন

1. Browser এ যান: https://supabase.com
2. আপনার project এ login করুন
3. আপনার Minisoso project select করুন

## Step 2: SQL Editor খুলুন

1. Left sidebar থেকে **SQL Editor** click করুন
2. অথবা এই icon খুঁজুন: `</>`

## Step 3: SQL Code Copy করুন

নিচের file টি open করুন এবং **সম্পূর্ণ code** copy করুন:

📁 **File**: `SUPABASE_NOTIFICATIONS_SETUP.sql`

অথবা এখান থেকে copy করুন:

```sql
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
```

## Step 4: SQL Editor এ Paste করুন

1. SQL Editor এ একটা **New Query** তৈরি করুন
2. উপরের সম্পূর্ণ SQL code paste করুন
3. Query এর নাম দিন: "Create Notifications Table"

## Step 5: Run করুন

1. **RUN** button click করুন (অথবা `Ctrl + Enter`)
2. Wait করুন কিছুক্ষণ
3. Success message দেখবেন: ✅ "Success. No rows returned"

## Step 6: Verify করুন

### Table তৈরি হয়েছে কিনা check করুন:

1. Left sidebar থেকে **Table Editor** click করুন
2. Tables list এ **notifications** table দেখতে পাবেন
3. Table click করলে columns দেখবেন:
   - id
   - recipient_id
   - actor_id
   - type
   - post_id
   - comment_id
   - content
   - is_read
   - created_at

### Policies check করুন:

1. Notifications table select করুন
2. উপরে **Policies** tab click করুন
3. 4টি policies দেখতে পাবেন:
   - notifications_select_policy
   - notifications_update_policy
   - notifications_insert_policy
   - notifications_delete_policy

## ✅ Setup Complete!

যদি সব কিছু ঠিকমতো হয়ে থাকে, তাহলে:

1. ✅ Notifications table তৈরি হয়ে গেছে
2. ✅ Indexes তৈরি হয়ে গেছে
3. ✅ Security policies active আছে
4. ✅ আপনার app এখন notifications system use করতে পারবে!

## 🧪 Test করুন

এখন আপনার app test করুন:

1. দুইটা browser window খুলুন
2. দুইটা আলাদা user দিয়ে login করুন
3. একজন অন্যজনের post like করুন
4. Feed page এ notification bell এ red badge দেখবেন!
5. Bell click করলে notification দেখবেন: "User liked your post"

## ⚠️ Troubleshooting

### Error: "relation users does not exist"
- আপনার users table আছে কিনা check করুন
- Table Editor এ users table দেখতে পাচ্ছেন কিনা verify করুন

### Error: "relation posts does not exist"
- আপনার posts table আছে কিনা check করুন
- আগে posts table তৈরি করতে হবে

### Error: "relation comments does not exist"
- আপনার comments table আছে কিনা check করুন
- আগে comments table তৈরি করতে হবে

### Success কিন্তু table দেখা যাচ্ছে না?
- Page refresh করুন
- Table Editor এ গিয়ে check করুন
- SQL Editor এ run করুন: `SELECT * FROM notifications;`

## 📞 Need Help?

যদি কোনো সমস্যা হয়:
1. Error message টা carefully পড়ুন
2. Console এ error details দেখুন
3. Supabase logs check করুন

---

**Happy Coding! 🎉**
