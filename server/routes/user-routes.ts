import express, { NextFunction, Request, Response, Router } from "express";
import { storage } from "../storage";
import { hashPassword } from "../auth"; // For password updates in profile
import { handleError } from "../utils/errorHandler"; // Assuming handleError is moved to a utility file

import { requireAuth } from "../middleware/auth-middleware"; // Import from new location

export const userRouter = Router();

// Get user profile
userRouter.get("/profile", requireAuth, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" });
  }
  const userWithoutPassword = {
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    fullName: req.user.fullName,
    planId: req.user.planId,
    planExpiresAt: req.user.planExpiresAt,
    role: req.user.role,
    isActive: req.user.isActive,
  };
  res.json(userWithoutPassword);
});

// Update user profile
userRouter.patch("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const updates: Record<string, any> = {};
    if (req.body.fullName) updates.fullName = req.body.fullName;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.password) {
      updates.password = await hashPassword(req.body.password);
    }

    const updatedUser = await storage.updateUser(req.user.id, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

// User Activity & Dashboard Routes (subset related to user preferences)
userRouter.get("/user/activity", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { limit } = req.query;
      const activities = await storage.getUserActivitiesByUserId(
        req.user.id,
        limit ? parseInt(limit.toString()) : 10,
      );
      res.json(activities);
    } catch (error: any) {
      console.error("Error retrieving user activities:", error);
      res.status(500).json({
        error: handleError(error),
      });
    }
  });

userRouter.get("/user/analytics", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const analytics = await storage.getUserAnalytics(req.user.id, "all");
      res.json(analytics || { message: "No analytics data available yet" });
    } catch (error: any) {
      console.error("Error retrieving user analytics:", error);
      res.status(500).json({
        error: handleError(error),
      });
    }
  });

// Dashboard preferences routes (moved from dynamic import)
// Get user dashboard preferences
userRouter.get("/user/dashboard/preferences", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).send({ error: "Not authenticated" });
    }
    // Assuming dashboard service logic is now directly in storage or this router
    let preferences = await storage.getDashboardPreference(req.user.id);

    if (!preferences) {
      // Create default preferences if none exist
      const defaultPreferences = {
        userId: req.user.id,
        layout: { columns: 2, showWelcome: true, compactView: false },
        favoriteAgents: [],
        recentTasks: [],
        widgets: [
          { id: "activity", position: 0, enabled: true },
          { id: "stats", position: 1, enabled: true },
          { id: "quickActions", position: 2, enabled: true },
          { id: "recentFiles", position: 3, enabled: true },
          { id: "agentStatus", position: 4, enabled: true },
        ],
        theme: "system",
        updatedAt: new Date(),
      };
      // Cast to any to satisfy InsertDashboardPreference if types are slightly off
      preferences = await storage.createDashboardPreference(defaultPreferences as any);
    }
    res.json(preferences);
  } catch (error) {
    console.error("Error fetching dashboard preferences:", error);
    res.status(500).send({ error: handleError(error) });
  }
});

// Update user dashboard preferences
userRouter.patch("/user/dashboard/preferences", requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send({ error: "Not authenticated" });
  }
  try {
    const updates = req.body;
    // Assuming dashboard service logic is now directly in storage or this router
    const updated = await storage.updateDashboardPreference(req.user.id, updates);
    res.json(updated);
  } catch (error) {
    console.error("Error updating dashboard preferences:", error);
    res.status(500).send({ error: handleError(error) });
  }
});

// Add agent to favorites
userRouter.post("/user/dashboard/favorites/agent/:agentId", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { agentId } = req.params;
      if (!agentId) {
        return res.status(400).json({ error: "Agent ID is required" });
      }
      const agent = await storage.getAgent(parseInt(agentId));
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      if (agent.userId !== req.user.id) {
        return res.status(403).json({ error: "You don't have access to this agent" });
      }
      let preferences = await storage.getDashboardPreference(req.user.id);
      if (!preferences) {
        const defaultPreferences = {
          userId: req.user.id,
          layout: { columns: 2, showWelcome: true, compactView: false },
          favoriteAgents: [parseInt(agentId)],
          recentTasks: [],
          widgets: [
            { id: "activity", position: 0, enabled: true },
            { id: "stats", position: 1, enabled: true },
            { id: "quickActions", position: 2, enabled: true },
            { id: "recentFiles", position: 3, enabled: true },
            { id: "agentStatus", position: 4, enabled: true },
          ],
          theme: "system",
          updatedAt: new Date(),
        };
        preferences = await storage.createDashboardPreference(defaultPreferences as any);
        return res.json({ success: true, favorites: preferences.favoriteAgents });
      }
      const currentFavorites = (preferences.favoriteAgents as any[]) || [];
      const agentIdNum = parseInt(agentId);
      if (currentFavorites.includes(agentIdNum)) {
        return res.json({ success: true, favorites: currentFavorites });
      }
      const updatedFavorites = [...currentFavorites, agentIdNum].slice(-5);
      await storage.updateDashboardPreference(preferences.id as number, { // Assuming id is number
        favoriteAgents: updatedFavorites,
        updatedAt: new Date(),
      });
      res.json({ success: true, favorites: updatedFavorites });
    } catch (error: any) {
      console.error("Error adding agent to favorites:", error);
      res.status(500).json({
        error: "Failed to add agent to favorites",
        details: handleError(error),
      });
    }
  },
);

// Remove agent from favorites
userRouter.delete("/user/dashboard/favorites/agent/:agentId", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { agentId } = req.params;
      if (!agentId) {
        return res.status(400).json({ error: "Agent ID is required" });
      }
      const preferences = await storage.getDashboardPreference(req.user.id);
      if (!preferences) {
        return res.status(404).json({ error: "Dashboard preferences not found" });
      }
      const currentFavorites = (preferences.favoriteAgents as any[]) || [];
      const agentIdNum = parseInt(agentId);
      const updatedFavorites = currentFavorites.filter(
        (id) => id !== agentIdNum,
      );
      await storage.updateDashboardPreference(preferences.id as number, { // Assuming id is number
        favoriteAgents: updatedFavorites,
        updatedAt: new Date(),
      });
      res.json({ success: true, favorites: updatedFavorites });
    } catch (error: any) {
      console.error("Error removing agent from favorites:", error);
      res.status(500).json({
        error: "Failed to remove agent from favorites",
        details: handleError(error),
      });
    }
  },
);
