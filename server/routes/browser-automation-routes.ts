import { Router, Request, Response } from "express";
import { browserAutomationService } from "../services/browser-automation-service";
import { browserObserverService } from "../services/browser-observer-service";
import { z } from "zod";

export const browserAutomationRouter = Router();

// Middleware for checking auth
const checkAuth = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// Run a browser sequence
browserAutomationRouter.post("/sequences/:id/run", checkAuth, async (req: Request, res: Response) => {
  try {
    const sequenceId = parseInt(req.params.id);
    
    // Get the sequence
    const sequence = await browserObserverService.getSequence(sequenceId);
    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }
    
    // Check ownership
    if (sequence.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to run this sequence" });
    }
    
    // Get sequence steps
    const steps = await browserObserverService.getSequenceSteps(sequenceId);
    if (steps.length === 0) {
      return res.status(400).json({ error: "Sequence has no steps to execute" });
    }
    
    // Run the sequence
    const result = await browserAutomationService.runSequence(sequence, steps);
    
    res.json(result);
  } catch (error) {
    console.error("Error running browser sequence:", error);
    res.status(500).json({ error: "Failed to run browser sequence" });
  }
});

// Take a screenshot of a web page
browserAutomationRouter.post("/screenshot", checkAuth, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      url: z.string().url(),
      sessionId: z.string().optional(),
    });
    
    const { url, sessionId } = schema.parse(req.body);
    
    const screenshot = await browserAutomationService.captureScreenshot(url, sessionId);
    
    res.json({ screenshot });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error capturing screenshot:", error);
    res.status(500).json({ error: "Failed to capture screenshot" });
  }
});

// Extract data from a web page
browserAutomationRouter.post("/extract", checkAuth, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      url: z.string().url(),
      selectors: z.record(z.string()),
    });
    
    const { url, selectors } = schema.parse(req.body);
    
    const data = await browserAutomationService.extractData(url, selectors);
    
    res.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error extracting data:", error);
    res.status(500).json({ error: "Failed to extract data" });
  }
});

// Launch browser session
browserAutomationRouter.post("/sessions", checkAuth, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      sessionId: z.string(),
    });
    
    const { sessionId } = schema.parse(req.body);
    
    await browserAutomationService.launchBrowser(sessionId);
    
    res.json({ success: true, message: "Browser session started" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error launching browser session:", error);
    res.status(500).json({ error: "Failed to launch browser session" });
  }
});

// Close browser session
browserAutomationRouter.delete("/sessions/:sessionId", checkAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    await browserAutomationService.closeBrowser(sessionId);
    
    res.json({ success: true, message: "Browser session closed" });
  } catch (error) {
    console.error("Error closing browser session:", error);
    res.status(500).json({ error: "Failed to close browser session" });
  }
});