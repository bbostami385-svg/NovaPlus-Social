# NovaPlus Social - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except auth) require Bearer token in Authorization header:
```
Authorization: Bearer <token>
```

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Posts](#posts)
4. [Videos](#videos)
5. [Reels](#reels)
6. [Stories](#stories)
7. [Messages](#messages)
8. [Groups](#groups)
9. [Notifications](#notifications)
10. [Search](#search)

---

## Authentication

### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe"
}

Response:
{
  "success": true,
  "token": "jwt_token",
  "user": { ... }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "jwt_token",
  "user": { ... }
}
```

### Firebase Google Login
```
POST /auth/google
Content-Type: application/json

{
  "firebaseToken": "firebase_id_token"
}

Response:
{
  "success": true,
  "token": "jwt_token",
  "user": { ... }
}
```

---

## Users

### Get User Profile
```
GET /users/:userId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "bio": "User bio",
    "profilePicture": "url",
    "coverPhoto": "url",
    "followersCount": 100,
    "followingCount": 50,
    "friendsCount": 75,
    "postsCount": 20,
    "videosCount": 5,
    "storiesCount": 3,
    "isOnline": true,
    "lastSeen": "2024-01-01T12:00:00Z"
  }
}
```

### Update Profile
```
PUT /users/profile/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "New bio",
  "profilePicture": "url",
  "coverPhoto": "url",
  "location": "New York",
  "website": "https://example.com"
}

Response:
{
  "success": true,
  "user": { ... }
}
```

### Follow User
```
POST /users/:userId/follow
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "User followed successfully"
}
```

### Unfollow User
```
POST /users/:userId/unfollow
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "User unfollowed successfully"
}
```

### Send Friend Request
```
POST /users/:userId/friend-request
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Friend request sent",
  "requestId": "request_id"
}
```

### Accept Friend Request
```
POST /friend-requests/:requestId/accept
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Friend request accepted"
}
```

### Get Friend Requests
```
GET /users/friend-requests?status=pending
Authorization: Bearer <token>

Response:
{
  "success": true,
  "requests": [ ... ]
}
```

### Search Users
```
GET /users/search?q=john&limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "users": [ ... ]
}
```

---

## Posts

### Create Post
```
POST /posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Post content",
  "images": ["url1", "url2"],
  "videos": ["url1"],
  "visibility": "public",
  "hashtags": ["tag1", "tag2"],
  "mentions": ["user_id1", "user_id2"]
}

Response:
{
  "success": true,
  "post": { ... }
}
```

### Get Feed
```
GET /posts/feed?page=1&limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "posts": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Get User Posts
```
GET /users/:userId/posts?page=1&limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "posts": [ ... ],
  "pagination": { ... }
}
```

### Like Post
```
POST /posts/:postId/like
Authorization: Bearer <token>

Response:
{
  "success": true,
  "likesCount": 10
}
```

### Unlike Post
```
POST /posts/:postId/unlike
Authorization: Bearer <token>

Response:
{
  "success": true,
  "likesCount": 9
}
```

### Add Comment
```
POST /posts/:postId/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Comment text",
  "parentCommentId": "comment_id" // optional for nested comments
}

Response:
{
  "success": true,
  "comment": { ... }
}
```

### Delete Post
```
DELETE /posts/:postId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Post deleted"
}
```

### Share Post
```
POST /posts/:postId/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Check this out!",
  "visibility": "public"
}

Response:
{
  "success": true,
  "post": { ... }
}
```

---

## Videos

### Upload Video
```
POST /videos/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "video": <file>,
  "thumbnail": <file>,
  "title": "Video Title",
  "description": "Video description",
  "category": "entertainment",
  "hashtags": ["tag1", "tag2"]
}

Response:
{
  "success": true,
  "video": { ... }
}
```

### Get Video
```
GET /videos/:videoId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "video": { ... }
}
```

### Get Channel Videos
```
GET /users/:userId/videos?page=1&limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "videos": [ ... ],
  "pagination": { ... }
}
```

### Like Video
```
POST /videos/:videoId/like
Authorization: Bearer <token>

Response:
{
  "success": true,
  "likesCount": 10
}
```

### Add Video Comment
```
POST /videos/:videoId/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Great video!"
}

Response:
{
  "success": true,
  "comment": { ... }
}
```

---

## Reels

### Upload Reel
```
POST /reels/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "video": <file>,
  "thumbnail": <file>,
  "caption": "Reel caption",
  "music": "music_url",
  "hashtags": ["tag1", "tag2"]
}

Response:
{
  "success": true,
  "reel": { ... }
}
```

### Get Reels Feed
```
GET /reels/feed?page=1&limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "reels": [ ... ],
  "pagination": { ... }
}
```

### Like Reel
```
POST /reels/:reelId/like
Authorization: Bearer <token>

Response:
{
  "success": true,
  "likesCount": 10
}
```

---

## Stories

### Upload Story
```
POST /stories/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "media": <file>,
  "mediaType": "image",
  "caption": "Story caption"
}

Response:
{
  "success": true,
  "story": { ... }
}
```

### Get Stories Feed
```
GET /stories/feed
Authorization: Bearer <token>

Response:
{
  "success": true,
  "stories": [ ... ]
}
```

### View Story
```
POST /stories/:storyId/view
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Story viewed"
}
```

---

## Messages

### Send Message
```
POST /messages/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": "user_id",
  "content": "Message content",
  "media": [ ... ]
}

Response:
{
  "success": true,
  "message": { ... }
}
```

### Get Conversation
```
GET /messages/conversation/:userId?page=1&limit=50
Authorization: Bearer <token>

Response:
{
  "success": true,
  "messages": [ ... ],
  "pagination": { ... }
}
```

### Mark as Read
```
POST /messages/:messageId/read
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Message marked as read"
}
```

### Delete Message
```
DELETE /messages/:messageId
Authorization: Bearer <token>
Content-Type: application/json

{
  "deleteForEveryone": false
}

Response:
{
  "success": true,
  "message": "Message deleted"
}
```

---

## Groups

### Create Group
```
POST /groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Group Name",
  "description": "Group description",
  "members": ["user_id1", "user_id2"],
  "groupType": "private"
}

Response:
{
  "success": true,
  "group": { ... }
}
```

### Get Group
```
GET /groups/:groupId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "group": { ... }
}
```

### Add Member
```
POST /groups/:groupId/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_id"
}

Response:
{
  "success": true,
  "message": "Member added"
}
```

### Remove Member
```
DELETE /groups/:groupId/members/:userId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Member removed"
}
```

---

## Notifications

### Get Notifications
```
GET /notifications?page=1&limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "notifications": [ ... ],
  "pagination": { ... }
}
```

### Mark as Read
```
POST /notifications/:notificationId/read
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Mark All as Read
```
POST /notifications/read-all
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## Search

### Search All
```
GET /search?q=query&type=all&limit=20
Authorization: Bearer <token>

Query Parameters:
- q: Search query
- type: all|users|posts|videos|reels|hashtags
- limit: Results limit

Response:
{
  "success": true,
  "results": {
    "users": [ ... ],
    "posts": [ ... ],
    "videos": [ ... ],
    "reels": [ ... ],
    "hashtags": [ ... ]
  }
}
```

---

## Socket.io Events

### Connection
```javascript
socket.emit('connect', { userId, token });
```

### Messaging
```javascript
// Send message
socket.emit('send_message', {
  receiverId: 'user_id',
  content: 'message',
  media: []
});

// Receive message
socket.on('receive_message', (message) => { ... });

// Typing
socket.emit('typing', { receiverId: 'user_id' });
socket.on('user_typing', (data) => { ... });
```

### Notifications
```javascript
socket.on('receive_notification', (notification) => { ... });
```

### Presence
```javascript
socket.on('user_online', (data) => { ... });
socket.on('user_offline', (data) => { ... });
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400,
  "errors": [ ... ] // optional
}
```

### Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 429: Too Many Requests
- 500: Internal Server Error

---

## Rate Limiting

- Default: 100 requests per 15 minutes
- Configurable via `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS`

---

## Pagination

All list endpoints support pagination:
```
?page=1&limit=20
```

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## File Upload

### Supported Formats
- Images: jpg, jpeg, png, gif, webp
- Videos: mp4, webm, avi, mov, mkv
- Max size: 50MB for images, 5GB for videos

### Upload Response
```json
{
  "success": true,
  "url": "https://cdn.example.com/file.jpg",
  "key": "uploads/file-id.jpg",
  "size": 1024000,
  "mimetype": "image/jpeg"
}
```

---

## Best Practices

1. Always include Authorization header for protected routes
2. Use pagination for list endpoints
3. Implement retry logic for failed requests
4. Cache responses when appropriate
5. Use Socket.io for real-time features
6. Handle errors gracefully on client side
7. Validate input data before sending
8. Use HTTPS in production
9. Implement exponential backoff for retries
10. Monitor API usage and rate limits

---

## Support

For issues or questions, please create an issue on GitHub or contact support@novaplus.com
