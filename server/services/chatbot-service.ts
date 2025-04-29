import { db } from "../db";
import { 
  chatbotMessages, 
  chatbotGameProgress, 
  chatbotChallenges,
  InsertChatbotMessage,
  InsertChatbotGameProgress,
  InsertChatbotChallenge
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import OpenAI from "openai";
import config from "../config";
import { isOpenAIConfigured } from "./openai-service";

// Initialize OpenAI client with configuration
const openai = new OpenAI({ apiKey: config.ai.openai.apiKey });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = config.ai.openai.defaultModel;

// Define interfaces
interface ChatbotResponse {
  content: string;
  metadata?: any;
}

interface GameInfo {
  level: number;
  points: number;
  badges: string[];
  streak: number;
  avatarChoice: string;
  completedChallenges: string[];
}

// Helper to get or create a session ID
export async function getOrCreateSessionId(sessionId?: string): Promise<string> {
  if (sessionId) {
    return sessionId;
  }
  return randomUUID();
}

// Helper to get or create user game progress
export async function getOrCreateGameProgress(
  userId: number | null, 
  sessionId: string
): Promise<GameInfo> {
  // Try to find existing progress
  const query = userId 
    ? and(eq(chatbotGameProgress.userId, userId), eq(chatbotGameProgress.sessionId, sessionId))
    : eq(chatbotGameProgress.sessionId, sessionId);
  
  const existingProgress = await db.select().from(chatbotGameProgress).where(query).limit(1);
  
  if (existingProgress.length > 0) {
    const progress = existingProgress[0];
    return {
      level: progress.level,
      points: progress.points,
      badges: progress.badges as string[],
      streak: progress.streak,
      avatarChoice: progress.avatarChoice,
      completedChallenges: progress.completedChallenges as string[],
    };
  }
  
  // Create new progress record
  const newProgress: InsertChatbotGameProgress = {
    userId: userId || undefined,
    sessionId,
    points: 0,
    level: 1,
    badges: [],
    completedChallenges: [],
    streak: 0,
    avatarChoice: 'default'
  };
  
  await db.insert(chatbotGameProgress).values(newProgress);
  
  return {
    level: 1,
    points: 0,
    badges: [],
    streak: 0,
    avatarChoice: 'default',
    completedChallenges: [],
  };
}

// Store chat message
export async function storeChatMessage(message: InsertChatbotMessage): Promise<void> {
  await db.insert(chatbotMessages).values(message);
}

// Get chat history
export async function getChatHistory(
  userId: number | null, 
  sessionId: string, 
  limit: number = 20
): Promise<any[]> {
  const query = userId 
    ? and(eq(chatbotMessages.userId, userId), eq(chatbotMessages.sessionId, sessionId))
    : eq(chatbotMessages.sessionId, sessionId);
  
  return db
    .select()
    .from(chatbotMessages)
    .where(query)
    .orderBy(desc(chatbotMessages.timestamp))
    .limit(limit);
}

// Award points to user
export async function awardPoints(
  userId: number | null, 
  sessionId: string, 
  pointsToAdd: number
): Promise<void> {
  const query = userId 
    ? and(eq(chatbotGameProgress.userId, userId), eq(chatbotGameProgress.sessionId, sessionId))
    : eq(chatbotGameProgress.sessionId, sessionId);
  
  const existingProgress = await db.select().from(chatbotGameProgress).where(query).limit(1);
  
  if (existingProgress.length > 0) {
    const currentPoints = existingProgress[0].points;
    const newPoints = currentPoints + pointsToAdd;
    
    // Calculate new level (simple formula: level = floor(points/100) + 1)
    const newLevel = Math.floor(newPoints / 100) + 1;
    
    await db
      .update(chatbotGameProgress)
      .set({ 
        points: newPoints, 
        level: newLevel,
        lastInteraction: new Date()
      })
      .where(query);
  }
}

// Award badge
export async function awardBadge(
  userId: number | null, 
  sessionId: string, 
  badge: string
): Promise<void> {
  const query = userId 
    ? and(eq(chatbotGameProgress.userId, userId), eq(chatbotGameProgress.sessionId, sessionId))
    : eq(chatbotGameProgress.sessionId, sessionId);
  
  const existingProgress = await db.select().from(chatbotGameProgress).where(query).limit(1);
  
  if (existingProgress.length > 0) {
    const currentBadges = existingProgress[0].badges as string[];
    if (!currentBadges.includes(badge)) {
      currentBadges.push(badge);
      
      await db
        .update(chatbotGameProgress)
        .set({ 
          badges: currentBadges,
          lastInteraction: new Date()
        })
        .where(query);
    }
  }
}

// Helper to update last interaction and streak
export async function updateStreak(
  userId: number | null, 
  sessionId: string
): Promise<void> {
  const query = userId 
    ? and(eq(chatbotGameProgress.userId, userId), eq(chatbotGameProgress.sessionId, sessionId))
    : eq(chatbotGameProgress.sessionId, sessionId);
  
  const existingProgress = await db.select().from(chatbotGameProgress).where(query).limit(1);
  
  if (existingProgress.length > 0) {
    const lastInteraction = existingProgress[0].lastInteraction;
    const now = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    // If last interaction was more than 24 hours ago but less than 48 hours, increment streak
    if (now.getTime() - lastInteraction.getTime() <= oneDayInMs) {
      const currentStreak = existingProgress[0].streak;
      
      await db
        .update(chatbotGameProgress)
        .set({ 
          streak: currentStreak + 1,
          lastInteraction: now
        })
        .where(query);
    } 
    // If more than 48 hours, reset streak
    else if (now.getTime() - lastInteraction.getTime() > oneDayInMs * 2) {
      await db
        .update(chatbotGameProgress)
        .set({ 
          streak: 1,
          lastInteraction: now
        })
        .where(query);
    }
    // Otherwise just update last interaction
    else {
      await db
        .update(chatbotGameProgress)
        .set({ lastInteraction: now })
        .where(query);
    }
  }
}

// Get available challenges
export async function getAvailableChallenges(difficulty?: string): Promise<any[]> {
  let query = eq(chatbotChallenges.isActive, true);
  
  if (difficulty) {
    query = and(query, eq(chatbotChallenges.difficulty, difficulty));
  }
  
  return db.select().from(chatbotChallenges).where(query);
}

// Mark challenge as completed
export async function completeChallenge(
  userId: number | null, 
  sessionId: string, 
  challengeId: number
): Promise<void> {
  const query = userId 
    ? and(eq(chatbotGameProgress.userId, userId), eq(chatbotGameProgress.sessionId, sessionId))
    : eq(chatbotGameProgress.sessionId, sessionId);
  
  const existingProgress = await db.select().from(chatbotGameProgress).where(query).limit(1);
  
  if (existingProgress.length > 0) {
    const completedChallenges = existingProgress[0].completedChallenges as string[];
    if (!completedChallenges.includes(challengeId.toString())) {
      completedChallenges.push(challengeId.toString());
      
      await db
        .update(chatbotGameProgress)
        .set({ 
          completedChallenges,
          lastInteraction: new Date()
        })
        .where(query);
      
      // Get challenge details to award points and badges
      const challenge = await db
        .select()
        .from(chatbotChallenges)
        .where(eq(chatbotChallenges.id, challengeId))
        .limit(1);
      
      if (challenge.length > 0) {
        await awardPoints(userId, sessionId, challenge[0].pointsReward);
        if (challenge[0].badgeReward) {
          await awardBadge(userId, sessionId, challenge[0].badgeReward);
        }
      }
    }
  }
}

// Use OpenAI to generate bot responses
export async function generateResponse(
  userId: number | null,
  sessionId: string,
  userMessage: string,
  gameInfo: GameInfo
): Promise<ChatbotResponse> {
  try {
    // Get chat history for context
    const history = await getChatHistory(userId, sessionId, 10);
    
    // Format message history for OpenAI
    const formattedHistory = history.map(msg => ({
      role: msg.isBot ? "assistant" as const : "user" as const,
      content: msg.content
    })).reverse();
    
    // Create system prompt
    const systemPrompt = `You are Mirxa AI's friendly and gamified assistant. 
    The user is currently level ${gameInfo.level} with ${gameInfo.points} points and a streak of ${gameInfo.streak} days.
    They have earned these badges: ${gameInfo.badges.join(', ') || 'none yet'}.
    
    Your approach is:
    1. Be enthusiastic, friendly, and encouraging
    2. Keep responses concise (max 3-4 sentences)
    3. Occasionally congratulate users on their level, points or streak
    4. Guide users through the platform's features like agents, credentials, AI browser, etc.
    5. Motivate users to complete challenges to earn points and level up
    
    Focus on helping users with:
    - Building AI agents with various tools and services
    - Managing credentials securely
    - Using the AI browser for automation
    - Finding templates and tools to enhance productivity`;
    
    // Make request to OpenAI
    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system" as const, content: systemPrompt },
        ...formattedHistory,
        { role: "user" as const, content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 150
    });
    
    // Extract response
    return {
      content: completion.choices[0].message.content || "I'm not sure how to respond to that.",
      metadata: { 
        model: DEFAULT_MODEL,
        usage: completion.usage
      }
    };
  } catch (error) {
    console.error("Error generating chatbot response:", error);
    return {
      content: "Sorry, I'm having trouble connecting to my AI capabilities right now. Please try again shortly."
    };
  }
}