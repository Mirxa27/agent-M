import { Router, Request, Response } from "express";
import { handleError } from "../utils/errorHandler";
import {
  awardPoints,
  completeChallenge,
  generateResponse,
  getAvailableChallenges,
  getChatHistory,
  getOrCreateGameProgress,
  getOrCreateSessionId,
  searchChatHistory,
  storeChatMessage,
  updateStreak,
} from "../services/chatbot-service";
import { requireAuth } from "../middleware/auth-middleware"; // Import requireAuth middleware
import aiService from "../services/ai-service"; // Import aiService
import { storage } from "../storage"; // Correct import
import PdfPrinter from "pdfmake"; // Correct import for PdfPrinter
import * as pdfFonts from "pdfmake/build/vfs_fonts"; // Import pdfmake fonts

// Define fonts for pdfmake
const fonts = {
  Roboto: {
    normal: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Regular.ttf'], 'base64'),
    bold: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Medium.ttf'], 'base64'),
    italics: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Italic.ttf'], 'base64'),
    bolditalics: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-MediumItalic.ttf'], 'base64')
  }
};

const printer = new PdfPrinter(fonts);

export const chatbotRouter = Router();

// Chatbot message history
chatbotRouter.get("/chatbot/history", async (req: Request, res: Response) => {
  try {
    const userId = req.isAuthenticated() ? req.user!.id : null;
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const history = await getChatHistory(userId, sessionId);
    res.json(history);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

// === Code Generation Route ===
chatbotRouter.post("/chatbot/generate-code", requireAuth, async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required for code generation" });
    }

    // Assuming aiService is imported or available in this scope
    // If not, you'll need to import it: import aiService from "../services/ai-service";
    const codeResponse = await aiService.generateCode(prompt);
    res.json(codeResponse);
  } catch (error) {
    console.error("Error generating code via chatbot:", error);
    res.status(500).json({ error: "Failed to generate code" });
  }
});

// Send message to chatbot
chatbotRouter.post("/chatbot/message", async (req: Request, res: Response) => {
  try {
    if (!req.body.content) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const content = req.body.content;
    const providedSessionId = req.body.sessionId;
    const userId = req.isAuthenticated() ? req.user!.id : null;

    const sessionId = await getOrCreateSessionId(providedSessionId);
    const timestamp = new Date();

    await storeChatMessage({
      userId: userId || undefined,
      sessionId,
      content,
      isBot: false,
      timestamp,
    });

    const gameInfo = await getOrCreateGameProgress(userId, sessionId);
    await awardPoints(userId, sessionId, 1);
    const streakIncremented = await updateStreak(userId, sessionId);
    const botResponse = await generateResponse(userId, sessionId, content, gameInfo);

    let responseContent = botResponse.content;
    if (streakIncremented) {
      if (!responseContent.toLowerCase().includes("streak")) {
        responseContent += ` 🔥 Great job on your ${
          gameInfo.streak + 1
        }-day streak! Keep coming back daily for more points and rewards.`;
      }
    }

    await storeChatMessage({
      userId: userId || undefined,
      sessionId,
      content: responseContent,
      isBot: true,
      metadata: botResponse.metadata,
      timestamp,
    });

    const userMessageLower = content.toLowerCase();
    if (gameInfo.completedChallenges.length < 3) {
      if (
        (userMessageLower.includes("agent") || userMessageLower.includes("automation")) &&
        !gameInfo.completedChallenges.includes("1")
      ) {
        await completeChallenge(userId, sessionId, 1);
      } else if (
        (userMessageLower.includes("credential") || userMessageLower.includes("api key")) &&
        !gameInfo.completedChallenges.includes("2")
      ) {
        await completeChallenge(userId, sessionId, 2);
      } else if (
        (userMessageLower.includes("browser") || userMessageLower.includes("automate")) &&
        !gameInfo.completedChallenges.includes("3")
      ) {
        await completeChallenge(userId, sessionId, 3);
      }
    }

    const updatedGameInfo = await getOrCreateGameProgress(userId, sessionId);

    res.json({
      content: responseContent,
      sessionId,
      gameInfo: updatedGameInfo,
      metadata: {
        ...botResponse.metadata,
        pointsEarned: 1,
        streakIncremented,
        newStreak: streakIncremented ? gameInfo.streak + 1 : gameInfo.streak,
        timestamp: timestamp.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error processing chatbot message:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
});

// === Chat History Search ===
chatbotRouter.get("/chatbot/search", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const sessionId = req.query.sessionId as string;
    const query = req.query.q as string;

    if (!sessionId || !query) {
      return res.status(400).json({ error: "Session ID and search query are required" });
    }

    const results = await searchChatHistory(userId, sessionId, query);
    res.json(results);
  } catch (error) {
    console.error("Error searching chat history:", error);
    res.status(500).json({ error: "Failed to search chat history" });
  }
});

// === Document Generation Routes ===
// Generate PDF
chatbotRouter.post("/chatbot/generate-pdf", requireAuth, async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required for PDF generation" });
    }

    const docDefinition = { content }; // Basic PDF definition for now
    const pdfDoc = printer.createPdfKitDocument(docDefinition); // Use the printer instance
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=chat_export.pdf");
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// Generate Word Doc (Placeholder)
// chatbotRouter.post("/chatbot/generate-word", requireAuth, async (req: Request, res: Response) => {
//   try {
//     const { content } = req.body;
//     if (!content) {
//       return res.status(400).json({ error: "Content is required for Word doc generation" });
//     }

//     const doc = await generateWordDoc(content); // Placeholder function
//     res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
//     res.setHeader("Content-Disposition", "attachment; filename=chat_export.docx");
//     // Send the generated document
//     res.send(doc);
//   } catch (error) {
//     console.error("Error generating Word doc:", error);
//     res.status(500).json({ error: "Failed to generate Word doc" });
//   }
// });


// Get available challenges
chatbotRouter.get("/chatbot/challenges", async (req: Request, res: Response) => {
  try {
    const difficulty = req.query.difficulty as string | undefined;
    const challenges = await getAvailableChallenges(difficulty);
    res.json(challenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

// Complete a challenge
chatbotRouter.post("/chatbot/complete-challenge", async (req: Request, res: Response) => {
  try {
    if (!req.body.challengeId || !req.body.sessionId) {
      return res.status(400).json({ error: "Challenge ID and Session ID are required" });
    }

    const challengeId = parseInt(req.body.challengeId);
    const userId = req.isAuthenticated() ? req.user!.id : null;
    const sessionId = req.body.sessionId;

    await completeChallenge(userId, sessionId, challengeId);

    const updatedGameInfo = await getOrCreateGameProgress(userId, sessionId);

    res.json({
      success: true,
      gameInfo: updatedGameInfo,
    });
  } catch (error) {
    console.error("Error completing challenge:", error);
    res.status(500).json({ error: handleError(error) });
  }
});

// Get user game progress
chatbotRouter.get("/chatbot/game-progress", async (req: Request, res: Response) => {
  try {
    const userId = req.isAuthenticated() ? req.user!.id : null;
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const gameInfo = await getOrCreateGameProgress(userId, sessionId);
    res.json(gameInfo);
  } catch (error) {
    console.error("Error fetching game progress:", error);
    res.status(500).json({ error: handleError(error) });
  }
});
