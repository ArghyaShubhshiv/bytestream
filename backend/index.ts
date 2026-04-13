import express, {Request, Response} from 'express'
import cors from 'cors'
import videoRoutes from "./routes/video.routes"
import userRoutes from "./routes/user.routes"
import { prisma } from "./lib/prisma";

const app = express()

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req: Request, res: Response) => {
    res.json({status: "ByteStream API live and working."})
})

app.use("/api/videos", videoRoutes);

app.use("/api/users", userRoutes);

const PORT = 3001
app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
})