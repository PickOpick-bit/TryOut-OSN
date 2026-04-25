# 🚀 Deployment Guide – CBT Platform OSK Fisika

## Architecture Overview

```
┌─────────────────┐     HTTPS      ┌──────────────────┐
│  Vercel (Free)  │ ◄────────────► │  Render (Free)   │
│                 │                │                  │
│  /index.html    │                │  Express API     │
│  /admin/        │                │  :5000           │
│  /js/*.js       │                │                  │
└─────────────────┘                └────────┬─────────┘
                                            │
                                   ┌────────▼─────────┐
                                   │  MongoDB Atlas   │
                                   │  (Free M0 Tier)  │
                                   └──────────────────┘
                                            │
                                   ┌────────▼─────────┐
                                   │    Cloudinary    │
                                   │  (Free 25GB/mo)  │
                                   └──────────────────┘
```

---

## Step 1 — MongoDB Atlas (Database)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → Create free account
2. **New Project** → Name: `cbt-platform`
3. **Build a Database** → Select **M0 FREE** tier → Region: closest to your users
4. **Username/Password**: Create credentials (save them!)
5. **IP Access**: Add `0.0.0.0/0` (allow all – required for Render)
6. **Connect** → **Drivers** → Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```
7. Replace `<username>` and `<password>` and add `cbt_platform?retryWrites=true&w=majority` at the end

**Your MONGO_URI:**
```
mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/cbt_platform?retryWrites=true&w=majority
```

---

## Step 2 — Cloudinary (Image Storage)

1. Go to [cloudinary.com](https://cloudinary.com) → Create free account
2. Dashboard → Copy **Cloud Name**, **API Key**, **API Secret**
3. Free tier: 25GB storage, 25GB bandwidth/month ✅

---

## Step 3 — Deploy Backend to Render

1. Push your code to **GitHub** (create repo, push `/backend` folder)

2. Go to [render.com](https://render.com) → Sign up with GitHub

3. **New** → **Web Service** → Connect your GitHub repo

4. Configure:
   - **Name**: `cbt-platform-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. **Environment Variables** (Add all):
   ```
   MONGO_URI          = mongodb+srv://...
   CLOUDINARY_CLOUD_NAME = your_cloud_name
   CLOUDINARY_API_KEY    = your_api_key
   CLOUDINARY_API_SECRET = your_api_secret
   ADMIN_SECRET_KEY      = your_strong_random_key_here
   NODE_ENV              = production
   FRONTEND_URL          = https://your-app.vercel.app
   ```

6. Click **Create Web Service** → Wait for deployment (~3 min)

7. Your API URL: `https://cbt-platform-api.onrender.com`

8. ✅ Test: `https://cbt-platform-api.onrender.com/health`

> ⚠️ **Free Render Note**: Service spins down after 15min inactivity.
> First request after sleep takes ~30s. Consider a free uptime monitor
> like [UptimeRobot](https://uptimerobot.com) to ping `/health` every 10min.

---

## Step 4 — Update Frontend API URL

Open both files and replace the placeholder:

**`frontend/js/config.js`** (line 7):
```js
: 'https://cbt-platform-api.onrender.com',  // ← your Render URL
```

**`frontend/admin/adminApi.js`** (line 4):
```js
: 'https://cbt-platform-api.onrender.com',  // ← your Render URL
```

---

## Step 5 — Deploy Frontend to Vercel

### Option A: Vercel CLI (Recommended)
```bash
npm i -g vercel
cd /path/to/project-root  # where vercel.json is
vercel login
vercel --prod
```

### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. **Root Directory**: `/` (project root)
4. No build command needed (static site)
5. Deploy!

Your frontend URL: `https://your-app.vercel.app`

---

## Step 6 — Seed Initial Questions

### Via Admin Panel:
1. Open `https://your-app.vercel.app/admin/`
2. Enter your `ADMIN_SECRET_KEY`
3. Click **🌱 Seed Data Awal**
4. Upload `docs/seed-example.json` (or your own JSON file)

### JSON Format for Seed:
```json
[
  {
    "text": "Soal dengan LaTeX $F = ma$...",
    "answer": 42,
    "tolerance": 0,
    "unit": "N",
    "topic": "Dinamika – Hukum Newton",
    "image": null,
    "explanation": "Penjelasan soal...",
    "difficulty": "sedang",
    "isActive": true
  }
]
```

### Via API directly:
```bash
curl -X POST https://cbt-platform-api.onrender.com/api/admin/seed \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -d @docs/seed-example.json
```

---

## Step 7 — Verify Everything Works

```bash
# 1. Health check
curl https://cbt-platform-api.onrender.com/health

# 2. Get questions (public)
curl https://cbt-platform-api.onrender.com/api/questions

# 3. Admin questions list
curl -H "x-admin-key: YOUR_KEY" \
  https://cbt-platform-api.onrender.com/api/admin/questions

# 4. Test submit
curl -X POST https://cbt-platform-api.onrender.com/api/submit \
  -H "Content-Type: application/json" \
  -d '{"answers":[{"questionId":"QUESTION_ID","value":"42"}]}'
```

---

## Local Development

```bash
# Backend
cd backend
cp .env.example .env
# Fill in .env with your values
npm install
npm run dev    # runs on http://localhost:5000

# Frontend (use any static server)
cd ..
npx serve frontend  # or open frontend/index.html directly
# OR: use VS Code Live Server extension
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS error | Check `FRONTEND_URL` env var on Render matches your Vercel URL exactly |
| Questions not loading | Check Render logs, verify `MONGO_URI` is correct |
| Admin login fails | Verify `ADMIN_SECRET_KEY` matches what you type in the panel |
| Images not uploading | Verify Cloudinary credentials in Render env vars |
| Slow first load | Normal for free Render – add UptimeRobot ping |
| MongoDB connection refused | Add `0.0.0.0/0` to Atlas IP Access List |

---

## Security Notes

- `ADMIN_SECRET_KEY` should be a strong random string (32+ chars)
- Admin panel is basic key auth – sufficient for internal teacher use
- For public-facing production, consider upgrading to JWT auth
- Never commit `.env` to git (it's in `.gitignore`)
