import { NextFunction, Request, Response } from "express";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Not authorized" });
  }
  next();
};
