# Mini Social Media Application

A full-stack social media application built with React, Node.js, and Supabase.

## Features

- 🔐 User authentication (Signup/Login)
- 📝 Create and share posts
- 👥 View posts from all users
- 🗑️ Delete your own posts
- 📱 Responsive design
- ✨ Modern UI with smooth animations

## Project Structure

```
minisoso/
├── backend/          # Node.js Express server
│   ├── routes/       # API routes
│   ├── middleware/   # Authentication middleware
│   ├── server.js     # Main server file
│   ├── package.json
│   └── .env          # Environment variables
├── frontend/         # React application
│   ├── public/
│   ├── src/
│   │   ├── pages/    # Login, Signup, Feed pages
│   │   ├── styles/   # CSS files
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env          # Environment variables
└── database/         # Supabase SQL schema
    └── schema.sql
```

## Setup Instructions

### 1. Supabase Setup

1. Go to [Supabase](https://app.supabase.com) and create a new project
2. Once your project is ready, go to **SQL Editor**
3. Copy the contents of `database/schema.sql` and run it in the SQL Editor
4. Go to **Settings** → **API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   PORT=5000
   JWT_SECRET=your_random_secret_key_here
   ```

4. Start the server:
   ```bash
   npm start
   ```

   The backend will run on `http://localhost:5000`

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. The `.env` file is already configured to connect to `http://localhost:5000`

4. Start the development server:
   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000`

## Usage

1. **Sign Up**: Create a new account with username, email, and password
2. **Login**: Log in with your credentials
3. **Create Posts**: Share your thoughts on the feed
4. **View Posts**: See posts from all users in real-time
5. **Delete Posts**: Remove your own posts
6. **Logout**: Click the logout button to sign out

## Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Supabase** - PostgreSQL database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Modern styling with gradients and animations

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login to account
- `GET /api/auth/me` - Get current user (protected)

### Posts
- `GET /api/posts` - Get all posts (protected)
- `POST /api/posts` - Create new post (protected)
- `DELETE /api/posts/:id` - Delete post (protected)

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Row-level security in Supabase
- CORS protection
- Input validation

## Development

For development with auto-reload:

**Backend:**
```bash
npm run dev
```

**Frontend:**
```bash
npm start
```

## License

ISC
