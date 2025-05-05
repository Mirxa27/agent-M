import express, { NextFunction, type Request, Response } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { log, serveStatic, setupVite } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files from the public directory
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  // Store the original function correctly
  const originalJson = res.json;

  // Wrap res.json
  res.json = (body) => {
    // Call the original function with the correct context ('this') and arguments
    return originalJson.call(res, body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      // Note: Body logging is removed in this simplified version

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine); // Assuming 'log' function is defined elsewhere
    }
  });

  next();
});

// Add validation to ensure that the request-target is valid and does not bypass server.fs.deny
app.use((req, res, next) => {
  const requestTarget = req.originalUrl;
  const denyList = ["/server/fs/deny", "/server/fs/inline", "/server/fs/raw"];

  if (denyList.some((denyPath) => requestTarget.includes(denyPath))) {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
