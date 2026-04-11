import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg'; // 1. Import standard Postgres pool
import { PrismaPg } from '@prisma/adapter-pg'; // 2. Import Prisma's adapter

// 3. Initialize the Prisma 7 connection
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// ROUTE 1: Get all videos for the main feed
// ----------------------------------------------------
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      include: {
        creator: true, 
        codePane: true, 
        _count: {
          select: { likes: true, comments: true } 
        }
      },
      orderBy: { id: 'desc' } 
    });
    
    res.json(videos);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// ----------------------------------------------------
// ROUTE 2: Add a new comment to a video
// ----------------------------------------------------
app.post('/api/comments', async (req, res) => {
  try {
    const { text, videoId, userId } = req.body;

    const newComment = await prisma.comment.create({
      data: {
        text: text,
        videoId: videoId,
        userId: userId
      },
      include: {
        user: true 
      }
    });

    res.json(newComment);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
});