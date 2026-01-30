# User Profile Feature - Testing Guide

## ✅ সম্পন্ন হয়েছে!

Instagram এর মতো User Profile feature সফলভাবে যোগ করা হয়েছে।

## 🎯 নতুন Features:

### 1. **User Profile Page**
- প্রত্যেক user এর আলাদা profile page আছে
- URL format: `/user/:userId`
- Profile এ দেখা যাবে:
  - Profile picture/avatar
  - Username (@username)
  - Full name (যদি থাকে)
  - Bio (যদি থাকে)
  - Post count
  - User এর সব posts

### 2. **Clickable Usernames**
- Feed এ যেকোনো post এর username বা avatar এ ক্লিক করলে সেই user এর profile page এ যাবে
- Hover করলে opacity কমে যাবে (visual feedback)

### 3. **Profile Page Features**
- Like এবং comment করা যাবে posts এ
- Back button দিয়ে feed এ ফিরে যাওয়া যাবে
- Responsive design

## 🧪 কিভাবে Test করবেন:

1. **Browser এ যান**: `http://localhost:3000`

2. **Login করুন** (যদি already logged in না থাকেন)

3. **Feed এ posts দেখুন**

4. **যেকোনো post এর username বা avatar এ ক্লিক করুন**
   - Example: "@john" এ ক্লিক করুন

5. **User Profile Page দেখুন**:
   - ✅ User এর profile info দেখা যাচ্ছে
   - ✅ Post count দেখা যাচ্ছে
   - ✅ User এর সব posts দেখা যাচ্ছে
   - ✅ Posts এ like/comment করা যাচ্ছে

6. **Back button ক্লিক করে Feed এ ফিরে যান**

## 📁 পরিবর্তিত Files:

### Backend:
- `backend/routes/posts.js` - নতুন endpoint যোগ করা হয়েছে:
  - `GET /api/posts/user/:userId` - specific user এর posts fetch করে

### Frontend:
- `frontend/src/pages/UserProfile.jsx` - নতুন page component (Instagram style)
- `frontend/src/App.js` - নতুন route যোগ করা হয়েছে
- `frontend/src/pages/Feed.jsx` - username clickable করা হয়েছে
- `frontend/src/styles/App.css` - UserProfile এর জন্য CSS styles

## 🎨 Design Features:

- ✅ Instagram-inspired clean design
- ✅ Smooth hover effects
- ✅ Responsive layout
- ✅ Profile stats (post count)
- ✅ Consistent with existing design system

## 🔗 API Endpoint:

```
GET /api/posts/user/:userId
Authorization: Bearer <token>

Response:
{
  "user": {
    "id": "uuid",
    "username": "john",
    "email": "john@example.com",
    "full_name": "John Doe",
    "bio": "Hello world!",
    "profile_picture": "url",
    "created_at": "timestamp"
  },
  "posts": [...],
  "post_count": 5
}
```

## 🚀 Next Steps:

আপনার browser এ `http://localhost:3000` এ গিয়ে test করুন!

Frontend এবং Backend দুটোই running আছে:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

**Note**: সব কাজ সম্পন্ন! এখন আপনি যেকোনো user এর profile দেখতে পারবেন তাদের username এ ক্লিক করে।
