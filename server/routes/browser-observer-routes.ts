import { Router, Request, Response } from "express";
import { browserObserverService } from "../services/browser-observer-service";
import { storage } from "../storage";
import {
  insertBrowserActionSchema,
  insertBrowserSequenceSchema,
  insertBrowserSequenceStepSchema,
  insertBrowserSettingSchema
} from "@shared/schema";
import { z } from "zod";

export const browserObserverRouter = Router();

// Middleware for checking auth
const checkAuth = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// Record a browser action
browserObserverRouter.post("/action", async (req: Request, res: Response) => {
  try {
    // Set the Content-Type header explicitly to ensure JSON responses
    res.setHeader('Content-Type', 'application/json');

    // Allow anonymous recording with a sessionId for non-authenticated users
    const userId = req.user?.id || 0;

    const actionData = insertBrowserActionSchema.parse({
      ...req.body,
      userId
    });

    const action = await browserObserverService.recordAction(actionData);
    res.status(201).json(action);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error recording browser action:", error);
    res.status(500).json({ error: "Failed to record browser action" });
  }
});

// Record multiple browser actions
browserObserverRouter.post("/actions/batch", async (req: Request, res: Response) => {
  try {
    // Allow anonymous recording with a sessionId for non-authenticated users
    const userId = req.user?.id || 0;

    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: "Request body must be an array of actions" });
    }

    const actionsData = req.body.map(action => ({
      ...action,
      userId
    }));

    const actions = await browserObserverService.recordBatchActions(actionsData);
    res.status(201).json(actions);
  } catch (error) {
    console.error("Error recording batch browser actions:", error);
    res.status(500).json({ error: "Failed to record batch browser actions" });
  }
});

// Get recent actions (requires auth)
browserObserverRouter.get("/actions/recent", checkAuth, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const actions = await browserObserverService.getRecentActions(req.user.id, limit);
    res.json(actions);
  } catch (error) {
    console.error("Error getting recent browser actions:", error);
    res.status(500).json({ error: "Failed to get recent browser actions" });
  }
});

// Get actions for a specific session
browserObserverRouter.get("/actions/session/:sessionId", async (req: Request, res: Response) => {
  try {
    // Set the Content-Type header explicitly to ensure JSON responses
    res.setHeader('Content-Type', 'application/json');

    const { sessionId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    // If authenticated, ensure the session belongs to the user
    if (req.isAuthenticated()) {
      const actions = await browserObserverService.getSessionActions(sessionId, limit);

      // Check if any actions exist for this session
      if (actions.length > 0 && actions[0].userId !== req.user.id) {
        return res.status(403).json({ error: "You don't have permission to access this session" });
      }

      return res.json(actions);
    }

    // For anonymous users, just return the session actions
    const actions = await browserObserverService.getSessionActions(sessionId, limit);
    res.json(actions);
  } catch (error) {
    console.error("Error getting session browser actions:", error);
    res.status(500).json({ error: "Failed to get session browser actions" });
  }
});

// === SEQUENCES (require authentication) ===

// Create a sequence
browserObserverRouter.post("/sequences", checkAuth, async (req: Request, res: Response) => {
  try {
    const sequenceData = insertBrowserSequenceSchema.parse({
      ...req.body,
      userId: req.user.id
    });

    const sequence = await browserObserverService.createSequence(sequenceData);
    res.status(201).json(sequence);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating browser sequence:", error);
    res.status(500).json({ error: "Failed to create browser sequence" });
  }
});

// Get a specific sequence
browserObserverRouter.get("/sequences/:id", checkAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const sequence = await browserObserverService.getSequence(id);

    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    // Check ownership
    if (sequence.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to access this sequence" });
    }

    res.json(sequence);
  } catch (error) {
    console.error("Error getting browser sequence:", error);
    res.status(500).json({ error: "Failed to get browser sequence" });
  }
});

// Get all sequences for the current user
browserObserverRouter.get("/sequences", checkAuth, async (req: Request, res: Response) => {
  try {
    const sequences = await browserObserverService.getUserSequences(req.user.id);
    res.json(sequences);
  } catch (error) {
    console.error("Error getting user browser sequences:", error);
    res.status(500).json({ error: "Failed to get user browser sequences" });
  }
});

// Update a sequence
browserObserverRouter.patch("/sequences/:id", checkAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const sequence = await browserObserverService.getSequence(id);

    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    // Check ownership
    if (sequence.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to modify this sequence" });
    }

    const updates = req.body;
    const updatedSequence = await browserObserverService.updateSequence(id, updates);
    res.json(updatedSequence);
  } catch (error) {
    console.error("Error updating browser sequence:", error);
    res.status(500).json({ error: "Failed to update browser sequence" });
  }
});

// Delete a sequence
browserObserverRouter.delete("/sequences/:id", checkAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const sequence = await browserObserverService.getSequence(id);

    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    // Check ownership
    if (sequence.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to delete this sequence" });
    }

    const success = await browserObserverService.deleteSequence(id);

    if (success) {
      res.status(204).end();
    } else {
      res.status(404).json({ error: "Sequence not found" });
    }
  } catch (error) {
    console.error("Error deleting browser sequence:", error);
    res.status(500).json({ error: "Failed to delete browser sequence" });
  }
});

// === SEQUENCE STEPS ===

// Add steps to a sequence
browserObserverRouter.post("/sequences/:id/steps", checkAuth, async (req: Request, res: Response) => {
  try {
    const sequenceId = parseInt(req.params.id);
    const sequence = await browserObserverService.getSequence(sequenceId);

    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    // Check ownership
    if (sequence.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to modify this sequence" });
    }

    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: "Request body must be an array of steps" });
    }

    const stepsData = req.body.map(step => ({
      ...step,
      sequenceId
    }));

    const steps = await browserObserverService.addSequenceSteps(stepsData);
    res.status(201).json(steps);
  } catch (error) {
    console.error("Error adding browser sequence steps:", error);
    res.status(500).json({ error: "Failed to add browser sequence steps" });
  }
});

// Get steps for a sequence
browserObserverRouter.get("/sequences/:id/steps", checkAuth, async (req: Request, res: Response) => {
  try {
    const sequenceId = parseInt(req.params.id);
    const sequence = await browserObserverService.getSequence(sequenceId);

    if (!sequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    // Check ownership
    if (sequence.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to access this sequence" });
    }

    const steps = await browserObserverService.getSequenceSteps(sequenceId);
    res.json(steps);
  } catch (error) {
    console.error("Error getting browser sequence steps:", error);
    res.status(500).json({ error: "Failed to get browser sequence steps" });
  }
});

// Update a step
browserObserverRouter.patch("/steps/:id", checkAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const steps = await browserObserverService.getSequenceSteps(id);

    if (steps.length === 0) {
      return res.status(404).json({ error: "Step not found" });
    }

    const step = steps[0];
    const sequence = await browserObserverService.getSequence(step.sequenceId);

    // Check ownership
    if (sequence.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to modify this step" });
    }

    const updates = req.body;
    const updatedStep = await browserObserverService.updateSequenceStep(id, updates);
    res.json(updatedStep);
  } catch (error) {
    console.error("Error updating browser sequence step:", error);
    res.status(500).json({ error: "Failed to update browser sequence step" });
  }
});

// Delete a step
browserObserverRouter.delete("/steps/:id", checkAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    // First find the step to check ownership
    const steps = await browserObserverService.getSequenceSteps(id);

    if (steps.length === 0) {
      return res.status(404).json({ error: "Step not found" });
    }

    const step = steps[0];
    const sequence = await browserObserverService.getSequence(step.sequenceId);

    // Check ownership
    if (sequence.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to delete this step" });
    }

    const success = await browserObserverService.deleteSequenceStep(id);

    if (success) {
      res.status(204).end();
    } else {
      res.status(404).json({ error: "Step not found" });
    }
  } catch (error) {
    console.error("Error deleting browser sequence step:", error);
    res.status(500).json({ error: "Failed to delete browser sequence step" });
  }
});

// === AI SUGGESTIONS ===

// Generate AI suggestions
browserObserverRouter.post("/suggestions/generate", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const userId = req.user?.id || 0;
    const suggestions = await browserObserverService.generateAiSuggestions(userId, sessionId);
    res.json(suggestions);
  } catch (error) {
    console.error("Error generating AI suggestions:", error);
    res.status(500).json({ error: "Failed to generate AI suggestions" });
  }
});

// Get AI suggestions for the current user
browserObserverRouter.get("/suggestions", checkAuth, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as "pending" | "accepted" | "rejected" | "implemented" | undefined;
    const suggestions = await browserObserverService.getAiSuggestions(req.user.id, status);
    res.json(suggestions);
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    res.status(500).json({ error: "Failed to get AI suggestions" });
  }
});

// Update an AI suggestion status
browserObserverRouter.patch("/suggestions/:id/status", checkAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || !["pending", "accepted", "rejected", "implemented"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updatedSuggestion = await browserObserverService.updateAiSuggestionStatus(
      id,
      status as "pending" | "accepted" | "rejected" | "implemented"
    );

    res.json(updatedSuggestion);
  } catch (error) {
    console.error("Error updating AI suggestion status:", error);
    res.status(500).json({ error: "Failed to update AI suggestion status" });
  }
});

// Convert a session to a sequence
browserObserverRouter.post("/sessions/:sessionId/convert", checkAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Sequence name is required" });
    }

    const result = await browserObserverService.convertSessionToSequence(
      req.user.id,
      sessionId,
      name,
      description
    );

    res.status(201).json(result);
  } catch (error) {
    console.error("Error converting session to sequence:", error);
    res.status(500).json({ error: "Failed to convert session to sequence" });
  }
});

// === SETTINGS ===

// Get browser settings
browserObserverRouter.get("/settings", checkAuth, async (req: Request, res: Response) => {
  try {
    const settings = await browserObserverService.getSettings(req.user.id);
    res.json(settings);
  } catch (error) {
    console.error("Error getting browser settings:", error);
    res.status(500).json({ error: "Failed to get browser settings" });
  }
});

// Save browser settings
browserObserverRouter.post("/settings", checkAuth, async (req: Request, res: Response) => {
  try {
    const settingsData = insertBrowserSettingSchema.parse({
      ...req.body,
      userId: req.user.id
    });

    const settings = await browserObserverService.saveSettings(settingsData);
    res.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error saving browser settings:", error);
    res.status(500).json({ error: "Failed to save browser settings" });
  }
});
