# 🌊 ByteStream

ByteStream is a full-stack, LeetCode-meets-TikTok hybrid platform where users can scroll through short-form video explanations of coding problems, view the associated code panes, and interact via likes and comments.

## 🛠 Tech Stack

* **Frontend:** React.js (Vite)
* **Backend:** Node.js, Express
* **Database:** PostgreSQL (Containerized via Docker)
* **ORM:** Prisma v7

---

## 🚦 Prerequisites

Before you begin, ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18 or higher)
* [Git](https://git-scm.com/)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Must be installed and running before starting the backend)

---

## 🚀 Local Development Setup

Follow these exact steps to get the project running on your local machine. Because this project uses a monorepo structure, you will need two separate terminal windows running simultaneously (one for the backend, one for the frontend).

### 1. Clone the Repository
Open your terminal and pull down the code:
```bash
git clone [https://github.com/ArghyaShubhshiv/bytestream.git](https://github.com/ArghyaShubhshiv/bytestream.git)
cd bytestream
```

### 2. Backend & Database Setup
The backend uses a Dockerized PostgreSQL database. For security reasons, the `.env` file containing the database password is not tracked in GitHub, so you must recreate it locally.

Open your **first terminal window**:
```bash
# Navigate to the backend directory
cd backend

# Install backend dependencies
npm install
```

**Set up your Environment Variables:**
Create a new file named `.env` inside the `backend` folder and add the following line exactly as written. This connects Prisma to our local Docker database:
```text
DATABASE_URL=<insert database url>
```

**Start the Database & Run Migrations:**
Ensure Docker Desktop is open and running on your computer, then execute:
```bash
# Spin up the PostgreSQL database container
docker compose up -d

# Sync the database schema and generate the Prisma v7 Client
npx prisma migrate dev
```

**Start the Backend Server:**
```bash
# Start the Express API
npm run dev
```
*The backend API should now be running on `http://localhost:3001`.*

### 3. Frontend Setup
Open a **second terminal window** (leave the backend running in the first one):

```bash
# Navigate to the frontend directory (from the project root)
cd frontend

# Install frontend dependencies
npm install

# Start the React development server
npm run dev
```
*The frontend should now be running on `http://localhost:5173`.*

---

## 🧪 Testing with Dummy Data (Optional)

Because you just spun up a fresh local database via Docker, it will be completely empty. To test the frontend UI, you can inject some dummy data using Prisma Studio.

In a new terminal window, run:
```bash
cd backend
npx prisma studio
```
This opens a web-based database GUI. From there, you can add a fake `User`, a `CodePane` problem, and a `Video` to populate your local React feed!

---

## 🤝 Contribution Guidelines

To keep our database schemas from colliding, please adhere to the following workflow:

1. **Always pull before you push:** Run `git pull origin main` to ensure you have the latest schema changes from the team before starting work.
2. **Schema Changes:** If you modify the `backend/prisma/schema.prisma` file, you **must** run `npx prisma migrate dev --name describe_your_change`. 
3. **Commit the Migration:** Be sure to commit the newly generated folder inside `prisma/migrations` to GitHub so the rest of the team can sync their databases when they pull your code.
4. **GitHub Authentication:** Remember that pushing via the terminal requires a GitHub Personal Access Token (PAT), not your standard account password.
```