# Notification Troubleshooting Guide

## আপনার notification show করছে না? এই steps follow করুন:

### Step 1: Backend Server Restart করুন

নতুন routes যোগ করা হয়েছে, তাই backend restart করতে হবে:

1. Backend terminal এ যান
2. `Ctrl + C` press করে server stop করুন
3. আবার run করুন: `npm run dev`

### Step 2: Supabase Table Check করুন

1. Supabase Dashboard → Table Editor
2. `notifications` table আছে কিনা check করুন
3. যদি না থাকে, `SUPABASE_NOTIFICATIONS_SETUP.sql` run করুন

### Step 3: Browser Console Check করুন

1. Browser এ `F12` press করুন
2. Console tab এ যান
3. কোনো error আছে কিনা দেখুন
4. বিশেষ করে এই errors খুঁজুন:
   - "404 Not Found" - Backend route missing
   - "500 Internal Server Error" - Database issue
   - "CORS error" - Backend connection issue

### Step 4: Network Tab Check করুন

1. Browser DevTools → Network tab
2. Page reload করুন
3. এই API calls খুঁজুন:
   - `GET /api/notifications/unread-count`
   - `GET /api/notifications`
4. Response দেখুন - error আছে কিনা

### Step 5: Test Notification Creation

একটা test করুন:

1. দুইটা browser window খুলুন (বা একটায় incognito)
2. দুইটা আলাদা user দিয়ে login করুন
3. User A একটা post করুন
4. User B সেই post like করুন
5. User A এর Feed page refresh করুন
6. Notification bell check করুন

### Step 6: Backend Logs Check করুন

Backend terminal এ logs দেখুন:
- কোনো error message আছে কিনা
- API calls আসছে কিনা
- Database connection ঠিক আছে কিনা

---

## Common Issues & Solutions:

### Issue 1: "Cannot GET /api/notifications"
**Solution**: Backend server restart করুন

### Issue 2: "Table notifications does not exist"
**Solution**: Supabase SQL run করুন

### Issue 3: Badge দেখাচ্ছে না
**Solution**: 
- Browser console check করুন
- `fetchNotificationCount` function call হচ্ছে কিনা দেখুন
- API response check করুন

### Issue 4: Notification তৈরি হচ্ছে না
**Solution**:
- Backend logs check করুন
- Like/Comment করার সময় error আসছে কিনা দেখুন
- Database policies check করুন

---

## Quick Debug Commands:

### Check if notifications table exists:
Supabase SQL Editor এ run করুন:
```sql
SELECT * FROM notifications LIMIT 5;
```

### Check notification count:
```sql
SELECT COUNT(*) FROM notifications;
```

### Check recent notifications:
```sql
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
```

---

## যদি এখনও কাজ না করে:

1. **Backend completely restart করুন**:
   - Terminal close করুন
   - নতুন terminal খুলুন
   - `cd backend`
   - `npm run dev`

2. **Frontend completely restart করুন**:
   - Terminal close করুন
   - নতুন terminal খুলুন
   - `cd frontend`
   - `npm run dev`

3. **Browser cache clear করুন**:
   - `Ctrl + Shift + Delete`
   - Cache clear করুন
   - Page reload করুন

4. **Hard refresh করুন**:
   - `Ctrl + Shift + R` (Windows)
   - `Cmd + Shift + R` (Mac)
