# Deployment Guide

Deploy your wallpaper jukebox to Render with automatic GitHub deploys and custom domain support.

## Quick Start (TL;DR)

1. Push code to GitHub
2. Connect repo to Render
3. Set environment variables in dashboard
4. Add custom domain in Render settings
5. Update DNS at GoDaddy

---

## Step 1: Push to GitHub

Make sure your code is on GitHub:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin master
```

---

## Step 2: Deploy to Render

### Option A: Blueprint (Automatic)

1. Go to https://render.com and sign in with GitHub
2. Click **"New"** → **"Blueprint"**
3. Connect your `wallpaper-jukebox` repository
4. Render reads `render.yaml` and configures everything automatically
5. Click **"Apply"** to deploy

### Option B: Manual Setup

1. Go to https://render.com and sign in with GitHub
2. Click **"New"** → **"Web Service"**
3. Connect your `wallpaper-jukebox` repository
4. Configure:
   - **Name**: `wallpaper-jukebox`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Click **"Create Web Service"**

---

## Step 3: Set Environment Variables

In Render dashboard → Your service → **"Environment"** tab:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PEXELS_API_KEY` | Your key | At least one image API required |
| `UNSPLASH_ACCESS_KEY` | Your key | Optional |
| `PIXABAY_API_KEY` | Your key | Optional |
| `RAPIDAPI_KEY` | Your key | For Shazam music recognition |
| `RAPIDAPI_HOST` | `shazam.p.rapidapi.com` | Required if using Shazam |
| `LASTFM_API_KEY` | Your key | For music tag enrichment |

Click **"Save Changes"** - Render auto-redeploys.

---

## Step 4: Custom Domain (GoDaddy)

### 4.1: Add Domain in Render

1. In Render dashboard → Your service → **"Settings"** tab
2. Scroll to **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Enter your domain (e.g., `wallpaperjukebox.com` or `www.wallpaperjukebox.com`)
5. Render shows you the DNS records to configure

### 4.2: Configure DNS at GoDaddy

1. Log in to GoDaddy → **"My Products"** → **"DNS"** for your domain

**For root domain (e.g., `wallpaperjukebox.com`):**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `216.24.57.1` | 600 |

**For www subdomain (e.g., `www.wallpaperjukebox.com`):**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | `your-service-name.onrender.com` | 600 |

**For both root + www (recommended):**
- Add the A record for root domain
- Add the CNAME for www
- In Render, add both `wallpaperjukebox.com` AND `www.wallpaperjukebox.com` as custom domains

### 4.3: Verify & Wait

1. Back in Render, click **"Verify"** for each domain
2. DNS propagation takes 5-30 minutes (sometimes up to 48 hours)
3. Render automatically provisions SSL certificates once DNS is verified

### 4.4: Redirect www to root (or vice versa)

Render handles this automatically. When you add both domains, you can set one as the primary and Render redirects the other.

---

## Automatic Deploys

Once connected, every push to your configured branch triggers a new deployment automatically.

```bash
git add .
git commit -m "Update feature"
git push origin master
# Render auto-deploys in ~2-3 minutes
```

---

## Free Tier Notes

Render's free tier:
- **512 MB RAM**, **0.1 CPU**
- **Spins down after 15 minutes of inactivity**
- First request after spin-down has ~30-60 second cold start
- 100 GB bandwidth/month included

This is fine for personal use. The wallpaper jukebox will just take a moment to wake up if you haven't used it in a while.

---

## Build Configuration

Your project is already configured for Render:

**`package.json` scripts:**
```json
{
  "build": "npm run build:client && npm run build:server",
  "build:client": "vite build",
  "build:server": "tsc -p tsconfig.server.json",
  "start": "node dist/server/index.js"
}
```

**Build output:**
- Client: `dist/client/` (static files)
- Server: `dist/server/` (Express app)

**Production behavior:**
- Express serves the React app from `dist/client/`
- API routes (`/api/*`) handled by Express
- SPA routing handled by catch-all route

---

## Troubleshooting

### Build Fails

**`Cannot find module 'xyz'`**
- Check all dependencies are in `package.json` (not just devDependencies)
- Verify `package-lock.json` is committed

**`tsc: command not found`**
- TypeScript should be in dependencies (already configured)

### App Shows Blank Page

1. Check build logs in Render dashboard
2. Verify `NODE_ENV=production` is set
3. Check browser console for errors

### API Calls Fail (404)

- Verify routes are registered before static file serving in `server/src/index.ts`
- Check Render logs for errors

### Environment Variables Not Working

- Variables are case-sensitive
- Service auto-redeploys when you save variables
- Check spelling matches exactly

### Custom Domain Not Working

- DNS propagation can take up to 48 hours
- Verify DNS records match exactly what Render shows
- Try `nslookup yourdomain.com` to check propagation
- Make sure you clicked "Verify" in Render

### Cold Start Too Slow

- This is expected on free tier
- Upgrade to paid ($7/mo) for always-on
- Or accept the ~30-60s first-load delay after inactivity

---

## Alternative Platforms

If Render doesn't work out:

| Platform | Free Tier | Notes |
|----------|-----------|-------|
| **Railway** | $5 credit trial, then $1/mo min | No spin-down, requires payment after trial |
| **Koyeb** | Yes | Requires credit card, has spin-down |
| **Fly.io** | No | Pay-as-you-go only |
| **Vercel/Netlify** | Yes | Requires refactoring to serverless functions |

Render is recommended for this project because it's truly free, requires no credit card, and handles full-stack Node apps without refactoring.

---

## Deployment Checklist

### Before Deploy
- [ ] Code pushed to GitHub
- [ ] `.env` in `.gitignore` (don't commit secrets)
- [ ] `dist/` in `.gitignore`
- [ ] API keys ready to add to Render dashboard

### After Deploy
- [ ] Build completed successfully
- [ ] Environment variables set
- [ ] App loads at Render URL
- [ ] Images rotate correctly
- [ ] Music recognition works (if configured)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic)
