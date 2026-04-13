import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// FAKING AUTH
const CURRENT_USER_ID = 1;

export const addComment = async (req: Request, res: Response) => {
    // to be continued
}