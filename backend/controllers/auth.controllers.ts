import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export const registerUser = async (req: Request, res: Response) => {
  const { username, password, email } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Incomplete credentials sent." });
  }

  try {
    const isEmailAlreadyExist = await prisma.user.findUnique({
      where: { email },
    });
    if (isEmailAlreadyExist) {
      return res.status(400).json({ error: "User already registered!" });
    }

    const isAlreadyUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (isAlreadyUsername) {
      return res.status(400).json({ error: "Username already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { username, passwordHash: hashedPassword, email },
    });

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: newUser.id, username: newUser.username },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to register user" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Incomplete Credentials" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to login user" });
  }
};
