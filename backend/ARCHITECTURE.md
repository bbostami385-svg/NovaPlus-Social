# NovaPlus Social - Architecture Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Applications                          │
│              (Web, Mobile, Desktop, Admin)                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   API Gateway│
                    │ (Nginx/Load │
                    │  Balancer)  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐        ┌────▼────┐       ┌────▼────┐
   │ Server  │        │ Server  │       │ Server  │
   │Instance │        │Instance │       │Instance │
   │  Port   │        │  Port   │       │  Port   │
   │  5000   │        │  5000   │       │  5000   │
   └────┬────┘        └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐        ┌────▼────┐       ┌────▼────┐
   │ MongoDB │        │  Redis  │       │Firebase │
   │ Cluster │        │ Cache   │       │  Auth   │
   └─────────┘        └─────────┘       └─────────┘
        │
   ┌────▼────┐
   │Cloudflare│
   │   R2     │
   │ Storage  │
   └──────────┘
```

## Clean Architecture Layers

### 1. **Presentation Layer** (Routes)
- HTTP endpoints
- Request validation
- Response formatting
- Error handling

### 2. **Controller Layer**
- Request handling
- Input validation
- Service orchestration
- Response preparation

### 3. **Service Layer** (Business Logic)
- Core business logic
- Data transformation
- External API calls
- Notification creation

### 4. **Repository/Data Layer** (Models)
- MongoDB schemas
- Database operations
- Data validation
- Relationships

### 5. **Infrastructure Layer**
- Database connection
- Firebase setup
- Storage configuration
- Socket.io setup

## Module Structure

### Core Modules

#### **User Module**
```
User Management
├── Authentication (Firebase OAuth, JWT)
├── Profile Management
├── Follow/Unfollow System
├── Friend Requests
├── User Search
└── Online Status Tracking
```

#### **Post Module**
```
Social Feed
├── Create/Edit/Delete Posts
├── Like/Unlike System
├── Comments (Nested)
├── Share Posts
├── Save Posts
└── Feed Algorithm
```

#### **Video Module**
```
Long-form Videos (YouTube-style)
├── Video Upload & Processing
├── Streaming Support
├── Metadata Management
├── View Tracking
├── Comments & Likes
└── Channel Management
```

#### **Reel Module**
```
Short Videos (TikTok-style)
├── Reel Upload
├── Vertical Scroll Feed
├── Music Integration
├── Effects Support
├── Engagement Tracking
└── Discovery Algorithm
```

#### **Story Module**
```
24-Hour Stories (Instagram-style)
├── Story Upload
├── Auto-expiration
├── View Tracking
├── Reactions
└── Story Carousel
```

#### **Messaging Module**
```
Real-time Chat
├── 1-to-1 Messaging
├── Group Chat
├── Message Status (sent/delivered/read)
├── Typing Indicators
├── Media Sharing
└── Message Reactions
```

#### **Notification Module**
```
Real-time Notifications
├── Like Notifications
├── Comment Notifications
├── Message Notifications
├── Follow Notifications
├── Multi-channel Delivery
└── Notification Preferences
```

## Data Flow

### Creating a Post
```
1. Client sends POST /api/posts
   ↓
2. Route handler validates request
   ↓
3. Controller receives request
   ↓
4. Service layer processes data
   ├─ Create post in DB
   ├─ Upload media to S3/R2
   ├─ Extract hashtags
   ├─ Create mentions
   └─ Update user stats
   ↓
5. Create notifications for mentions
   ↓
6. Emit Socket.io event to followers
   ↓
7. Return response to client
```

### Real-time Messaging
```
1. Client emits 'send_message' via Socket.io
   ↓
2. Socket handler validates user
   ↓
3. MessageService processes message
   ├─ Save to DB
   ├─ Upload media if present
   └─ Update conversation
   ↓
4. Emit 'receive_message' to recipient
   ↓
5. Create notification
   ↓
6. Update message status (delivered)
   ↓
7. Recipient marks as read
```

## Database Schema Relationships

```
User
├── followers (User[])
├── following (User[])
├── friends (User[])
├── blockedUsers (User[])
├── posts (Post[])
├── videos (Video[])
├── reels (Reel[])
├── stories (Story[])
└── notifications (Notification[])

Post
├── author (User)
├── comments (Comment[])
├── likes (User[])
├── shares (User[])
├── saves (User[])
└── mentions (User[])

Comment
├── post (Post)
├── author (User)
├── parentComment (Comment)
├── replies (Comment[])
└── likes (User[])

Video
├── channel (User)
├── comments (Comment[])
├── likes (User[])
└── views (User[])

Reel
├── creator (User)
├── comments (Comment[])
├── likes (User[])
└── views (User[])

Story
├── user (User)
├── views (User[])
└── reactions (User[])

Message
├── sender (User)
├── receiver (User)
├── group (Group)
└── reactions (User[])

Group
├── creator (User)
├── admins (User[])
├── members (User[])
├── bannedMembers (User[])
└── messages (Message[])

Notification
├── recipient (User)
├── actor (User)
├── relatedPost (Post)
├── relatedVideo (Video)
├── relatedReel (Reel)
├── relatedMessage (Message)
└── relatedGroup (Group)

FriendRequest
├── sender (User)
└── receiver (User)
```

## API Request/Response Flow

### Request Flow
```
HTTP Request
    ↓
CORS Middleware
    ↓
Rate Limiting
    ↓
Body Parser
    ↓
Route Handler
    ↓
Authentication Middleware
    ↓
Controller
    ↓
Service Layer
    ↓
Database/External APIs
    ↓
Response Preparation
    ↓
HTTP Response
```

### Error Handling Flow
```
Error Occurs
    ↓
Error Handler Middleware
    ↓
Error Classification
├─ Validation Error (400)
├─ Authentication Error (401)
├─ Authorization Error (403)
├─ Not Found Error (404)
├─ Conflict Error (409)
├─ Rate Limit Error (429)
└─ Server Error (500)
    ↓
Error Response
    ↓
HTTP Response
```

## Storage Architecture

### Storage Abstraction Layer
```
Application Code
    ↓
Storage Interface
    ├─ uploadFile()
    ├─ deleteFile()
    ├─ getFileUrl()
    └─ listFiles()
    ↓
Storage Provider
├─ Cloudflare R2
├─ AWS S3
└─ Google Cloud Storage
```

### File Organization
```
S3/R2 Bucket
├── uploads/
│   ├── posts/
│   ├── videos/
│   ├── reels/
│   ├── stories/
│   ├── profiles/
│   └── messages/
├── thumbnails/
├── processed/
└── archives/
```

## Real-time Communication (Socket.io)

### Connection Management
```
Client connects
    ↓
Verify JWT token
    ↓
Store connection mapping
    ↓
Emit 'user_online' event
    ↓
Broadcast to other users
```

### Message Flow
```
Client emits 'send_message'
    ↓
Validate user & message
    ↓
Save to database
    ↓
Emit 'receive_message' to recipient
    ↓
Emit 'message_delivered' to sender
    ↓
Recipient marks as read
    ↓
Emit 'message_read' to sender
```

## Authentication Flow

### Firebase OAuth
```
Client initiates Google login
    ↓
Firebase handles OAuth
    ↓
Client receives Firebase ID token
    ↓
Client sends token to backend
    ↓
Backend verifies with Firebase
    ↓
Backend creates JWT token
    ↓
Backend returns JWT to client
    ↓
Client stores JWT for API calls
```

### JWT Token Usage
```
Client includes JWT in Authorization header
    ↓
Backend extracts token
    ↓
Backend verifies signature
    ↓
Backend extracts user info
    ↓
Attach user to request object
    ↓
Proceed with request
```

## Scalability Considerations

### Horizontal Scaling
```
Load Balancer
    ├─ Server 1
    ├─ Server 2
    ├─ Server 3
    └─ Server N
        ↓
    Shared Resources
    ├─ MongoDB Replica Set
    ├─ Redis Cluster
    ├─ S3/R2 Storage
    └─ Firebase
```

### Caching Strategy
```
Request
    ↓
Check Redis Cache
├─ Cache Hit → Return cached data
└─ Cache Miss
    ↓
    Query Database
    ↓
    Store in Cache (TTL)
    ↓
    Return data
```

### Database Optimization
```
Indexes
├─ User: email, username, firebaseUid
├─ Post: author, createdAt, visibility
├─ Message: sender, receiver, createdAt
├─ Video: channel, createdAt, category
└─ Notification: recipient, isRead, createdAt

Aggregation Pipeline
├─ User feed generation
├─ Trending content
├─ Analytics
└─ Recommendations
```

## Deployment Architecture

### Production Environment
```
Domain (api.novaplus.com)
    ↓
CDN (Cloudflare)
    ↓
Load Balancer (Nginx)
    ├─ Server 1 (5000)
    ├─ Server 2 (5001)
    └─ Server 3 (5002)
        ↓
    Shared Services
    ├─ MongoDB Atlas
    ├─ Redis Cloud
    ├─ Firebase
    └─ Cloudflare R2
```

### CI/CD Pipeline
```
Git Push
    ↓
GitHub Actions
    ├─ Run Tests
    ├─ Lint Code
    ├─ Build Docker Image
    └─ Push to Registry
        ↓
    Deploy to Production
    ├─ Update containers
    ├─ Run migrations
    └─ Health check
```

## Security Architecture

### Request Security
```
HTTPS/TLS
    ↓
CORS Validation
    ↓
Rate Limiting
    ↓
Input Validation
    ↓
Authentication
    ↓
Authorization
    ↓
Request Processing
```

### Data Security
```
User Input
    ↓
Sanitization
    ↓
Validation
    ↓
Encryption (if sensitive)
    ↓
Database Storage
```

### API Security
```
API Key/JWT Token
    ↓
Signature Verification
    ↓
Expiration Check
    ↓
Scope Validation
    ↓
Rate Limiting
    ↓
Request Processing
```

## Monitoring & Observability

### Logging
```
Application Logs
    ├─ Request logs
    ├─ Error logs
    ├─ Database logs
    └─ Socket.io logs
        ↓
    Log Aggregation (ELK/Splunk)
        ↓
    Analysis & Alerts
```

### Metrics
```
Performance Metrics
├─ API response time
├─ Database query time
├─ Memory usage
├─ CPU usage
└─ Request count
    ↓
    Monitoring Dashboard (Grafana/DataDog)
    ↓
    Alerts & Notifications
```

## Performance Optimization

### Query Optimization
- Database indexing
- Query projection
- Pagination
- Aggregation pipelines

### Caching Strategy
- Redis for user sessions
- Cache feed data
- Cache user profiles
- Cache search results

### Asset Optimization
- Image compression
- Video transcoding
- CDN distribution
- Lazy loading

## Disaster Recovery

### Backup Strategy
```
Production Database
    ↓
Daily Snapshots
    ├─ Stored in S3
    ├─ Replicated to secondary region
    └─ Retention: 30 days
        ↓
    Recovery Procedure
    ├─ Restore from latest backup
    ├─ Verify data integrity
    └─ Notify users
```

### High Availability
```
Primary Server
    ↓
Replica Server (Standby)
    ↓
Automatic Failover
    ├─ Health checks
    ├─ Automatic switchover
    └─ No data loss
```

---

This architecture is designed to be scalable, maintainable, and production-ready, supporting millions of users while maintaining high performance and reliability.
