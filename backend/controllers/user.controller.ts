import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getUserData = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, createdAt: true },
    });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
