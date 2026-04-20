# ByteStream 🌊

ByteStream is an innovative, full-stack platform combining the vertical-scrolling feed experience of TikTok with the interactive code-execution environment of LeetCode. Users can scroll through short-form educational coding videos and simultaneously solve the exact coding challenge being presented in a side-by-side IDE powered by a secure, self-hosted Docker code engine. 

---

## 🚀 Features

- **Split-Pane Architecture**: Watch algorithmic explanations in a rich vertical feed on the left, and immediately apply the code in a full Monaco IDE on the right.
- **Isolated Code Engine Sandbox**: Powered by a robust backend using Piston wrapped in Docker containers, isolating arbitrary executions securely. Runs **Python, Java, and C++** at lightning-fast speeds natively.
- **Micro-transactional Feedback**: In-flight concurrent locking for fast compilation validation, alongside interactive console outputs and `stdin` (Custom Input) parsing.
- **Algorithm Verification**: Authors can bind their videos to specific arrays of algorithmic Test Cases.
- **Modern Stack**: Built tightly with React, Vite, Node.js, Express, PostgreSQL, Prisma, AWS S3 Uploads (Presigned URLs), and Docker.

---

## 🏗️ Architecture

- **Frontend**: React 18, Vite, TailwindCSS, Monaco Editor (for the IDE), Axios.
- **Backend**: Node.js, Express.js, TypeScript, PostgreSQL (via Prisma ORM), AWS S3 SDK (upload pipelines).
- **Execution Engine**: [Piston API](https://github.com/engineer-man/piston) (Self-Hosted via Docker). Packages install automatically using an automated internal bash architecture.

---

## 🛠️ Prerequisites

To run this application locally, ensure you have the following installed on your machine:
- **Node.js** (v18+)
- **Docker** and **Docker Compose**
- **Git**

---

## 🏃 Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/bytestream.git
cd bytestream
```

### 2. Configure Environment Variables
You must set up your environment variables locally so secrets aren't tracked on Git. 
Copy the `.env.example` files into active `.env` files:

```bash
# Backend Environment
cp backend/.env.example backend/.env

# Frontend Environment
cp frontend/.env.example frontend/.env
```
👉 *Open `backend/.env` and replace the blank `AWS_*` variables with your active S3 Bucket parameters and generate a strong `JWT_SECRET` password.*

### 3. One-Click Startup Script (Recommended)
You can boot the entire stack natively by running the initialization script from the root repository:
```bash
./start.sh
```
This single script will gracefully:
1. Fire up a Postgres database and the Piston Code Engine in detached Docker instances.
2. Install all `npm` dependencies for the root, frontend, and backend packages.
3. Push the Prisma database schema into the active Postgres container.
4. Concurrently launch both backend server (port `3001`) and frontend client (port `5173`).

### Manual Startup Process
If you prefer not to use `start.sh`, you can build manually:

**1. Infrastructure:**
```bash
cd backend
docker-compose up -d
```
**2. Database Migration:**
```bash
cd backend
npm install
npx prisma db push
```
**3. Backend API:**
```bash
cd backend
npm run dev
```
**4. Frontend Client:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📂 Project Structure

```
bytestream/
│
├── backend/                  # Express API Server & Code Sandbox Logic
│   ├── controllers/          # Route handlers (Video processing, User Auth, Code Subs)
│   ├── prisma/               # Database schemas and connection logic
│   ├── modules/              # Piston service interface and Judges
│   └── docker-compose.yml    # Main structural stack containing API and Database bounds
│
├── frontend/                 # React Application (Vite)
│   ├── src/
│   │   ├── components/       # UI Components (Feed, CodePane, Monaco Wrapper)
│   │   ├── pages/            # View Pages (Upload, Landing, Feed)
│   │   └── context/          # React Contexts (User Auth Session)
│
└── start.sh                  # Automation runner
```

---

## 🛡️ License

This project is licensed under the MIT License.
