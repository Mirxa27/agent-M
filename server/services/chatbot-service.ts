import { db } from "../db";
import { 
  chatbotMessages, 
  chatbotGameProgress, 
  chatbotChallenges,
  InsertChatbotMessage,
  InsertChatbotGameProgress,
  InsertChatbotChallenge
} from "@shared/schema";
import { eq, and, desc, SQL } from "drizzle-orm";
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
export async function getOrCreateSessionId(sessionId?: string | null): Promise<string> {
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

// Helper to update last interaction and streak with improved time awareness
export async function updateStreak(
  userId: number | null, 
  sessionId: string
): Promise<boolean> {
  const query = userId 
    ? and(eq(chatbotGameProgress.userId, userId), eq(chatbotGameProgress.sessionId, sessionId))
    : eq(chatbotGameProgress.sessionId, sessionId);
  
  const existingProgress = await db.select().from(chatbotGameProgress).where(query).limit(1);
  
  if (existingProgress.length > 0) {
    const lastInteraction = existingProgress[0].lastInteraction;
    const now = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    // Calculate days difference by comparing just the dates (not time)
    const lastDate = new Date(lastInteraction);
    lastDate.setHours(0, 0, 0, 0);
    
    const todayDate = new Date(now);
    todayDate.setHours(0, 0, 0, 0);
    
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    
    const daysDifference = Math.floor((todayDate.getTime() - lastDate.getTime()) / oneDayInMs);
    
    // Store whether the streak was incremented
    let streakIncremented = false;
    
    // If user is logging in on a new day and the last interaction was yesterday, increment streak
    if (daysDifference === 1) {
      const currentStreak = existingProgress[0].streak;
      const newStreak = currentStreak + 1;
      
      await db
        .update(chatbotGameProgress)
        .set({ 
          streak: newStreak,
          lastInteraction: now
        })
        .where(query);
      
      // If the streak is a multiple of 5, award bonus points
      if (newStreak % 5 === 0) {
        await awardPoints(userId, sessionId, 25); // Bonus points for streak milestones
      }
      
      streakIncremented = true;
    } 
    // If it's been more than 1 day since last interaction, reset streak to 1
    else if (daysDifference > 1) {
      await db
        .update(chatbotGameProgress)
        .set({ 
          streak: 1,
          lastInteraction: now
        })
        .where(query);
    }
    // If it's the same day, just update the last interaction time
    else {
      await db
        .update(chatbotGameProgress)
        .set({ lastInteraction: now })
        .where(query);
    }
    
    return streakIncremented;
  }
  
  return false;
}

// Get available challenges
export async function getAvailableChallenges(difficulty?: string): Promise<any[]> {
  let query: SQL<unknown> = eq(chatbotChallenges.isActive, true);
  
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
    
    // Determine if user is new or returning based on history
    const isNewUser = history.length <= 2;
    
    // Create adaptive system prompt based on user's progress
    const systemPrompt = `You are Mirxa AI's friendly and gamified assistant, designed to help users with AI agents and automation.
    
    USER PROFILE:
    - Level: ${gameInfo.level}
    - Points: ${gameInfo.points}
    - Streak: ${gameInfo.streak} days
    - Badges earned: ${gameInfo.badges.length > 0 ? gameInfo.badges.join(', ') : 'none yet'}
    - Completed challenges: ${gameInfo.completedChallenges.length}
    
    YOUR PERSONALITY:
    - Enthusiastic, friendly, and encouraging
    - Knowledgeable about AI agents and automation
    - Concise (3-4 sentences max)
    - Occasionally congratulatory about the user's progress
    - Motivational, encouraging users to explore more features
    
    YOUR PRIORITIES:
    ${isNewUser ? 
      `1. As this seems to be a new user, provide a warm welcome
      2. Briefly explain what Mirxa can do (AI agents, browser automation, etc.)
      3. Suggest a simple starting point like creating their first agent
      4. Mention they can earn points and level up by using features` 
      : 
      `1. Address their specific query directly and helpfully
      2. Reference their current level/badges when appropriate
      3. Suggest the next feature they could explore based on their interaction
      4. If they seem stuck, offer clear guidance on how to proceed`
    }
    
    MAIN PLATFORM FEATURES TO HIGHLIGHT:
    - AI agents with various capabilities (document analysis, content creation, etc.)
    - Secure credential management system for API connections
    - Browser automation tools for workflow optimization
    - Templates library for common automation tasks
    - Integration with external services and APIs
    
    If the user asks about features or how to do something specific, provide clear, actionable steps.
    If they're close to leveling up or earning a badge, mention this as motivation.`;
    
    // Make request to OpenAI with enhanced parameters
    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system" as const, content: systemPrompt },
        ...formattedHistory,
        { role: "user" as const, content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 200, // Increased token limit for more detailed responses
      top_p: 0.9,      // Slightly more focused responses
      presence_penalty: 0.2 // Slight penalty to avoid repetitive responses
    });
    
    // Extract response and enhance with post-processing
    let responseContent = completion.choices[0].message.content || "I'm not sure how to respond to that.";
    
    // Check if user is close to leveling up and add a motivational note if they are
    const pointsToNextLevel = 100 - (gameInfo.points % 100);
    if (pointsToNextLevel <= 15 && pointsToNextLevel > 0 && gameInfo.points > 0) {
      responseContent += ` By the way, you're only ${pointsToNextLevel} points away from reaching level ${gameInfo.level + 1}!`;
    }
    
    // Award special badge for consistent interaction if they have a streak
    if (gameInfo.streak >= 3 && !gameInfo.badges.includes('communicator')) {
      await awardBadge(userId, sessionId, 'communicator');
      responseContent += " 🎉 Amazing! You've just earned the Communicator badge for your consistent interactions!";
    }
    
    return {
      content: responseContent,
      metadata: { 
        model: DEFAULT_MODEL,
        usage: completion.usage,
        enhancedResponse: true,
        userLevel: gameInfo.level,
        pointsToNextLevel: pointsToNextLevel
      }
    };
  } catch (error) {
    console.error("Error generating chatbot response:", error);
    
    // Provide a more helpful error message based on the error type
    if (error instanceof Error) {
      if (error.message.includes("Rate limit")) {
        return {
          content: "I'm currently handling many requests. Please try again in a moment while I catch my breath!"
        };
      } else if (error.message.includes("Authentication")) {
        console.error("OpenAI API key authentication issue");
        return {
          content: "I'm having trouble connecting to my AI capabilities. The system team has been notified."
        };
      }
    }
    
    return {
      content: "Sorry, I'm having trouble thinking right now. Please try again shortly and I'll do my best to help you!"
    };
  }
}