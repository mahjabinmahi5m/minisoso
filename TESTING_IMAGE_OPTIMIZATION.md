# Testing Image Optimization - Quick Guide

## 🧪 How to Test

### Test 1: Profile Picture Optimization

1. **Login to your app** at `http://localhost:5173`

2. **Go to Profile Settings** (click your avatar/username)

3. **Upload a profile picture**:
   - Choose a large image (e.g., 2-3 MB PNG or JPG)
   - Click upload/save

4. **Verify optimization**:
   - Open browser DevTools → Network tab
   - Look for the uploaded image request
   - Check the image size in Supabase Storage
   - Should be ~100-300 KB (much smaller!)
   - Image should be 400x400px JPEG

### Test 2: Post Image Optimization

1. **Create a new post** in the Feed

2. **Click the Photo button** 📷

3. **Select a large image** (e.g., 3-5 MB)

4. **Post it**

5. **Verify optimization**:
   - Image should upload quickly (1-2 seconds)
   - Check Network tab in DevTools
   - Image should be much smaller (~200-500 KB)
   - Max dimensions: 1200x1200px
   - Format: JPEG

---

## 🔍 How to Check in Supabase

1. **Go to Supabase Dashboard**
2. **Navigate to Storage** → `minisoso` bucket
3. **Check file sizes**:
   - Profile pictures: `profiles/{user_id}/profile.jpg`
   - Post images: `{user_id}/{timestamp}-{random}.jpg`
4. **All should be JPEG format**
5. **File sizes should be significantly reduced**

---

## ✅ Expected Results

### Before Optimization:
- 3 MB PNG image → 3 MB uploaded
- Upload time: 8-12 seconds
- Format: Original (PNG/JPG/etc.)

### After Optimization:
- 3 MB PNG image → ~300-500 KB JPEG
- Upload time: 1-2 seconds
- Format: Always JPEG
- Quality: Excellent (barely noticeable difference)

---

## 🎯 What to Look For

✅ **Fast uploads** - Should be noticeably quicker  
✅ **Smaller file sizes** - Check in Network tab or Supabase  
✅ **JPEG format** - All images converted to .jpg  
✅ **Good quality** - Images should still look great  
✅ **Consistent sizes** - Profile pics 400x400, posts max 1200x1200  

---

## 🐛 Troubleshooting

### If optimization isn't working:

1. **Check backend is running**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Verify sharp is installed**:
   ```bash
   cd backend
   npm list sharp
   ```
   Should show: `sharp@0.34.5`

3. **Check for errors** in backend terminal

4. **Clear browser cache** and try again

---

## 📊 Quick Comparison Test

Try this:
1. Upload the same image as profile picture
2. Check file size in Supabase Storage
3. Upload same image as post
4. Compare sizes

Both should be:
- ✅ Much smaller than original
- ✅ JPEG format
- ✅ Good quality

---

**Ready to test!** 🚀

The optimization is already running on your backend server.
Just upload some images and see the magic happen! ✨
