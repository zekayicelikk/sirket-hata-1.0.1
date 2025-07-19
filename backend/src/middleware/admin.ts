import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Sadece admin erişebilir" });
  }
  next();
};

