# 🔧 Push Notification Debug Checklist

## কাজ করছে না? এই steps follow করুন:

### ⚡ Step 1: Browser Console Check করুন

1. Browser এ `F12` চাপুন
2. **Console** tab এ যান
3. এই code paste করুন:

```javascript
// Check if notifications are supported
console.log('Notification Support:', 'Notification' in window);
console.log('Permission Status:', Notification.permission);
console.log('Service Worker Support:', 'serviceWorker' in navigator);

// Test notification
if (Notification.permission === 'granted') {
    new Notification('Test', { body: 'Notifications are working!' });
} else {
    console.log('⚠️ Permission not granted. Status:', Notification.permission);
}
```

**Expected Output:**
```
Notification Support: true
Permission Status: granted (or default/denied)
Service Worker Support: true
```

---

### ⚡ Step 2: Frontend Restart করুন

**Important!** নতুন files যোগ করা হয়েছে, তাই frontend restart করতে হবে:

```bash
# Frontend terminal এ:
Ctrl + C
npm run dev
```

---

### ⚡ Step 3: Hard Refresh করুন

```bash
# Browser এ:
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

---

### ⚡ Step 4: Check Error Messages

Browser console এ এই errors খুঁজুন:

#### Error 1: "Cannot find module './utils/notificationManager'"
**Solution:** Frontend restart করুন

#### Error 2: "Notification is not defined"
**Solution:** Browser notifications support করে না (unlikely)

#### Error 3: "Permission denied"
**Solution:** Browser settings থেকে permission allow করুন

---

### ⚡ Step 5: Manual Permission Request

Console এ এই code run করুন:

```javascript
// Manually request permission
Notification.requestPermission().then(permission => {
    console.log('Permission:', permission);
    if (permission === 'granted') {
        new Notification('Success!', {
            body: 'Notifications are now enabled',
            icon: '/logo192.png'
        });
    }
});
```

---

### ⚡ Step 6: Check Files Exist

এই files আছে কিনা verify করুন:

```
✅ frontend/public/service-worker.js
✅ frontend/src/utils/notificationManager.js
✅ frontend/src/components/NotificationPrompt.jsx
✅ frontend/src/styles/NotificationPrompt.css
```

---

## 🐛 Common Issues:

### Issue 1: Permission Modal দেখাচ্ছে না

**Possible Causes:**
- Frontend restart করেননি
- localStorage এ already saved আছে
- Import error আছে

**Solutions:**
1. Frontend restart করুন
2. Console এ run করুন:
   ```javascript
   localStorage.removeItem('notificationPromptShown');
   location.reload();
   ```
3. Console এ error check করুন

---

### Issue 2: "Notification is not a constructor"

**Cause:** Browser notifications support করে না

**Check:**
```javascript
console.log('Notification' in window);
// Should return: true
```

**Solution:** Modern browser use করুন (Chrome, Firefox, Edge)

---

### Issue 3: Permission "denied"

**Cause:** User previously denied permission

**Solution:**
1. Browser address bar এ 🔒 icon click করুন
2. "Notifications" → "Allow" select করুন
3. Page reload করুন

---

### Issue 4: Modal shows but permission not working

**Debug:**
```javascript
// Check if notificationManager loaded
import notificationManager from './utils/notificationManager';
console.log('Manager:', notificationManager);
console.log('Permission:', notificationManager.getPermissionStatus());
```

---

## 🧪 Quick Test Script

Browser console এ এই complete test run করুন:

```javascript
async function fullTest() {
    console.log('🧪 Starting Full Test...\n');
    
    // Test 1: Browser Support
    console.log('1️⃣ Browser Support:');
    console.log('   Notifications:', 'Notification' in window ? '✅' : '❌');
    console.log('   Service Worker:', 'serviceWorker' in navigator ? '✅' : '❌');
    
    // Test 2: Current Permission
    console.log('\n2️⃣ Permission Status:');
    console.log('   Status:', Notification.permission);
    
    // Test 3: Request Permission
    if (Notification.permission === 'default') {
        console.log('\n3️⃣ Requesting Permission...');
        const permission = await Notification.requestPermission();
        console.log('   Result:', permission);
    }
    
    // Test 4: Show Test Notification
    if (Notification.permission === 'granted') {
        console.log('\n4️⃣ Showing Test Notification...');
        const notif = new Notification('Test Successful! ✅', {
            body: 'Push notifications are working!',
            icon: '/logo192.png',
            badge: '/logo192.png'
        });
        
        setTimeout(() => notif.close(), 3000);
        console.log('   ✅ Notification shown!');
    } else {
        console.log('\n4️⃣ ❌ Cannot show notification');
        console.log('   Permission:', Notification.permission);
    }
    
    console.log('\n✅ Test Complete!');
}

fullTest();
```

---

## 📋 Detailed Checklist:

### Frontend:
- [ ] Frontend server running?
- [ ] No console errors?
- [ ] Files exist in correct locations?
- [ ] Imports working?
- [ ] Hard refresh done?

### Browser:
- [ ] Modern browser (Chrome/Firefox/Edge)?
- [ ] Notifications supported?
- [ ] Permission granted?
- [ ] No browser extensions blocking?

### Code:
- [ ] notificationManager imported in Feed.jsx?
- [ ] NotificationPrompt imported in Feed.jsx?
- [ ] NotificationPrompt rendered in JSX?
- [ ] useEffect calling requestPermission?

---

## 🔍 Step-by-Step Debug:

### 1. Check Console for Errors
```
F12 → Console tab
Look for red errors
```

### 2. Check Network Tab
```
F12 → Network tab
Reload page
Look for failed requests (red)
```

### 3. Check if Modal Component Loaded
```javascript
// In console:
document.querySelector('.notification-prompt-overlay')
// Should return: null (if not shown) or element (if shown)
```

### 4. Force Show Modal
```javascript
// In console:
localStorage.removeItem('notificationPromptShown');
location.reload();
// Wait 3 seconds
```

### 5. Check Permission Status
```javascript
// In console:
console.log(Notification.permission);
// Should be: 'default', 'granted', or 'denied'
```

---

## 🆘 Still Not Working?

### Collect Debug Info:

1. **Browser Console Screenshot**
   - F12 → Console tab
   - Screenshot any errors

2. **Network Tab Screenshot**
   - F12 → Network tab
   - Reload page
   - Screenshot failed requests

3. **Permission Status**
   ```javascript
   console.log({
       support: 'Notification' in window,
       permission: Notification.permission,
       serviceWorker: 'serviceWorker' in navigator
   });
   ```

4. **File Check**
   - Verify all files exist
   - Check file paths are correct

---

## 💡 Quick Fixes:

### Fix 1: Complete Restart
```bash
# Stop both servers (Ctrl + C)
# Backend:
cd backend
npm run dev

# Frontend (new terminal):
cd frontend
npm run dev

# Browser:
Ctrl + Shift + R
```

### Fix 2: Clear Everything
```javascript
// Browser console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Fix 3: Reset Permission
```
Browser Settings → Privacy → Notifications
Find localhost:3000
Reset to "Ask"
Reload page
```

---

## 📞 Need More Help?

Run this diagnostic and share output:

```javascript
console.log('=== DIAGNOSTIC INFO ===');
console.log('Browser:', navigator.userAgent);
console.log('Notification Support:', 'Notification' in window);
console.log('Permission:', Notification.permission);
console.log('Service Worker:', 'serviceWorker' in navigator);
console.log('LocalStorage:', localStorage.getItem('notificationPromptShown'));
console.log('Current URL:', window.location.href);
```

Copy the output এবং আমাকে পাঠান!
