import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { handleError } from "../utils/errorHandler";
import { requireAdmin } from "../middleware/auth-middleware";
import { User } from "@shared/schema";
import { hashPassword } from "../auth";

export const adminUserRouter = Router();

// User Admin Routes
adminUserRouter.get("/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    const sanitizedUsers = users.map((user: User) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(sanitizedUsers);
  } catch (error: any) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminUserRouter.get("/users/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error: any) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminUserRouter.post("/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { username, email, password, fullName } = req.body;
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUserByUsername = await storage.getUserByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const existingUserByEmail = await storage.getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = {
      username,
      email,
      password: hashedPassword,
      fullName,
      role: req.body.role || "user",
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      planId: req.body.planId || undefined,
    };

    const createdUser = await storage.createUser(newUser);

    await storage.createUserActivity({
      userId: req.user.id,
      activityType: "user_created",
      resourceId: createdUser.id,
      resourceType: "user",
      metadata: {
        username: createdUser.username,
        role: createdUser.role,
      },
    });

    const { password: _, ...userWithoutPassword } = createdUser;
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

adminUserRouter.patch("/users/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates: any = {};
    if (req.body.username) updates.username = req.body.username;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.fullName) updates.fullName = req.body.fullName;
    if (req.body.role) updates.role = req.body.role;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    if (req.body.planId) updates.planId = req.body.planId;
    if (req.body.planExpiresAt) updates.planExpiresAt = new Date(req.body.planExpiresAt);
    if (req.body.password) {
      updates.password = await hashPassword(req.body.password);
    }

    const updatedUser = await storage.updateUser(userId, updates);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await storage.createUserActivity({
      userId: req.user.id,
      activityType: "user_updated",
      resourceId: userId,
      resourceType: "user",
      metadata: { fields: Object.keys(updates) },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error: any) {
    res.status(500).json({ error: handleError(error) });
  }
});

adminUserRouter.delete("/users/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const userId = parseInt(req.params.id);
    if (req.user.id === userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const result = await storage.deleteUser(userId);
    if (!result) {
      return res.status(500).json({ error: "Failed to delete user" });
    }

    await storage.createUserActivity({
      userId: req.user.id,
      activityType: "user_deleted",
      resourceId: userId,
      resourceType: "user",
      metadata: { username: user.username },
    });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    if (error instanceof Error && error.message === "Cannot delete the last admin user") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: handleError(error) });
  }
});
