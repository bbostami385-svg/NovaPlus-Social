# NovaPlus Social - Production Setup Guide

## 🚀 Complete Deployment Instructions

This guide covers setting up your NovaPlus Social platform on Render (Backend) and Vercel (Frontend).

---

## Part 1: Backend Setup on Render

### Step 1: Prepare Your Backend

1. **Ensure all files are committed to GitHub:**
```bash
cd backend
git add -A
git commit -m "feat: Complete backend API with all routes"
git push origin main
```

2. **Verify package.json has correct scripts:**
```json
{
  "scripts": {
    "dev": "node --watch server.js",
    "start": "node server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

### Step 2: Deploy to Render

1. **Go to [render.com](https://render.com) and sign up/login**

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `NovaPlus-Social` repository
   - Choose branch: `main`

3. **Configure Service:**
   - **Name:** `novaplus-social-api`
   - **Runtime:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Standard ($7/month)

4. **Add Environment Variables:**

Click "Environment" and add these variables:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
FIREBASE_PROJECT_ID=<your-firebase-project-id>
FIREBASE_PRIVATE_KEY=<your-firebase-private-key>
FIREBASE_CLIENT_EMAIL=<your-firebase-client-email>
STORAGE_PROVIDER=r2
R2_ACCESS_KEY_ID=<your-r2-access-key>
R2_SECRET_ACCESS_KEY=<your-r2-secret-key>
R2_BUCKET_NAME=<your-bucket-name>
R2_ENDPOINT=<your-r2-endpoint>
R2_PUBLIC_URL=<your-r2-public-url>
CORS_ORIGIN=https://novaplus.vercel.app,https://novaplus-social-api.onrender.com
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your API URL: `https://novaplus-social-api.onrender.com`

### Step 3: Verify Backend Deployment

```bash
# Test health endpoint
curl https://novaplus-social-api.onrender.com/health

# Expected response:
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T12:00:00Z",
  "environment": "production"
}
```

---

## Part 2: Frontend Setup on Vercel

### Step 1: Prepare Your Frontend

1. **Update API endpoint in frontend:**

Edit `frontend/src/const.js` or `.env`:
```
REACT_APP_API_URL=https://novaplus-social-api.onrender.com
```

2. **Commit changes:**
```bash
cd frontend
git add -A
git commit -m "feat: Configure production API endpoint"
git push origin main
```

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com) and sign up/login**

2. **Import Project:**
   - Click "Add New" → "Project"
   - Select `NovaPlus-Social` repository
   - Choose branch: `main`

3. **Configure Project:**
   - **Project Name:** `novaplus`
   - **Framework Preset:** `React`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install`

4. **Add Environment Variables:**

In Vercel dashboard, add:

```
REACT_APP_API_URL=https://novaplus-social-api.onrender.com
REACT_APP_FIREBASE_API_KEY=<your-firebase-api-key>
REACT_APP_FIREBASE_AUTH_DOMAIN=novaplus-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=novaplus-app
REACT_APP_FIREBASE_STORAGE_BUCKET=novaplus-app.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=967183591469
REACT_APP_FIREBASE_APP_ID=1:967183591469:web:dc4a5e01aa767bf265b0a4
REACT_APP_FIREBASE_MEASUREMENT_ID=G-4QXRE8K8KY
```

5. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your frontend URL: `https://novaplus.vercel.app`

### Step 3: Verify Frontend Deployment

1. Open `https://novaplus.vercel.app` in browser
2. Test authentication flow
3. Verify API calls are working

---

## Part 3: Database Setup

### MongoDB Atlas Configuration

1. **Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)**

2. **Create Cluster:**
   - Click "Create" → "Shared"
   - Select Cloud Provider: AWS
   - Select Region: (choose closest to your users)
   - Create Cluster

3. **Add IP Whitelist:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Add: `0.0.0.0/0` (for development) or specific IPs for production
   - Confirm

4. **Create Database User:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `novaplususer`
   - Password: (use your provided password)
   - Click "Add User"

5. **Get Connection String:**
   - Go to "Databases"
   - Click "Connect"
   - Select "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password
   - Add to Render environment variables as `MONGODB_URI`

---

## Part 4: Firebase Configuration

### Setup Firebase Project

1. **Go to [firebase.google.com](https://firebase.google.com)**

2. **Create Project:**
   - Click "Add project"
   - Project name: `novaplus-app`
   - Enable Google Analytics (optional)
   - Create project

3. **Enable Authentication:**
   - Go to "Authentication"
   - Click "Get started"
   - Enable "Google" provider
   - Add your domain to authorized domains

4. **Get Service Account Key:**
   - Go to "Project Settings" → "Service Accounts"
   - Click "Generate New Private Key"
   - Download JSON file
   - Extract values:
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_PRIVATE_KEY`
     - `FIREBASE_CLIENT_EMAIL`
   - Add to Render environment variables

5. **Get Web SDK Config:**
   - Go to "Project Settings" → "General"
   - Copy Firebase config
   - Add to frontend `.env` or constants

---

## Part 5: Cloudflare R2 Storage Setup

### Configure R2 Bucket

1. **Go to [dash.cloudflare.com](https://dash.cloudflare.com)**

2. **Create R2 Bucket:**
   - Go to "R2"
   - Click "Create bucket"
   - Name: `novaplus-social`
   - Create bucket

3. **Generate API Token:**
   - Go to "R2" → "API Tokens"
   - Click "Create API token"
   - Select "Edit" permissions
   - Add to allowed buckets
   - Create token
   - Copy:
     - `R2_ACCESS_KEY_ID`
     - `R2_SECRET_ACCESS_KEY`

4. **Get Endpoint:**
   - Go to bucket settings
   - Copy endpoint URL
   - Set as `R2_ENDPOINT`

5. **Setup Public URL:**
   - Create custom domain or use default public URL
   - Set as `R2_PUBLIC_URL`

6. **Add to Render environment variables**

---

## Part 6: Testing & Verification

### Test API Endpoints

```bash
# 1. Test health
curl https://novaplus-social-api.onrender.com/health

# 2. Register user
curl -X POST https://novaplus-social-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "username": "testuser"
  }'

# 3. Login
curl -X POST https://novaplus-social-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 4. Get current user (replace TOKEN with actual token)
curl -X GET https://novaplus-social-api.onrender.com/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Test Frontend

1. Open `https://novaplus.vercel.app`
2. Click "Sign Up" or "Login"
3. Test Google OAuth
4. Create a post
5. Check if API calls work
6. Test messaging
7. Verify notifications

---

## Part 7: Monitoring & Logs

### View Render Logs

```bash
# In Render dashboard:
1. Go to your service
2. Click "Logs"
3. View real-time logs
```

### View Vercel Logs

```bash
# In Vercel dashboard:
1. Go to your project
2. Click "Deployments"
3. Select latest deployment
4. Click "Logs"
```

### Monitor Performance

- **Render:** Check CPU, Memory, Bandwidth usage
- **Vercel:** Check Build time, Function duration
- **MongoDB:** Check query performance, storage usage

---

## Part 8: Troubleshooting

### Backend Not Starting

**Error:** `Cannot find module`

**Solution:**
```bash
cd backend
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
# Redeploy on Render
```

### CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS`

**Solution:**
Update `CORS_ORIGIN` in Render environment variables:
```
CORS_ORIGIN=https://novaplus.vercel.app
```

### Database Connection Failed

**Error:** `MongoDB connection failed`

**Solution:**
1. Check IP whitelist in MongoDB Atlas
2. Verify connection string is correct
3. Check username and password
4. Ensure database exists

### Firebase Auth Not Working

**Error:** `Firebase initialization failed`

**Solution:**
1. Verify Firebase credentials are correct
2. Check Firebase project is active
3. Ensure authentication is enabled
4. Verify API keys are correct

### File Upload Not Working

**Error:** `Failed to upload file`

**Solution:**
1. Verify R2 credentials
2. Check bucket exists
3. Verify bucket permissions
4. Check file size limits

---

## Part 9: Security Checklist

- [ ] Change all default passwords
- [ ] Enable HTTPS (automatic on Render/Vercel)
- [ ] Set strong JWT secret
- [ ] Enable MongoDB authentication
- [ ] Restrict IP whitelist in MongoDB
- [ ] Use environment variables for secrets
- [ ] Enable CORS properly
- [ ] Setup rate limiting
- [ ] Enable request validation
- [ ] Setup monitoring and alerts
- [ ] Regular backups enabled
- [ ] Security headers configured

---

## Part 10: Performance Optimization

### Backend Optimization

1. **Enable compression:**
```javascript
import compression from 'compression';
app.use(compression());
```

2. **Add caching headers:**
```javascript
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600');
  next();
});
```

3. **Use pagination:**
```javascript
const limit = 20;
const skip = (page - 1) * limit;
```

### Frontend Optimization

1. **Code splitting:**
```javascript
const Home = lazy(() => import('./pages/Home'));
```

2. **Image optimization:**
```javascript
<img src={url} alt="description" loading="lazy" />
```

3. **Lazy loading:**
```javascript
<Suspense fallback={<Loading />}>
  <Component />
</Suspense>
```

---

## Part 11: Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          curl https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }}?key=${{ secrets.RENDER_API_KEY }}
```

---

## Support & Resources

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Docs:** https://docs.mongodb.com
- **Firebase Docs:** https://firebase.google.com/docs
- **Cloudflare R2 Docs:** https://developers.cloudflare.com/r2

---

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Deploy frontend to Vercel
3. ✅ Configure databases and services
4. ✅ Test all features
5. ✅ Setup monitoring
6. ✅ Optimize performance
7. ✅ Launch to users!

---

**Congratulations! Your NovaPlus Social platform is now live!** 🎉
