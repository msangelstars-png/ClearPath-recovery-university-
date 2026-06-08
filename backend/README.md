# ClearPath Backend API

Backend API for ClearPath Recovery University platform with two main services:
1. **User & Authentication Service** - User management and auth
2. **Content & Resources Service** - Courses and learning resources

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **Authentication:** JWT
- **Password Hashing:** bcryptjs

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB Atlas account
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB URI and JWT secret:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/clearpath
JWT_SECRET=your_secret_key_here
PORT=5000
```

### Running Locally

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication API
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### User API (API #1)
- `GET /api/v1/users/:id` - Get user profile
- `PUT /api/v1/users/:id` - Update profile
- `POST /api/v1/users/:id/enroll` - Enroll in course
- `GET /api/v1/users` - Get all users (Admin only)

### Course API (API #2)
- `GET /api/v1/courses` - Get all courses
- `GET /api/v1/courses/:id` - Get course details
- `POST /api/v1/courses` - Create course (Instructor)
- `PUT /api/v1/courses/:id` - Update course (Instructor)
- `DELETE /api/v1/courses/:id` - Delete course (Instructor)

### Resource API (API #2)
- `GET /api/v1/resources` - Get all resources
- `GET /api/v1/resources/:id` - Get resource details
- `POST /api/v1/resources` - Create resource (Instructor)
- `PUT /api/v1/resources/:id` - Update resource (Admin)
- `DELETE /api/v1/resources/:id` - Delete resource (Admin)

## Models

### User
- name, email, password (hashed)
- role (user, instructor, admin)
- profile info (bio, avatar)
- progress tracking
- enrolled courses

### Course
- title, description
- instructor reference
- category, level, duration
- modules with content
- enrollment count
- rating and pricing

### Resource
- title, description
- type (article, video, document, link, tool)
- category and tags
- course association
- approval status

## Security Features

✅ Password hashing with bcryptjs
✅ JWT token authentication
✅ Role-based access control
✅ CORS protection
✅ Error handling middleware

## License

ISC
