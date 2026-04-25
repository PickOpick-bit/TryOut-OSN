# CBT Platform – OSK Fisika SMA

A production-ready Computer-Based Test platform for Physics Olympiad (OSK) selection exams, rebuilt from a static HTML file into a scalable full-stack system.

## ✨ Features

### Student (CBT Engine)
- 🎲 Randomized questions fetched from backend (no hardcoding)
- ⏱️ 90-minute countdown timer with warning states
- 🗂️ Interactive question navigation grid
- 📊 Real-time progress tracker
- 📐 LaTeX math rendering via KaTeX
- 🖼️ Question images with Cloudinary hosting
- 📋 **Review Mode**: after submit, see correct answers + explanations per question
- 📱 Responsive design

### Admin Panel
- 🔐 Key-based authentication
- ➕ Add/Edit/Delete questions with rich form
- 🖼️ Drag-and-drop image upload to Cloudinary
- 🔍 Filter by topic, difficulty, status
- 📈 Question statistics dashboard
- 🌱 Bulk seed from JSON file

## 🏗️ Architecture

```
frontend/              ← Static site → Vercel
  index.html           ← CBT engine
  js/
    app.js             ← Orchestrator
    api.js             ← HTTP client
    timer.js           ← Countdown timer
    state.js           ← State management
    renderer.js        ← DOM rendering
    config.js          ← API URL config
  admin/
    index.html         ← Admin panel
    adminApi.js        ← Admin HTTP client

backend/               ← Node.js API → Render
  server.js            ← Express entry point
  config/
    db.js              ← MongoDB connection
    cloudinary.js      ← Image upload config
  models/
    Question.js        ← Mongoose schema
  controllers/
    questionController.js ← Business logic
  routes/
    questions.js       ← Public routes
    admin.js           ← Protected routes
  middleware/
    auth.js            ← Admin key check
```

## 🔌 API Reference

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questions` | Get randomized questions (no answers) |
| GET | `/api/questions/topics` | List all topics |
| POST | `/api/submit` | Grade exam answers |

### Admin (requires `x-admin-key` header)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/questions` | List all questions |
| POST | `/api/admin/questions` | Create question |
| PUT | `/api/admin/questions/:id` | Update question |
| DELETE | `/api/admin/questions/:id` | Delete question |
| POST | `/api/admin/upload` | Upload image |
| POST | `/api/admin/seed` | Bulk seed questions |

## 🚀 Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full step-by-step guide.

**Stack (all FREE tiers):**
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas M0
- **Images**: Cloudinary

## Answer Validation Logic

```js
// If tolerance > 0: absolute tolerance
isCorrect = |userAnswer - correctAnswer| <= tolerance

// Default (tolerance = 0): 6% relative + 0.05 absolute
isCorrect = |userAnswer - correctAnswer| < 0.06 * |correctAnswer| + 0.05
```
