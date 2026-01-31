# 🔧 Notification Show না করলে এই Steps Follow করুন

## ⚡ Quick Fix (এটা প্রথমে করুন):

### 1️⃣ Backend Server Restart করুন

**কেন?** নতুন notification routes যোগ করা হয়েছে, তাই restart করতে হবে।

```bash
# Backend terminal এ:
# Ctrl + C চাপুন (server stop করতে)
# তারপর আবার run করুন:
npm run dev
```

### 2️⃣ Frontend Hard Refresh করুন

```bash
# Browser এ:
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

### 3️⃣ Browser Console Check করুন

1. Browser এ `F12` চাপুন
2. **Console** tab এ যান
3. এই test script copy করে paste করুন:

```javascript
// Copy করুন: test-notifications.js file থেকে
// অথবা এখানে থেকে:

fetch('http://localhost:5000/api/notifications/unread-count', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
})
.then(res => res.json())
.then(data => console.log('✅ Notification API working!', data))
.catch(err => console.error('❌ Error:', err));
```

---

## 🔍 Step-by-Step Debugging:

### Step 1: Supabase Table Check করুন

**Supabase Dashboard → Table Editor**

✅ Check করুন:
- `notifications` table আছে কিনা
- Table এ এই columns আছে কিনা:
  - id
  - recipient_id
  - actor_id
  - type
  - post_id
  - comment_id
  - content
  - is_read
  - created_at

❌ যদি table না থাকে:
1. SQL Editor খুলুন
2. `SUPABASE_NOTIFICATIONS_SETUP.sql` এর code run করুন

### Step 2: Backend Routes Check করুন

**Backend terminal এ দেখুন:**

✅ এই message দেখা উচিত:
```
Server is running on port 5000
API available at http://localhost:5000
```

❌ যদি error দেখেন:
```
Error: Cannot find module './routes/notifications'
```

**Solution:**
1. Check করুন: `backend/routes/notifications.js` file আছে কিনা
2. Check করুন: `backend/server.js` এ route যোগ করা আছে কিনা

### Step 3: Frontend Component Check করুন

**Feed.jsx file check করুন:**

✅ এই code আছে কিনা:
```javascript
import { IoNotificationsOutline } from 'react-icons/io5';
const [notificationCount, setNotificationCount] = useState(0);
const fetchNotificationCount = async () => { ... };
```

✅ Header এ notification bell button আছে কিনা:
```javascript
<button onClick={() => navigate('/notifications')} className="btn-notifications">
    <IoNotificationsOutline />
    {notificationCount > 0 && (
        <span className="notification-badge">
            {notificationCount > 99 ? '99+' : notificationCount}
        </span>
    )}
</button>
```

### Step 4: Network Tab Check করুন

**Browser DevTools → Network tab**

1. Page reload করুন
2. Filter করুন: `notifications`
3. এই API calls দেখা উচিত:
   - `GET /api/notifications/unread-count`
   - Status: `200 OK`
   - Response: `{"success": true, "count": 0}`

❌ যদি `404 Not Found` দেখেন:
- Backend server restart করুন
- Route properly registered আছে কিনা check করুন

❌ যদি `500 Internal Server Error` দেখেন:
- Backend logs check করুন
- Supabase table আছে কিনা verify করুন

### Step 5: Create Test Notification

**Manual test করুন:**

1. **দুইটা browser window খুলুন**
   - Window 1: Normal browser
   - Window 2: Incognito mode

2. **দুইটা আলাদা user দিয়ে login করুন**
   - Window 1: User A
   - Window 2: User B

3. **User A একটা post করুন**

4. **User B সেই post like করুন**

5. **User A এর window এ check করুন:**
   - Feed page refresh করুন
   - Notification bell এ red badge দেখা উচিত
   - Badge এ "1" লেখা থাকবে

6. **Bell click করুন:**
   - Notifications page খুলবে
   - "User B liked your post" দেখা উচিত

---

## 🐛 Common Errors & Solutions:

### Error 1: "Cannot GET /api/notifications/unread-count"

**Cause:** Backend route registered হয়নি

**Solution:**
1. `backend/server.js` check করুন
2. এই line আছে কিনা:
   ```javascript
   const notificationRoutes = require('./routes/notifications');
   app.use('/api/notifications', notificationRoutes);
   ```
3. Backend restart করুন

### Error 2: "relation notifications does not exist"

**Cause:** Supabase table তৈরি হয়নি

**Solution:**
1. Supabase SQL Editor খুলুন
2. `SUPABASE_NOTIFICATIONS_SETUP.sql` run করুন
3. Success message দেখুন

### Error 3: Badge দেখাচ্ছে না কিন্তু notification আছে

**Cause:** Frontend polling কাজ করছে না

**Solution:**
1. Browser console check করুন
2. Error আছে কিনা দেখুন
3. `fetchNotificationCount` function call হচ্ছে কিনা verify করুন
4. Hard refresh করুন: `Ctrl + Shift + R`

### Error 4: Notification তৈরি হচ্ছে না

**Cause:** Backend এ notification creation code missing

**Solution:**
1. `backend/routes/posts.js` check করুন
2. Like route এ notification creation code আছে কিনা
3. Comment route এ notification creation code আছে কিনা

---

## 🧪 Test Script Run করুন:

Browser console এ এই script paste করুন:

```javascript
// File: test-notifications.js এর content copy করুন
// অথবা নিচের quick test run করুন:

async function quickTest() {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/notifications/unread-count', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Notification Count:', data.count);
    console.log('API Working:', res.ok ? '✅' : '❌');
}
quickTest();
```

---

## 📋 Checklist (সব ✅ হওয়া উচিত):

- [ ] Supabase এ `notifications` table আছে
- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 3000)
- [ ] `backend/routes/notifications.js` file আছে
- [ ] `backend/server.js` এ route registered আছে
- [ ] `Feed.jsx` এ notification bell code আছে
- [ ] `App.js` এ `/notifications` route আছে
- [ ] Browser console এ কোনো error নেই
- [ ] Network tab এ API calls successful

---

## 🆘 এখনও কাজ করছে না?

### Complete Reset করুন:

1. **Backend:**
   ```bash
   # Terminal close করুন
   # নতুন terminal খুলুন
   cd d:\minisoso\backend
   npm run dev
   ```

2. **Frontend:**
   ```bash
   # Terminal close করুন
   # নতুন terminal খুলুন
   cd d:\minisoso\frontend
   npm run dev
   ```

3. **Browser:**
   - Cache clear করুন: `Ctrl + Shift + Delete`
   - Browser restart করুন
   - Page reload করুন: `Ctrl + Shift + R`

4. **Test again:**
   - Login করুন
   - Console check করুন
   - Test notification create করুন

---

## 📞 Debug Info Collect করুন:

যদি এখনও problem হয়, এই info collect করুন:

1. **Backend terminal output:**
   - কোনো error message?
   - Server running message দেখাচ্ছে?

2. **Browser console:**
   - Screenshot নিন
   - Error messages copy করুন

3. **Network tab:**
   - Failed requests screenshot
   - Response data

4. **Supabase:**
   - `notifications` table screenshot
   - SQL query result: `SELECT * FROM notifications;`

এই info দিয়ে আমি আরো help করতে পারব! 🚀
