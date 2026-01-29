# Image Upload Feature - Setup Guide

## 🎉 Feature Added

Posts এ এখন image upload করা যাবে! Instagram-style UI সহ।

---

## 📋 Setup Required

### 1. Database Migration

Supabase SQL Editor এ যান এবং এই SQL run করুন:

```sql
-- Add image_url column to posts table
ALTER TABLE posts 
ADD COLUMN image_url TEXT;
```

### 2. Create Supabase Storage Bucket

1. Supabase Dashboard → **Storage** এ যান
2. **Create a new bucket** click করুন
3. Bucket name: `post-images`
4. **Public bucket** চেক করুন (যাতে images publicly accessible হয়)
5. **Create bucket** click করুন

### 3. Set Storage Policies (Optional but Recommended)

Storage bucket এর policies set করতে:

1. `post-images` bucket এ click করুন
2. **Policies** tab এ যান
3. এই policies add করুন:

**Allow authenticated users to upload:**
```sql
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');
```

**Allow everyone to view images:**
```sql
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-images');
```

**Allow users to delete their own images:**
```sql
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🎨 Features

### Frontend:
- ✅ Photo upload button with icon
- ✅ Image preview before posting
- ✅ Remove image button
- ✅ 5MB file size limit
- ✅ Image type validation
- ✅ Instagram-style image display in posts
- ✅ Responsive design

### Backend:
- ✅ Multer middleware for file handling
- ✅ Supabase Storage integration
- ✅ Automatic file naming
- ✅ User-specific folders (organized by user_id)
- ✅ Public URL generation
- ✅ Error handling

---

## 🧪 Testing

1. **Start both servers:**
   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend
   cd frontend
   npm run dev
   ```

2. **Create a post with image:**
   - Click "Photo" button
   - Select an image (max 5MB)
   - See preview
   - Write caption
   - Click "Post"

3. **Verify:**
   - Image should appear in the post
   - Image should be stored in Supabase Storage
   - Check `post-images` bucket in Supabase

---

## 📁 File Structure

```
backend/
  routes/
    posts.js          # Updated with image upload
  package.json        # Added multer dependency

frontend/
  src/
    pages/
      Feed.jsx        # Image upload UI
    styles/
      App.css         # Image styles

database/
  add_image_support.sql  # Migration file
```

---

## 🔧 Technical Details

### Image Upload Flow:

1. **Frontend:** User selects image → Preview shown
2. **Frontend:** Form submitted as `multipart/form-data`
3. **Backend:** Multer processes file in memory
4. **Backend:** Upload to Supabase Storage bucket
5. **Backend:** Get public URL
6. **Backend:** Save URL in database
7. **Frontend:** Display image in post

### File Naming:
- Format: `{user_id}/{timestamp}-{random}.{ext}`
- Example: `abc123/1706567890-x7k2p9.jpg`

### Storage Organization:
```
post-images/
  ├── user-id-1/
  │   ├── 1706567890-x7k2p9.jpg
  │   └── 1706567891-a3m5n8.png
  └── user-id-2/
      └── 1706567892-b4n6o9.jpg
```

---

## ⚠️ Important Notes

1. **Bucket must be PUBLIC** - Otherwise images won't display
2. **Run SQL migration** - `image_url` column required
3. **File size limit** - 5MB (configurable in `posts.js`)
4. **Supported formats** - All image types (jpg, png, gif, webp, etc.)

---

## 🚀 Deployment Notes

When deploying to production:

1. Ensure Supabase Storage bucket is created
2. Set proper CORS policies if needed
3. Consider adding image optimization
4. Monitor storage usage

---

## 🎯 Future Enhancements

Possible improvements:
- Image compression before upload
- Multiple images per post
- Image editing (crop, filter)
- Drag & drop upload
- Progress bar for upload
- Image lazy loading

---

Changes committed and pushed to GitHub! 🎉
