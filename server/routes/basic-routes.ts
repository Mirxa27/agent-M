import { Router } from "express";
import { checkDatabaseConnection } from "../db";
import { storage } from "../storage";

// Simple utility to extract error message safely
const handleError = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error occurred";

const router = Router();

// Health check endpoint - useful for deployment monitoring
router.get("/api/health", async (_req, res) => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus) {
      return res.status(500).json({
        status: "error",
        database: "disconnected",
        message: "Database connection failed",
      });
    }

    res.status(200).json({
      status: "ok",
      database: "connected",
      server: "running",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      details: handleError(error),
    });
  }
});

// Public endpoint to get site settings
router.get("/api/site-settings", async (_req, res) => {
  try {
    // Retrieve settings or create default
    let settings = await storage.getSiteSettings();
    if (!settings) {
      console.log("No site settings found, creating default settings");
      settings = await storage.createDefaultSiteSettings();
    }

    // Remove sensitive fields
    const { updatedBy, ...publicSettings } = settings;
    res.json(publicSettings);
  } catch (error) {
    console.error("Error fetching site settings:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

export default router;