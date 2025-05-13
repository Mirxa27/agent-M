import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { handleError } from "../utils/errorHandler";
import { requireAuth } from "../middleware/auth-middleware";
import { credentialService, SERVICE_TYPES } from "../services/credential-service";
import { gmailService } from "../services/gmail-service";
import { encrypt, decrypt } from "../../shared/crypto";
import { insertCredentialSchema, Credential } from "@shared/schema";

export const credentialRouter = Router();

// General Credential routes
credentialRouter.get("/credentials", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const credentials = await storage.getCredentialsByUserId(req.user.id);
    const sanitizedCredentials = credentials.map((cred: Credential) => {
      const { data, ...rest } = cred;
      return rest;
    });
    res.json(sanitizedCredentials);
  } catch (error) {
    console.error("Error fetching credentials:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

credentialRouter.get("/credentials/service/:type", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const serviceType = req.params.type;
    if (!Object.values(SERVICE_TYPES).includes(serviceType)) {
      return res.status(400).json({ error: "Invalid service type" });
    }
    const credentials = await credentialService.listCredentials(req.user.id, serviceType);
    res.json(credentials);
  } catch (error) {
    console.error(`Error fetching ${req.params.type} credentials:`, error);
    res.status(500).json({ error: `Failed to fetch ${req.params.type} credentials` });
  }
});

credentialRouter.get("/credentials/expiring", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const daysThreshold = req.query.days ? parseInt(req.query.days.toString()) : 7;
    const expiringCredentials = await credentialService.getExpiringCredentials(req.user.id, daysThreshold);
    res.json(expiringCredentials);
  } catch (error) {
    console.error("Error fetching expiring credentials:", error);
    res.status(500).json({ error: "Failed to fetch expiring credentials" });
  }
});

credentialRouter.get("/credentials/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const credential = await storage.getCredential(parseInt(req.params.id));
    if (!credential) {
      return res.status(404).json({ error: "Credential not found" });
    }
    if (credential.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    try {
      const decryptedData = decrypt(credential.data);
      let parsedData;
      try {
        parsedData = JSON.parse(decryptedData);
      } catch (parseError) {
        console.error("Error parsing credential data:", parseError);
        return res.status(500).json({ error: "Credential data is corrupted or invalid" });
      }
      res.json({ ...credential, data: parsedData });
    } catch (decryptError) {
      console.error("Error decrypting credential:", decryptError);
      return res.status(500).json({ error: "Failed to decrypt credential data" });
    }
  } catch (error) {
    console.error("Error retrieving credential:", error);
    res.status(500).json({ error: "Failed to retrieve credential" });
  }
});

credentialRouter.post("/credentials", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    if (!req.body.data || !req.body.name || !req.body.type) {
      return res.status(400).json({ error: "Validation failed", details: "Missing required fields (name, type, and data)" });
    }
    try {
      const encryptedData = encrypt(JSON.stringify(req.body.data));
      const validatedData = insertCredentialSchema.safeParse({
        userId: req.user.id,
        name: req.body.name,
        type: req.body.type,
        data: encryptedData,
        // authMethod and service are optional in insertCredentialSchema, will use defaults or be null
      });
      if (!validatedData.success) {
        return res.status(400).json({ error: "Validation failed", details: validatedData.error.format() });
      }
      const credential = await storage.createCredential(validatedData.data);
      await storage.createUserActivity({
        userId: req.user.id,
        activityType: "credential_created",
        resourceId: credential.id,
        resourceType: "credential",
        metadata: { name: credential.name, type: credential.type },
      });
      const { data, ...credentialWithoutData } = credential;
      res.status(201).json(credentialWithoutData);
    } catch (encryptError) {
      console.error("Error encrypting credential data:", encryptError);
      return res.status(500).json({ error: "Failed to secure credential data" });
    }
  } catch (error) {
    console.error("Error creating credential:", error);
    res.status(500).json({ error: "Failed to create credential" });
  }
});

credentialRouter.patch("/credentials/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const credentialId = parseInt(req.params.id);
    const credential = await storage.getCredential(credentialId);
    if (!credential) {
      return res.status(404).json({ error: "Credential not found" });
    }
    if (credential.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    try {
      const updates: Partial<Credential> = {}; // Use Partial<Credential> for type safety
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.type !== undefined) updates.type = req.body.type;
      if (req.body.authMethod !== undefined) updates.authMethod = req.body.authMethod;
      if (req.body.service !== undefined) updates.service = req.body.service;
      if (req.body.expiresAt !== undefined) updates.expiresAt = new Date(req.body.expiresAt);


      if (req.body.data) {
        updates.data = encrypt(JSON.stringify(req.body.data));
      }
      const updatedCredential = await storage.updateCredential(credentialId, updates);
      if (!updatedCredential) {
        return res.status(404).json({ error: "Credential not found after update attempt" });
      }
      await storage.createUserActivity({
        userId: req.user.id,
        activityType: "credential_updated",
        resourceId: credentialId,
        resourceType: "credential",
        metadata: { name: updatedCredential.name, type: updatedCredential.type },
      });
      const { data, ...credentialWithoutData } = updatedCredential;
      res.json(credentialWithoutData);
    } catch (encryptError) {
      console.error("Error encrypting credential data:", encryptError);
      return res.status(500).json({ error: "Failed to secure credential data" });
    }
  } catch (error) {
    console.error("Error updating credential:", error);
    res.status(500).json({ error: "Failed to update credential" });
  }
});

credentialRouter.delete("/credentials/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const credentialId = parseInt(req.params.id);
    const credential = await storage.getCredential(credentialId);
    if (!credential) {
      return res.status(404).json({ error: "Credential not found" });
    }
    if (credential.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }
    await storage.deleteCredential(credentialId);
    await storage.createUserActivity({
      userId: req.user.id,
      activityType: "credential_deleted",
      resourceId: credentialId,
      resourceType: "credential",
      metadata: { name: credential.name, type: credential.type },
    });
    res.sendStatus(204);
  } catch (error) {
    console.error("Error deleting credential:", error);
    res.status(500).json({ error: "Failed to delete credential" });
  }
});

// Gmail service-specific routes (mounted under /services/gmail)
const gmailRouter = Router();

gmailRouter.post("/credentials", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { name, email, app_password, access_token, refresh_token, expiresInDays } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Credential name is required" });
    }
    if (!app_password && !(access_token && refresh_token)) {
      return res.status(400).json({ error: "Either app_password or both access_token and refresh_token are required" });
    }
    const data = {
      email: email || "",
      app_password: app_password || undefined,
      access_token: access_token || undefined,
      refresh_token: refresh_token || undefined,
      expires_at: access_token ? Date.now() + 3600 * 1000 : undefined // Example: expires in 1 hour
    };
    const credential = await gmailService.saveGmailCredentials(req.user.id, name, data, expiresInDays || 90);
    await storage.createUserActivity({
      userId: req.user.id,
      activityType: "gmail_credential_created",
      resourceId: credential.id,
      resourceType: "credential",
      metadata: { name: credential.name, email: email },
    });
    const { data: _, ...credentialWithoutData } = credential;
    res.status(201).json(credentialWithoutData);
  } catch (error) {
    console.error("Error creating Gmail credentials:", error);
    res.status(500).json({ error: "Failed to create Gmail credentials" });
  }
});

gmailRouter.get("/credentials", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const credentials = await gmailService.listGmailCredentials(req.user.id);
    res.json(credentials);
  } catch (error) {
    console.error("Error listing Gmail credentials:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

gmailRouter.post("/send-email", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { credentialId, to, subject, body, attachments } = req.body;
    if (!credentialId || !to || !subject || !body) {
      return res.status(400).json({ error: "Missing required fields: credentialId, to, subject, body" });
    }
    const credentialIdNum = typeof credentialId === 'string' ? parseInt(credentialId) : credentialId;
    const cred = await storage.getCredential(credentialIdNum);
    if (!cred || cred.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to use this credential" });
    }
    const result = await gmailService.sendEmail(req.user.id, credentialIdNum, { to, subject, body, attachments: attachments || [] });
    await storage.createUserActivity({
      userId: req.user.id,
      activityType: "email_sent",
      resourceId: credentialIdNum,
      resourceType: "credential",
      metadata: { subject, to: typeof to === 'string' ? to : to.join(',') },
    });
    res.json(result);
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

gmailRouter.get("/messages", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { credentialId, maxResults, includeAttachments, labelIds, query } = req.query;
    if (!credentialId) {
      return res.status(400).json({ error: "credentialId is required" });
    }
    const credentialIdNum = parseInt(credentialId as string);
    const cred = await storage.getCredential(credentialIdNum);
    if (!cred || cred.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to use this credential" });
    }
    const options: any = {};
    if (maxResults) options.maxResults = parseInt(maxResults as string);
    if (includeAttachments) options.includeAttachments = includeAttachments === 'true';
    if (labelIds) options.labelIds = typeof labelIds === 'string' ? [labelIds] : Array.isArray(labelIds) ? labelIds : undefined;
    if (query) options.query = query as string;
    const messages = await gmailService.getMessages(req.user.id, credentialIdNum, options);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching Gmail messages:", error);
    res.status(500).json({ error: "Failed to fetch Gmail messages" });
  }
});

gmailRouter.post("/refresh-token", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { credentialId } = req.body;
    if (!credentialId) {
      return res.status(400).json({ error: "credentialId is required" });
    }
    const credentialIdNum = typeof credentialId === 'string' ? parseInt(credentialId) : credentialId;
    const cred = await storage.getCredential(credentialIdNum);
    if (!cred || cred.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to use this credential" });
    }
    const result = await gmailService.refreshOAuthToken(req.user.id, credentialIdNum);
    res.json(result);
  } catch (error) {
    console.error("Error refreshing Gmail token:", error);
    res.status(500).json({ error: "Failed to refresh Gmail token" });
  }
});

credentialRouter.use("/services/gmail", gmailRouter);
