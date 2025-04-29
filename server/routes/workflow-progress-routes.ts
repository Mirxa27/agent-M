import { Router, Request, Response } from "express";
import { workflowProgressService } from "../services/workflow-progress-service";
import { insertWorkflowExecutionSchema } from "@shared/schema";
import { z } from "zod";

export const workflowProgressRouter = Router();

// Middleware to check authentication
const checkAuth = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// Create a new workflow execution
workflowProgressRouter.post("/executions", checkAuth, async (req: Request, res: Response) => {
  try {
    // Set the Content-Type header explicitly to ensure JSON responses
    res.setHeader('Content-Type', 'application/json');
    
    const executionData = insertWorkflowExecutionSchema.parse({
      ...req.body,
      userId: req.user!.id
    });

    const execution = await workflowProgressService.startExecution(executionData);
    res.status(201).json(execution);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating workflow execution:", error);
    res.status(500).json({ error: "Failed to create workflow execution" });
  }
});

// Get a specific execution
workflowProgressRouter.get("/executions/:id", checkAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const execution = await workflowProgressService.getExecution(id);
    
    if (!execution) {
      return res.status(404).json({ error: "Execution not found" });
    }
    
    // Check ownership
    if (execution.userId !== req.user!.id) {
      return res.status(403).json({ error: "You don't have permission to access this execution" });
    }
    
    res.json(execution);
  } catch (error) {
    console.error("Error getting workflow execution:", error);
    res.status(500).json({ error: "Failed to get workflow execution" });
  }
});

// Get executions for current user
workflowProgressRouter.get("/executions", checkAuth, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const executions = await workflowProgressService.getUserExecutions(req.user!.id, limit);
    res.json(executions);
  } catch (error) {
    console.error("Error getting user workflow executions:", error);
    res.status(500).json({ error: "Failed to get user workflow executions" });
  }
});

// Get executions for a specific sequence
workflowProgressRouter.get("/sequences/:sequenceId/executions", checkAuth, async (req: Request, res: Response) => {
  try {
    const sequenceId = parseInt(req.params.sequenceId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // TODO: Check if user has access to the sequence
    
    const executions = await workflowProgressService.getSequenceExecutions(sequenceId, limit);
    res.json(executions);
  } catch (error) {
    console.error("Error getting sequence workflow executions:", error);
    res.status(500).json({ error: "Failed to get sequence workflow executions" });
  }
});

// Get all step executions for a workflow
workflowProgressRouter.get("/executions/:id/steps", checkAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const execution = await workflowProgressService.getExecution(id);
    
    if (!execution) {
      return res.status(404).json({ error: "Execution not found" });
    }
    
    // Check ownership
    if (execution.userId !== req.user!.id) {
      return res.status(403).json({ error: "You don't have permission to access this execution" });
    }
    
    const steps = await workflowProgressService.getStepExecutions(id);
    res.json(steps);
  } catch (error) {
    console.error("Error getting workflow execution steps:", error);
    res.status(500).json({ error: "Failed to get workflow execution steps" });
  }
});

// Update a step execution status
workflowProgressRouter.patch("/executions/:executionId/steps/:stepId", checkAuth, async (req: Request, res: Response) => {
  try {
    const executionId = parseInt(req.params.executionId);
    const stepId = parseInt(req.params.stepId);
    
    const execution = await workflowProgressService.getExecution(executionId);
    
    if (!execution) {
      return res.status(404).json({ error: "Execution not found" });
    }
    
    // Check ownership
    if (execution.userId !== req.user!.id) {
      return res.status(403).json({ error: "You don't have permission to access this execution" });
    }
    
    const { status, result, error, screenshot } = req.body;
    
    let updatedStep;
    
    if (status === "running") {
      updatedStep = await workflowProgressService.startStepExecution(executionId, stepId);
    } else if (status === "completed") {
      updatedStep = await workflowProgressService.completeStepExecution(executionId, stepId, result, screenshot);
    } else if (status === "failed") {
      if (!error) {
        return res.status(400).json({ error: "Error message required for failed steps" });
      }
      updatedStep = await workflowProgressService.failStepExecution(executionId, stepId, error, screenshot);
    } else {
      return res.status(400).json({ error: "Invalid status. Must be 'running', 'completed', or 'failed'" });
    }
    
    res.json(updatedStep);
  } catch (error) {
    console.error("Error updating workflow step execution:", error);
    res.status(500).json({ error: "Failed to update workflow step execution" });
  }
});

// Add a log entry to a step execution
workflowProgressRouter.post("/executions/:executionId/steps/:stepId/logs", checkAuth, async (req: Request, res: Response) => {
  try {
    const executionId = parseInt(req.params.executionId);
    const stepId = parseInt(req.params.stepId);
    
    const execution = await workflowProgressService.getExecution(executionId);
    
    if (!execution) {
      return res.status(404).json({ error: "Execution not found" });
    }
    
    // Check ownership
    if (execution.userId !== req.user!.id) {
      return res.status(403).json({ error: "You don't have permission to access this execution" });
    }
    
    const { message, level } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Log message is required" });
    }
    
    const logEntry = {
      message,
      level: level || "info",
      timestamp: new Date().toISOString()
    };
    
    const updatedStep = await workflowProgressService.addStepLog(executionId, stepId, logEntry);
    res.json(updatedStep);
  } catch (error) {
    console.error("Error adding log to workflow step:", error);
    res.status(500).json({ error: "Failed to add log to workflow step" });
  }
});