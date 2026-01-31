# Stories Feature Setup

## Database Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the content from backend/database/stories_schema.sql
```

Or manually execute:
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the content from `backend/database/stories_schema.sql`
4. Paste and run it

## Features

### Instagram-Style Stories
- ✅ 24-hour auto-expiring stories
- ✅ Horizontal scrolling story bar
- ✅ Gradient ring for unviewed stories
- ✅ Gray ring for viewed stories
- ✅ Story progress indicators
- ✅ Create story with image upload
- ✅ View stories in full-screen modal
- ✅ Navigate between stories (prev/next)
- ✅ Delete your own stories
- ✅ View count tracking
- ✅ Automatic story expiration after 24 hours

### User Experience
- Stories appear at the top of the feed
- Your story appears first with "Add Story" button
- Unviewed stories have colorful gradient ring
- Viewed stories have gray ring
- Click any story to view in full-screen
- Swipe/click to navigate between stories
- Stories automatically move to next user after viewing all

## API Endpoints

- `GET /api/stories` - Get all active stories
- `POST /api/stories` - Create a new story (with image upload)
- `POST /api/stories/:storyId/view` - Mark story as viewed
- `DELETE /api/stories/:storyId` - Delete a story
- `GET /api/stories/:storyId/viewers` - Get story viewers (owner only)

## File Structure

```
backend/
├── database/
│   └── stories_schema.sql       # Database schema
├── routes/
│   └── stories.js               # API routes
└── uploads/
    └── stories/                 # Story images storage

frontend/
├── components/
│   └── Stories.jsx              # Stories component
└── styles/
    └── Stories.css              # Stories styling
```

## Usage

1. Run the database schema in Supabase
2. Backend server will automatically serve the stories API
3. Stories component is already integrated in the Feed page
4. Users can create stories by clicking "Your Story"
5. Stories expire automatically after 24 hours

## Notes

- Maximum image size: 10MB
- Supported formats: JPEG, JPG, PNG, GIF, WebP
- Stories are stored in `backend/uploads/stories/`
- Expired stories are automatically deleted from database
- Story views are tracked per user
