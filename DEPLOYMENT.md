# Deployment Guide: Vercel (Frontend) + Railway (Backend)

This guide walks you through deploying the Chess Tournament Manager with:
- **Frontend** on Vercel
- **Backend** on Railway

---

## Prerequisites

1. GitHub repository with your code
2. [Vercel account](https://vercel.com) (free tier available)
3. [Railway account](https://railway.app) (free $5/month credit)

---

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository

### Step 2: Configure Backend Service

1. Railway will auto-detect your project
2. In the service settings, set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install` (or leave auto-detected)
   - **Start Command**: `npm start`

### Step 3: Set Environment Variables

Go to your Railway service → **Variables** tab and add:

```
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend.vercel.app
```

**Important**: You'll update `CORS_ORIGIN` after deploying the frontend.

### Step 4: Get Your Backend URL

1. Once deployed, Railway provides a URL like: `https://your-backend.up.railway.app`
2. Copy this URL - you'll need it for the frontend
3. Test the backend:
   - Health check: `https://your-backend.up.railway.app/health`
   - API: `https://your-backend.up.railway.app/api/tournaments`

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository

### Step 2: Configure Frontend Settings

In the project settings, configure:

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### Step 3: Set Environment Variables

Go to **Settings** → **Environment Variables** and add:

```
VITE_API_URL=https://your-backend.up.railway.app/api
```

Replace `your-backend.up.railway.app` with your actual Railway backend URL.

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. You'll get a URL like: `https://your-app.vercel.app`

---

## Part 3: Update CORS on Railway

After the frontend is deployed:

1. Go back to Railway → Your service → **Variables**
2. Update `CORS_ORIGIN` to your Vercel URL:
   ```
   CORS_ORIGIN=https://your-app.vercel.app
   ```
3. Railway will automatically redeploy with the new CORS settings

---

## Part 4: Verify Deployment

### Test Frontend
- Visit your Vercel URL: `https://your-app.vercel.app`
- The app should load

### Test Backend Connection
- Open browser DevTools → Network tab
- Use the app - API calls should go to your Railway backend
- Check that requests succeed (no CORS errors)

### Test API Directly
- Visit: `https://your-backend.up.railway.app/health`
- Should return: `{"status":"OK","timestamp":"..."}`

---

## Environment Variables Summary

### Railway (Backend)
```
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Vercel (Frontend)
```
VITE_API_URL=https://your-backend.up.railway.app/api
```

---

## Troubleshooting

### Frontend can't connect to backend

**Symptoms**: Network errors, CORS errors in browser console

**Solutions**:
1. Verify `VITE_API_URL` in Vercel matches your Railway backend URL
2. Verify `CORS_ORIGIN` in Railway matches your Vercel frontend URL
3. Check Railway logs for errors
4. Ensure backend is running (check Railway dashboard)

### Build fails on Vercel

**Symptoms**: Deployment fails with build errors

**Solutions**:
1. Check Vercel build logs
2. Ensure `frontend/vite.config.js` doesn't reference uninstalled packages
3. Verify all dependencies are in `frontend/package.json`
4. Test build locally: `cd frontend && npm run build`

### Build fails on Railway

**Symptoms**: Railway deployment fails

**Solutions**:
1. Check Railway build logs
2. Verify `backend/package.json` has correct scripts
3. Ensure Node.js version is compatible (check `engines` field)
4. Test locally: `cd backend && npm start`

### CORS errors

**Symptoms**: Browser console shows CORS policy errors

**Solutions**:
1. Verify `CORS_ORIGIN` in Railway exactly matches your Vercel URL (including `https://`)
2. No trailing slashes in URLs
3. Redeploy Railway after changing `CORS_ORIGIN`

---

## Custom Domains (Optional)

### Vercel Custom Domain
1. Go to Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Update `CORS_ORIGIN` in Railway to match

### Railway Custom Domain
1. Go to Railway service → **Settings** → **Domains**
2. Add your custom domain
3. Update `VITE_API_URL` in Vercel to match

---

## Cost Estimate

### Vercel
- **Free tier**: Unlimited deployments, 100GB bandwidth
- **Pro**: $20/month for teams

### Railway
- **Free tier**: $5/month credit (usually enough for small apps)
- **Hobby**: $5/month + usage
- **Pro**: $20/month + usage

For this app, both should be free or very low cost.

---

## Quick Reference

### Railway Backend
- **URL**: `https://your-backend.up.railway.app`
- **Health**: `https://your-backend.up.railway.app/health`
- **API**: `https://your-backend.up.railway.app/api/*`

### Vercel Frontend
- **URL**: `https://your-app.vercel.app`
- **Build**: Automatic on git push
- **Deploy**: Automatic on git push

---

## Next Steps

1. ✅ Backend deployed on Railway
2. ✅ Frontend deployed on Vercel
3. ✅ Environment variables configured
4. ✅ CORS configured
5. ✅ Test the full stack

Your app should now be live! 🎉
