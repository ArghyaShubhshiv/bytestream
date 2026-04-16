import express, {Request, Response} from 'express'
import cors from 'cors'
import videoRoutes from "./routes/video.routes"
import userRoutes from "./routes/user.routes"
import authRoutes from "./routes/auth.routes";
import interactionRoutes from "./routes/interaction.routes"; // 💥 1. ADD THIS IMPORT

const app = express()

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req: Request, res: Response) => {
    res.status(200).json({status: "ByteStream API live and working."})
})

app.use("/api/auth", authRoutes); 
app.use("/api/videos", videoRoutes);
app.use("/api/users", userRoutes);
app.use("/api/interactions", interactionRoutes); // 💥 2. MOUNT THE ROUTER HERE

const PORT = 3001
app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
})