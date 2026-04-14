# NovaPlus Social - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Firebase Setup](#firebase-setup)
7. [Storage Configuration](#storage-configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Scaling & Performance](#scaling--performance)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Node.js v16+ (v18+ recommended)
- npm or yarn
- MongoDB 4.4+
- Redis 6.0+ (optional, for caching)
- Git

### Required Accounts
- MongoDB Atlas (or self-hosted MongoDB)
- Firebase Project
- Cloudflare R2 or AWS S3 account
- GitHub (for version control)

---

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/bbostami385-svg/NovaPlus-Social.git
cd NovaPlus-Social/backend
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server
PORT=5000
NODE_ENV=development
API_URL=http://localhost:5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/novaplus-social
MONGODB_DB_NAME=novaplus-social

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Storage
STORAGE_PROVIDER=r2
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=novaplus-social
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-public-url.com

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

### 4. Start MongoDB Locally
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or using MongoDB Community Edition
mongod
```

### 5. Start Development Server
```bash
npm run dev
```

Server will start at `http://localhost:5000`

---

## Production Deployment

### Option 1: Heroku Deployment

#### 1. Install Heroku CLI
```bash
npm install -g heroku
heroku login
```

#### 2. Create Heroku App
```bash
heroku create novaplus-social-api
```

#### 3. Add MongoDB Atlas
```bash
heroku addons:create mongolab:sandbox
# Or manually set MONGODB_URI
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
```

#### 4. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_production_secret
heroku config:set FIREBASE_PROJECT_ID=your-project-id
# ... set all other environment variables
```

#### 5. Deploy
```bash
git push heroku main
```

#### 6. View Logs
```bash
heroku logs --tail
```

---

### Option 2: Railway Deployment

#### 1. Connect GitHub
- Go to [railway.app](https://railway.app)
- Click "New Project"
- Select "Deploy from GitHub repo"

#### 2. Configure Environment
- Add environment variables in Railway dashboard
- Set `NODE_ENV=production`

#### 3. Deploy
- Railway will automatically deploy on push to main branch

---

### Option 3: AWS EC2 Deployment

#### 1. Launch EC2 Instance
```bash
# Ubuntu 20.04 LTS recommended
# Instance type: t3.medium or higher
```

#### 2. SSH into Instance
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

#### 3. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
sudo apt install -y mongodb

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### 4. Clone Repository
```bash
git clone https://github.com/bbostami385-svg/NovaPlus-Social.git
cd NovaPlus-Social/backend
npm install
```

#### 5. Setup Environment
```bash
cp .env.example .env
# Edit .env with production values
nano .env
```

#### 6. Start with PM2
```bash
pm2 start server.js --name "novaplus-api"
pm2 save
pm2 startup
```

#### 7. Setup Nginx Reverse Proxy
```bash
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/novaplus

# Add:
server {
    listen 80;
    server_name api.novaplus.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/novaplus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 8. Setup SSL with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.novaplus.com
```

---

### Option 4: Docker Deployment

#### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

#### 2. Create docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/novaplus-social
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
    restart: always

  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: always

volumes:
  mongo_data:
```

#### 3. Build and Run
```bash
docker-compose up -d
```

---

## Environment Configuration

### Development Environment
```env
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
```

### Production Environment
```env
NODE_ENV=production
DEBUG=false
LOG_LEVEL=info
```

### Critical Variables
- `JWT_SECRET`: Use strong, random string (min 32 characters)
- `MONGODB_URI`: Use connection string with authentication
- `FIREBASE_PRIVATE_KEY`: Keep secure, never commit to repo
- `R2_SECRET_ACCESS_KEY`: Keep secure, use environment variables

---

## Database Setup

### MongoDB Atlas Setup

1. Create account at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create new cluster
3. Add IP whitelist (0.0.0.0/0 for development, specific IPs for production)
4. Create database user
5. Get connection string
6. Set `MONGODB_URI` environment variable

### Database Indexes
```bash
# Create indexes for better performance
npm run db:create-indexes
```

### Backup Strategy
```bash
# Automated daily backups
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/db" --out=/backups/$(date +%Y%m%d)
```

---

## Firebase Setup

### 1. Create Firebase Project
- Go to [firebase.google.com](https://firebase.google.com)
- Click "Add project"
- Enable Authentication (Google Sign-in)

### 2. Generate Service Account Key
- Go to Project Settings > Service Accounts
- Click "Generate New Private Key"
- Download JSON file

### 3. Extract Credentials
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk@your-project.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### 4. Set Environment Variables
```bash
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_PRIVATE_KEY="your-private-key"
export FIREBASE_CLIENT_EMAIL="your-client-email"
```

---

## Storage Configuration

### Cloudflare R2 Setup

1. Create R2 bucket at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Generate API token
3. Set environment variables:
```env
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=novaplus-social
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-public-url.com
```

### AWS S3 Setup

1. Create S3 bucket
2. Create IAM user with S3 access
3. Set environment variables:
```env
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket
```

### Google Cloud Storage Setup (Future Migration)
```env
STORAGE_PROVIDER=gcs
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket
GCS_KEY_FILE=/path/to/keyfile.json
```

---

## Monitoring & Logging

### PM2 Monitoring
```bash
pm2 monit
pm2 logs
```

### Application Logging
```bash
# View logs
tail -f logs/app.log

# Rotate logs
npm run logs:rotate
```

### Error Tracking (Sentry)
```bash
npm install @sentry/node
```

```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Performance Monitoring
- Use New Relic or DataDog
- Monitor database query performance
- Track API response times
- Monitor memory and CPU usage

---

## Scaling & Performance

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Deploy multiple instances
- Use session store (Redis) for shared state

### Caching Strategy
- Implement Redis caching
- Cache user profiles
- Cache feed data
- Set appropriate TTLs

### Database Optimization
- Create proper indexes
- Use connection pooling
- Archive old data
- Monitor slow queries

### CDN Configuration
- Serve media files through CDN
- Cache static assets
- Compress responses

---

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```bash
# Check connection string
# Verify IP whitelist
# Check credentials
# Test connection: mongo "your-connection-string"
```

#### 2. Firebase Authentication Error
```bash
# Verify service account key
# Check Firebase project ID
# Ensure authentication is enabled
```

#### 3. Storage Upload Failed
```bash
# Check R2/S3 credentials
# Verify bucket exists
# Check file size limits
# Verify CORS configuration
```

#### 4. High Memory Usage
```bash
# Check for memory leaks
# Implement garbage collection
# Monitor with: node --max-old-space-size=4096 server.js
```

#### 5. Slow API Response
```bash
# Add database indexes
# Implement caching
# Optimize queries
# Use pagination
```

### Debug Mode
```bash
DEBUG=* npm start
```

### Health Check
```bash
curl http://localhost:5000/health
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable HTTPS/SSL
- [ ] Set strong JWT secret
- [ ] Enable CORS properly
- [ ] Implement rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable database authentication
- [ ] Setup firewall rules
- [ ] Regular security updates
- [ ] Implement API authentication
- [ ] Use HTTPS for all communications
- [ ] Enable request validation
- [ ] Implement input sanitization
- [ ] Setup monitoring and alerts
- [ ] Regular backups

---

## Performance Optimization

- Use caching (Redis)
- Implement pagination
- Optimize database queries
- Use CDN for media
- Compress responses
- Implement lazy loading
- Use connection pooling
- Monitor and profile

---

## Maintenance

### Regular Tasks
- Monitor logs
- Check disk space
- Update dependencies
- Backup database
- Review performance metrics
- Update security patches

### Monthly Tasks
- Review API usage
- Optimize slow queries
- Update documentation
- Test disaster recovery
- Review security logs

---

## Support

For deployment issues, check:
- GitHub Issues
- Documentation
- Community Forums
- Contact support@novaplus.com
