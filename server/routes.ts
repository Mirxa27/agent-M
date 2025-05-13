import { NextFunction, Request, Response, Router, type Express } from "express";
import fs from "fs";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { hashPassword, setupAuth } from "./auth";
import config from "./config";
import { checkDatabaseConnection } from "./db";
import { storage } from "./storage";
import { handleError } from "./utils/errorHandler";
import { requireAdmin } from "./middleware/auth-middleware";

// Router imports
import { userRouter } from "./routes/user-routes";
import { agentRouter } from "./routes/agent-routes";
import { credentialRouter } from "./routes/credential-routes";
import { fileTemplateRouter } from "./routes/file-template-routes";
import { taskRouter } from "./routes/task-routes";
import { conversationRouter } from "./routes/conversation-routes";
import { adminMiscRouter } from "./routes/admin-misc-routes";
import { adminAiRouter } from "./routes/admin-ai-routes";
import { paymentRouter } from "./routes/payment-routes";
import { agentToolsRouter } from "./routes/agent-tools-routes";
import { aiUtilityRouter } from "./routes/ai-utility-routes";
import { chatbotRouter } from "./routes/chatbot-routes";
import { publicRouter } from "./routes/public-routes";
import { documentTemplateRouter } from "./routes/document-template-routes";
import { browserObserverRouter } from "./routes/browser-observer-routes";
import { browserAutomationRouter } from "./routes/browser-automation-routes";
import { workflowProgressRouter } from "./routes/workflow-progress-routes";
import { adminUserRouter } from "./routes/admin-user-routes";

// Configure multer for file uploads
const storage_engine = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage_engine,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req: Request, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, gif, svg) are allowed!"));
  }
});

export async function registerRoutes(app: Express): Promise<Server> {

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const dbStatus = await checkDatabaseConnection();
      if (!dbStatus) {
        return res.status(500).json({
          status: "error",
          database: "disconnected",
          message: "Database connection failed",
        });
      }

      return res.status(200).json({
        status: "ok",
        database: "connected",
        server: "running",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Health check error:", error);
      return res.status(500).json({
        status: "error",
        message: "Health check failed",
        details: handleError(error),
      });
    }
  });

  // Get site settings (public access)
  app.get("/api/site-settings", async (req, res) => {
    try {
      let settings = await storage.getSiteSettings();
      if (!settings) {
        settings = await storage.createDefaultSiteSettings();
      }
      const { updatedBy, ...publicSettings } = settings;
      res.json(publicSettings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Set up authentication routes
  setupAuth(app);

  // Simple endpoint to check if user has admin access - for testing
  app.get("/api/admin/check", requireAdmin, (req, res) => {
    const user = req.user!;
    res.json({
      success: true,
      message: "You have admin access",
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  });

  // Upload logo endpoint
  app.post("/api/admin/upload-logo", requireAdmin, upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      const existingSettings = await storage.getSiteSettings();
      if (existingSettings) {
        await storage.updateSiteSettings({
          logo: { ...(existingSettings.logo || {}), url: fileUrl },
        });
      }
      res.status(200).json({ success: true, url: fileUrl, message: "Logo uploaded successfully" });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Mount routers
  app.use("/api", userRouter);
  app.use("/api", agentRouter);
  app.use("/api", credentialRouter);
  app.use("/api", fileTemplateRouter);
  app.use("/api", taskRouter);
  app.use("/api", conversationRouter);
  app.use("/api/admin", adminMiscRouter);
  app.use("/api/admin", adminAiRouter);
  app.use("/api", paymentRouter);
  app.use("/api", aiUtilityRouter);
  app.use("/api", agentToolsRouter);
  app.use("/api", publicRouter);
  app.use("/api", chatbotRouter);
  app.use("/api", documentTemplateRouter);
  app.use("/api/browser-observer", browserObserverRouter);
  app.use("/api/browser-automation", browserAutomationRouter);
  app.use("/api/workflow-progress", workflowProgressRouter);
  app.use("/api/admin", adminUserRouter);

  // Admin Router for super admin functionalities
  const adminRouter = Router();

  adminRouter.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (username === config.admin.username && password === config.admin.password) {
      if (req.session) {
        req.session.isAdmin = true;
        res.json({ success: true, message: "Admin login successful" });
      } else {
        res.status(500).json({ error: "Session not available" });
      }
    } else {
      res.status(401).json({ error: "Invalid admin credentials" });
    }
  });

  adminRouter.post("/logout", (req, res) => {
    if (req.session) {
      req.session.isAdmin = false;
      res.json({ success: true, message: "Admin logout successful" });
    } else {
      res.status(500).json({ error: "Session not available" });
    }
  });

  const requireSuperAdmin = (req: any, res: Response, next: NextFunction) => {
    if (req.session && req.session.isAdmin) {
      next();
    } else {
      res.status(403).json({ error: "Super admin access required" });
    }
  };

  adminRouter.get("/dashboard-access-check", requireSuperAdmin, (req, res) => {
    res.json({ success: true, message: "Welcome to the admin dashboard!" });
  });

  app.use("/api/admin", adminRouter);

  const httpServer = createServer(app);
  return httpServer;
}
