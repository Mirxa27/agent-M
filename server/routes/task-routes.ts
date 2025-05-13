import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { handleError } from "../utils/errorHandler";
import { requireAuth } from "../middleware/auth-middleware";
import { insertTaskSchema, insertMessageSchema, Task, Message } from "@shared/schema";
import { processAgentTask } from "../agent-task-processor";

export const taskRouter = Router();

// Task routes
taskRouter.get("/tasks", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const tasks = await storage.getTasksByUserId(req.user.id, limit);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

// This route is specific to an agent's tasks.
// It could also live in agent-routes.ts, but keeping task-related logic together.
taskRouter.get("/agents/:agentId/tasks", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const agentId = parseInt(req.params.agentId);
    const agent = await storage.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    if (agent.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const tasks = await storage.getTasksByAgentId(agentId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

taskRouter.get("/tasks/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const task = await storage.getTask(parseInt(req.params.id));
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    if (task.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

taskRouter.post("/tasks", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const agent = await storage.getAgent(req.body.agentId);
    if (!agent || agent.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to use this agent" });
    }
    const validatedData = insertTaskSchema.safeParse({
      ...req.body,
      userId: req.user.id,
    });
    if (!validatedData.success) {
      return res.status(400).json({ error: "Validation failed", details: validatedData.error.format() });
    }
    const task = await storage.createTask(validatedData.data);
    await storage.createUserActivity({
      userId: req.user.id,
      activityType: "task_created",
      resourceId: task.id,
      resourceType: "task",
      metadata: { agentId: task.agentId, status: task.status },
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

taskRouter.patch("/tasks/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const taskId = parseInt(req.params.id);
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    if (task.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const updatedTask = await storage.updateTask(taskId, req.body);
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

// Message routes for tasks
taskRouter.get("/tasks/:taskId/messages", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const taskId = parseInt(req.params.taskId);
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    if (task.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const messages = await storage.getMessagesByTaskId(taskId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

taskRouter.post("/tasks/:taskId/messages", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const taskId = parseInt(req.params.taskId);
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    if (task.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const validatedData = insertMessageSchema.safeParse({
      ...req.body,
      taskId, // taskId is part of the path, not body
    });
    if (!validatedData.success) {
      return res.status(400).json({ error: "Validation failed", details: validatedData.error.format() });
    }
    const message = await storage.createMessage(validatedData.data);
    if (validatedData.data.role === 'user') {
      if (task.status === 'completed' || task.status === 'failed') {
        await storage.updateTask(taskId, { status: "pending" });
      }
      setTimeout(async () => {
        try {
          await processAgentTask(taskId, storage);
        } catch (error) {
          console.error('Error processing agent task:', handleError(error));
          await storage.updateTask(taskId, { status: "failed", result: JSON.stringify({ error: handleError(error) }) });
        }
      }, 0);
      res.status(201).json({ message, taskStatus: "pending", processing: true });
    } else {
      res.status(201).json(message);
    }
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

// Endpoint to explicitly execute a task with an agent
taskRouter.post("/tasks/:taskId/execute", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const taskId = parseInt(req.params.taskId);
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    if (task.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    await storage.updateTask(taskId, { status: "pending" });
    setTimeout(async () => {
      try {
        await processAgentTask(taskId, storage);
      } catch (error) {
        console.error('Error executing agent task:', handleError(error));
        await storage.updateTask(taskId, { status: "failed", result: JSON.stringify({ error: handleError(error) }) });
      }
    }, 0);
    res.json({ message: "Task execution initiated", task: { id: task.id, status: "pending" } });
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

// Task-File relationship routes
taskRouter.get("/tasks/:taskId/files", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const taskId = parseInt(req.params.taskId);
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    if (task.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const files = await storage.getFilesByTaskId(taskId);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

taskRouter.post("/tasks/:taskId/files/:fileId", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const taskId = parseInt(req.params.taskId);
    const fileId = parseInt(req.params.fileId);
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    if (task.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to access this task" });
    }
    const file = await storage.getFile(fileId);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    if (file.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to access this file" });
    }
    const taskFile = await storage.linkFileToTask(taskId, fileId);
    res.status(201).json({ success: true, taskFile });
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});

taskRouter.delete("/tasks/:taskId/files/:fileId", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const taskId = parseInt(req.params.taskId);
    const fileId = parseInt(req.params.fileId);
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    if (task.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to access this task" });
    }
    const success = await storage.unlinkFileFromTask(taskId, fileId);
    if (!success) {
      return res.status(404).json({ error: "File not linked to task" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: handleError(error) });
  }
});
