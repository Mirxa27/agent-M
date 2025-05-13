import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { handleError } from "../utils/errorHandler";
import { requireAuth } from "../middleware/auth-middleware";
import { insertConversationSchema, insertMessageSchema, Message, Task, AgentTool } from "@shared/schema";
import aiService, { AIProvider } from "../services/ai-service";
import { AIMessage, AgentResponse } from "../services/openai-service"; // Assuming this is where AgentResponse is defined
import config from "../config";

// Define AgentConfig locally if not centrally available and imported
interface AgentConfig {
  provider: AIProvider;
  model?: string;
  systemInstructions?: string;
  tools?: AgentTool[];
}

export const conversationRouter = Router();

// Conversation routes (for direct agent chat)
conversationRouter.get("/conversations", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    const agentId = req.query.agentId ? parseInt(req.query.agentId as string) : undefined;
    const conversations = await storage.getConversationsByUserId(req.user.id, agentId);
    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

conversationRouter.post("/conversations", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    const { agentId, title } = req.body;
    if (!agentId) {
      return res.status(400).json({ error: "Agent ID is required" });
    }
    const agent = await storage.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    const validatedData = insertConversationSchema.safeParse({
      userId: req.user.id,
      agentId: agentId,
      title: title || `Conversation with ${agent.name}`,
    });
    if (!validatedData.success) {
      return res.status(400).json({ error: "Validation failed", details: validatedData.error.format() });
    }
    const conversation = await storage.createConversation(validatedData.data);
    res.status(201).json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

conversationRouter.get("/conversations/:conversationId", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    const conversationId = parseInt(req.params.conversationId);
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    if (conversation.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    res.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

conversationRouter.get("/conversations/:conversationId/messages", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    const conversationId = parseInt(req.params.conversationId);
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    if (conversation.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const messages = await storage.getMessagesByConversationId(conversationId);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching conversation messages:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

conversationRouter.post("/conversations/:conversationId/messages", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    const conversationId = parseInt(req.params.conversationId);
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    if (conversation.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const validatedData = insertMessageSchema.safeParse({
      ...req.body,
      conversationId: conversationId,
      role: 'user',
    });
    if (!validatedData.success) {
      return res.status(400).json({ error: "Validation failed", details: validatedData.error.format() });
    }
    const userMessage = await storage.createMessage(validatedData.data);
    await storage.updateConversation(conversationId, { updatedAt: new Date() });

    setTimeout(async () => {
      try {
        const agent = await storage.getAgent(conversation.agentId);
        if (!agent) {
          console.error(`Agent ${conversation.agentId} not found for conversation ${conversationId}`);
          return;
        }
        const conversationHistory = await storage.getMessagesByConversationId(conversationId);
        const messagesForAI: AIMessage[] = [];
        if ((agent.config as any)?.systemPrompt) {
          messagesForAI.push({ role: "system", content: (agent.config as any).systemPrompt });
        }
        conversationHistory.forEach((msg: Message) => {
          if ((msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string') {
            messagesForAI.push({ role: msg.role, content: msg.content });
          }
        });
        const dummyTask: Task = {
          id: 0,
          title: `Conversation ${conversationId}`,
          description: userMessage.content!, // Assert content is not null
          status: "in_progress",
          userId: req.user!.id,
          agentId: agent.id,
          createdAt: new Date(),
          completedAt: null,
          result: null
        };
        const provider = (agent.config as any)?.provider as AIProvider || 'openai';
        const model = (agent.config as any)?.model || config.ai[provider as keyof typeof config.ai]?.defaultModel || 'gpt-4o';
        const agentConfig: AgentConfig = {
          provider: provider,
          model: model,
          systemInstructions: (agent.config as any)?.systemPrompt || undefined,
          tools: (agent.tools as AgentTool[]) || []
        };
        const aiResponse: AgentResponse = await aiService.processTask(dummyTask, agentConfig, messagesForAI);
        if (aiResponse.content && typeof aiResponse.content === 'string') {
          await storage.createMessage({
            taskId: 0, // Or null if schema allows
            conversationId: conversationId,
            role: 'assistant',
            content: aiResponse.content,
          });
          await storage.updateConversation(conversationId, { updatedAt: new Date() });
        } else {
          console.error(`AI service returned no content or invalid content for conversation ${conversationId}`);
          await storage.createMessage({
            taskId: 0, // Or null if schema allows
            conversationId: conversationId,
            role: 'assistant',
            content: "I encountered an issue and couldn't generate a response. Please try again later.",
            metadata: { error: "AI returned no content or invalid content" }
          });
        }
      } catch (processingError) {
        console.error(`Error processing agent response for conversation ${conversationId}:`, handleError(processingError));
        try {
          await storage.createMessage({
            taskId: 0, // Or null if schema allows
            conversationId: conversationId,
            role: 'assistant',
            content: "I encountered an error while processing your request. Please try again.",
            metadata: { error: handleError(processingError) }
          });
        } catch (storeErrorError) {
          console.error(`Failed to store error message for conversation ${conversationId}:`, storeErrorError);
        }
      }
    }, 0);
    res.status(201).json({ message: userMessage, processing: true });
  } catch (error) {
    console.error("Error posting conversation message:", error);
    res.status(500).json({ error: handleError(error) });
  }
});
