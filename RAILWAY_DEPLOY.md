# Railway Deployment Guide

This guide will walk you through deploying the Chess Tournament Manager to Railway.

## Prerequisites

1. A [Railway](https://railway.app) account (free tier available)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Options

### Option 1: Single Service Deployment (Recommended)

Deploy both frontend and backend as a single service. The backend will serve the built frontend.

#### Step 1: Prepare Your Repository

1. Make sure all your code is committed and pushed to your Git repository
2. The root `package.json` includes build scripts that Railway will use

#### Step 2: Create a New Project on Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"** (or your Git provider)
4. Select your repository

#### Step 3: Configure the Service

Railway will automatically detect your project. Configure it:

1. **Root Directory**: Leave as root (`.`)
2. **Build Command**: `npm run build:all`
3. **Start Command**: `npm start`
4. **Node Version**: Railway will auto-detect Node.js

#### Step 4: Set Environment Variables

In Railway, go to your service → **Variables** tab and add:

```
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-app-name.up.railway.app
```

If you have a database or other services, add those variables too.

#### Step 5: Deploy

1. Railway will automatically start building and deploying
2. Watch the build logs to ensure everything compiles correctly
3. Once deployed, Railway will provide you with a URL like `https://your-app-name.up.railway.app`

#### Step 6: Verify Deployment

1. Visit your Railway URL
2. Check `/health` endpoint: `https://your-app-name.up.railway.app/health`
3. Test the API: `https://your-app-name.up.railway.app/api/tournaments`

---

### Option 2: Separate Services (Advanced)

Deploy frontend and backend as separate services for better scalability.

#### Backend Service

1. Create a new service in Railway
2. **Root Directory**: `backend`
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   CORS_ORIGIN=https://your-frontend-url.up.railway.app
   ```

#### Frontend Service

1. Create a second service in Railway
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Start Command**: Use a static file server like `npx serve -s dist -p $PORT`
5. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.up.railway.app
   ```

---

## Configuration Files

### `railway.json` (Optional)

Railway will auto-detect your setup, but you can create a `railway.json` for custom configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build:all"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### `.railwayignore` (Optional)

Create a `.railwayignore` file to exclude files from deployment:

```
node_modules
.git
.env.local
.env.development
*.log
.DS_Store
coverage
.vscode
.idea
```

---

## Post-Deployment

### Custom Domain (Optional)

1. Go to your service → **Settings** → **Domains**
2. Click **"Generate Domain"** or add your custom domain
3. Update `CORS_ORIGIN` environment variable to match your domain

### Monitoring

- Railway provides built-in logs and metrics
- Check the **Metrics** tab for CPU, memory, and network usage
- Set up alerts in the **Settings** tab

### Database (If Needed)

If you add a database later:

1. Click **"New"** → **"Database"** → Choose your database type
2. Railway will automatically set `DATABASE_URL` environment variable
3. Update your backend code to use the connection string

---

## Troubleshooting

### Build Fails

1. Check build logs in Railway dashboard
2. Ensure all dependencies are in `package.json` (not just `devDependencies`)
3. Verify Node.js version compatibility (check `engines` in `package.json`)

### Frontend Not Loading

1. Verify `build:frontend` completed successfully
2. Check that `frontend/dist` directory exists after build
3. Ensure backend is serving static files correctly (check `server.js`)

### API Routes Not Working

1. Verify `CORS_ORIGIN` matches your frontend URL
2. Check that routes are mounted correctly in `server.js`
3. Review Railway logs for any errors

### Port Issues

- Railway automatically sets `PORT` environment variable
- Your backend should use `process.env.PORT || 3000`
- Don't hardcode port numbers

---

## Quick Deploy Checklist

- [ ] Code pushed to Git repository
- [ ] Railway project created and connected to repo
- [ ] Environment variables set (`NODE_ENV`, `PORT`, `CORS_ORIGIN`)
- [ ] Build completes successfully
- [ ] Service starts without errors
- [ ] Health check endpoint works (`/health`)
- [ ] Frontend loads at root URL
- [ ] API endpoints respond correctly (`/api/*`)

---

## Cost

Railway offers:
- **Free tier**: $5/month credit (usually enough for small apps)
- **Hobby plan**: $5/month + usage
- **Pro plan**: $20/month + usage

For a small tournament manager app, the free tier should be sufficient.

---

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Node.js on Railway](https://docs.railway.app/deploy/nodejs)
