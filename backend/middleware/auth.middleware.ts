import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'development') {
    console.warn("[dev] Using insecure fallback JWT_SECRET")
  } else {
    throw new Error('JWT_SECRET is required')
  }
}
const finalSecret = JWT_SECRET || "dev_only_jwt_secret_change_me";

export interface AuthenticatedRequest extends Request {
  internalUserId?: number;
}

export const resolveDbUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided. Please log in." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, finalSecret) as { userId: number };
    req.internalUserId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

// Optional auth — attaches userId if token present, but does NOT block unauthenticated requests.
// Use this on endpoints that work for guests too but improve with a logged-in user.
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, finalSecret) as { userId: number };
      req.internalUserId = decoded.userId;
    } catch {
      // Invalid token — just ignore, treat as guest
    }
  }
  next();
};
