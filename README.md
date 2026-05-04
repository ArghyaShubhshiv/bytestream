# 🌊 ByteStream

ByteStream is a full-stack, LeetCode-meets-TikTok hybrid platform where users can scroll through short-form video explanations of coding problems, view associated code panes, and interact via likes and comments.

## 🛠 Tech Stack

- **Frontend:** React 19 + Vite, TanStack Router, Monaco Editor, Tailwind CSS v4
- **Backend:** Node.js, Express 5, TypeScript
- **Database:** PostgreSQL (Docker), Prisma v7 ORM
- **Code Execution:** Piston API (self-hosted via Docker)
- **Storage:** AWS S3 (video uploads)
- **Auth:** JWT (bcrypt password hashing)

---

## 🚦 Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (must be running)
- [Git](https://git-scm.com/)

---

## 🚀 Quick Start

### 1. Install all dependencies

```bash
npm run install:all
```

### 2. Set up environment variables

Create `backend/.env` (copy from `backend/.env.example`):

```env
DATABASE_URL=postgresql://admin:password123@localhost:5434/bytestream?schema=public

# Auth
JWT_SECRET=your_super_secret_jwt_key_here

# Frontend origin (for CORS)
FRONTEND_URL=http://localhost:5173

# AWS S3 (for video uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_BUCKET_NAME=your_bucket_name

# Code execution (Piston — self-hosted via Docker)
PISTON_URL=http://localhost:2000
```

### 3. Start Docker services (PostgreSQL + Piston)

```bash
cd backend
docker compose up -d
```

### 4. ⚡ Install language runtimes into Piston (ONE-TIME SETUP)

Run this from the project root after Docker is up:

```bash
bash install-runtimes.sh
```

This installs Python 3.10, JavaScript (Node 18), Java 15, and C++ 10 into the Piston sandbox. Takes ~1-2 minutes. **You only need to do this once** — runtimes persist as long as the Piston container is not wiped.

### 5. Run database migrations

```bash
cd backend
npx prisma migrate dev
```

### 6. Start both servers

```bash
# From project root
npm run dev
```

- **Backend API:** http://localhost:3001
- **Frontend:** http://localhost:5173
- **Piston (code runner):** http://localhost:2000

---

## 📂 Project Structure

```
bytestream/
├── install-runtimes.sh   ← One-time Piston runtime installer
├── package.json          ← Root: run both apps with `npm run dev`
├── backend/
│   ├── index.ts          ← Express server entry point
│   ├── controllers/      ← Route handlers
│   │   └── submission.controller.ts  ← Judge + DB persistence
│   ├── routes/
│   │   └── submission.routes.ts      ← POST /submit, GET /languages
│   ├── modules/judge/
│   │   ├── piston.service.ts  ← Piston API client (language versions, limits)
│   │   ├── judge.service.ts   ← Test case runner + verdict logic
│   │   └── health.check.ts    ← Startup check for Piston + runtimes
│   ├── middleware/
│   ├── lib/
│   ├── prisma/
│   │   └── schema.prisma      ← Includes Submission model
│   └── docker-compose.yml     ← PostgreSQL + Piston
└── frontend/
    └── src/components/
        └── CodePane.tsx       ← Monaco editor + judge result display
```

---

## 🌐 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/videos/feed` | No | Fetch video feed |
| GET | `/api/videos/upload-url` | No | Get S3 presigned upload URL |
| POST | `/api/videos/confirm` | No | Confirm upload & save to DB |
| GET | `/api/users/` | No | Get all users |
| POST | `/api/interactions/videos/:id/like` | JWT | Toggle video like |
| POST | `/api/interactions/videos/:id/dislike` | JWT | Toggle video dislike |
| GET | `/api/interactions/videos/:id` | No | Get comments for video |
| POST | `/api/interactions/videos/:id` | JWT | Post a comment |
| POST | `/api/interactions/comment/:id/like` | JWT | Toggle comment like |
| POST | `/api/interactions/comment/:id/dislike` | JWT | Toggle comment dislike |
| POST | `/api/interactions/subscribe/:creatorId` | JWT | Toggle subscription |
| POST | `/api/run` | No | Run code against sample test cases only |
| POST | `/api/submit` | No | Submit code against all test cases |
| GET | `/api/submissions` | JWT | Get submission history for a video |
| GET | `/api/languages` | No | List supported languages |

---

## ⚙️ Code Engine — How It Works

```
User submits code (language + code + videoId)
        │
        ▼
submission.controller.ts
  → validates input & code size limit (64 KB)
  → looks up Video → CodePane → testCases from DB
        │
        ▼
judge.service.ts
  → loops through each test case
  → calls piston.service.ts for each
        │
        ▼
piston.service.ts → POST http://localhost:2000/api/v2/execute
  (sandboxed Docker process, 5s timeout, 128 MB memory limit)
        │
        ▼
judge.service.ts compares stdout to expected output
  → Accepted / Wrong Answer / Runtime Error / Compile Error / TLE
        │
        ▼
Result saved to Submission table in DB
Response returned to frontend with verdict + pass count + time
```

### Supported Languages

| Key | Runtime | Version |
|-----|---------|---------|
| `python` | CPython | 3.10.0 |
| `javascript` | Node.js | 18.15.0 |
| `java` | OpenJDK | 15.0.2 |
| `cpp` | GCC | 10.2.0 |

### Test Case Format

Test cases are stored as JSON in `CodePane.testCases`:

```json
[
  { "input": "5\n3", "output": "8" },
  { "input": "10\n20", "output": "30" }
]
```

`input` is passed via stdin. `output` is matched against stdout (trimmed).

---

## 🧪 Seed Dummy Data

```bash
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555. Add a User → CodePane (with testCases JSON) → Video to populate the feed.

---

## 🤝 Contribution Guidelines

1. Always `git pull origin main` before starting
2. If you modify `backend/prisma/schema.prisma`, run `npx prisma migrate dev --name describe_your_change` inside `backend/`
3. Commit the generated migration folder so teammates can sync
