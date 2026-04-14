# NovaPlus Social - Backend API

A production-ready, scalable social media platform backend combining features from Facebook, Instagram, YouTube, WhatsApp, and Messenger.

## 🚀 Features

### Core Features
- **User System**: Registration, authentication, profiles, follow/friend system
- **Posts**: Create, like, comment, share posts with media support
- **Videos**: YouTube-style long-form video upload and streaming
- **Reels**: TikTok/Instagram-style short videos with vertical scroll
- **Stories**: 24-hour expiring stories with view tracking
- **Messaging**: Real-time 1-to-1 and group chat with Socket.io
- **Notifications**: Real-time notifications for all interactions
- **Search**: Full-text search for users, posts, videos, and content

### Technical Features
- **Clean Architecture**: Controllers, Services, Models, Routes
- **Real-time Communication**: Socket.io for live messaging and notifications
- **Storage Abstraction**: Support for Cloudflare R2, AWS S3, Google Cloud Storage
- **Firebase Authentication**: Google OAuth integration
- **JWT Tokens**: Secure API authentication
- **Rate Limiting**: Built-in request throttling
- **Error Handling**: Comprehensive error management
- **Pagination**: Efficient data fetching
- **Indexing**: MongoDB indexes for fast queries

## 🛠 Tech Stack

- **Runtime**: Node.js v16+
- **Framework**: Express.js
- **Database**: MongoDB
- **Real-time**: Socket.io
- **Authentication**: Firebase Admin SDK + JWT
- **Storage**: Cloudflare R2 / AWS S3
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx

## 📋 Prerequisites

- Node.js v16+ (v18+ recommended)
- MongoDB 4.4+
- npm or yarn
- Firebase Project
- Cloudflare R2 or AWS S3 account

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/bbostami385-svg/NovaPlus-Social.git
cd NovaPlus-Social/backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configuration
nano .env
```

### 4. Start Development Server
```bash
npm run dev
```

Server will start at `http://localhost:5000`

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API endpoints.

### Quick API Examples

#### Create Post
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello world!",
    "visibility": "public"
  }'
```

#### Send Message
```bash
curl -X POST http://localhost:5000/api/messages/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "user_id",
    "content": "Hello!"
  }'
```

#### Get Feed
```bash
curl -X GET "http://localhost:5000/api/posts/feed?page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

## 🗂 Project Structure

```
backend/
├── config/              # Configuration files
│   ├── database.js     # MongoDB connection
│   ├── firebase.js     # Firebase setup
│   ├── socket.js       # Socket.io configuration
│   └── storage.js      # Storage abstraction layer
├── models/             # MongoDB schemas
│   ├── User.js
│   ├── Post.js
│   ├── Comment.js
│   ├── Video.js
│   ├── Reel.js
│   ├── Story.js
│   ├── Message.js
│   ├── Group.js
│   ├── Notification.js
│   └── FriendRequest.js
├── services/           # Business logic
│   ├── UserService.js
│   ├── PostService.js
│   ├── MessageService.js
│   └── ... more services
├── controllers/        # Route handlers (to be created)
├── routes/            # API routes (to be created)
├── middleware/        # Express middleware
│   ├── auth.js
│   └── errorHandler.js
├── utils/             # Utility functions (to be created)
├── constants/         # Constants (to be created)
├── server.js          # Main server file
├── package.json       # Dependencies
├── .env.example       # Environment template
├── API_DOCUMENTATION.md
├── DEPLOYMENT_GUIDE.md
└── README.md
```

## 🔐 Environment Variables

See `.env.example` for all available variables. Key variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# Authentication
JWT_SECRET=your_secret_key
FIREBASE_PROJECT_ID=your-project-id

# Storage
STORAGE_PROVIDER=r2
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🗄 Database Models

### User
- Profile information (name, bio, avatar, cover photo)
- Online status and last seen
- Followers, following, friends lists
- Account preferences and settings

### Post
- Content, images, videos
- Likes, comments, shares
- Hashtags and mentions
- Visibility settings

### Video
- Long-form video storage
- Metadata (title, description, duration)
- View count and engagement metrics
- Processing status

### Reel
- Short-form video (TikTok-style)
- Music/audio support
- Vertical scroll optimization
- Engagement tracking

### Story
- 24-hour expiring media
- View tracking
- Reactions and replies
- Auto-deletion

### Message
- 1-to-1 and group messaging
- Message status (sent, delivered, read)
- Media attachments
- Edit history

### Notification
- Multiple notification types
- Multi-channel delivery (in-app, email, push, SMS)
- Read/unread status
- Priority levels

## 🔌 Socket.io Events

### Messaging
```javascript
// Send message
socket.emit('send_message', { receiverId, content, media });

// Receive message
socket.on('receive_message', (message) => { ... });

// Typing indicator
socket.emit('typing', { receiverId });
socket.on('user_typing', (data) => { ... });
```

### Presence
```javascript
socket.on('user_online', (data) => { ... });
socket.on('user_offline', (data) => { ... });
```

### Notifications
```javascript
socket.on('receive_notification', (notification) => { ... });
```

## 📊 Scalability

### Horizontal Scaling
- Stateless API design
- Session store with Redis
- Load balancer (Nginx/HAProxy)
- Multiple server instances

### Performance Optimization
- Database indexing
- Query optimization
- Caching strategy (Redis)
- CDN for media files
- Response compression

### Monitoring
- Error tracking (Sentry)
- Performance monitoring (New Relic/DataDog)
- Log aggregation (ELK Stack)
- Uptime monitoring

## 🚀 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deployment Options
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub and deploy
- **AWS EC2**: Manual setup with PM2
- **Docker**: `docker-compose up -d`

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- --testNamePattern="User"
```

## 📝 API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth login

### Users
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/profile/update` - Update profile
- `POST /api/users/:userId/follow` - Follow user
- `GET /api/users/search` - Search users

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts/feed` - Get feed
- `POST /api/posts/:postId/like` - Like post
- `POST /api/posts/:postId/comments` - Add comment

### Videos
- `POST /api/videos/upload` - Upload video
- `GET /api/videos/:videoId` - Get video
- `POST /api/videos/:videoId/like` - Like video

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/conversation/:userId` - Get conversation
- `POST /api/messages/:messageId/read` - Mark as read

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications/:notificationId/read` - Mark as read

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- Check existing documentation
- Contact: support@novaplus.com

## 🎯 Roadmap

- [ ] Complete API endpoints implementation
- [ ] Add comprehensive test coverage
- [ ] Implement video processing pipeline
- [ ] Add advanced analytics
- [ ] Implement recommendation algorithm
- [ ] Add payment integration (Stripe)
- [ ] Implement content moderation
- [ ] Add admin dashboard
- [ ] Implement backup and recovery
- [ ] Add API rate limiting per user tier

## 👥 Team

- **Lead Developer**: [Your Name]
- **Contributors**: [List of contributors]

## 🙏 Acknowledgments

- MongoDB for database
- Firebase for authentication
- Cloudflare for R2 storage
- Socket.io for real-time communication

---

**Made with ❤️ by the NovaPlus Team**
