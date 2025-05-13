import {
  chatbotChallenges,
  chatbotGameProgress,
  chatbotMessages,
  ChatbotMessage, // Import ChatbotMessage type
  InsertChatbotGameProgress,
  InsertChatbotMessage
} from "@shared/schema";
import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import OpenAI from "openai";
import config from "../config";
import { db } from "../db";
import { like } from "drizzle-orm"; // Import like for partial string matching

// Initialize OpenAI client with configuration
const openai = new OpenAI({ apiKey: config.ai.openai.apiKey });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = config.ai.openai.defaultModel;

// Define interfaces
interface ChatbotResponse {
  content: string;
  metadata?: any; // Optional metadata
  gameInfo: GameInfo; // Add gameInfo to the response type
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
  // If sessionId exists and is not null, return it; otherwise generate a new UUID
  return sessionId || randomUUID();
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
      avatarChoice: progress.avatarChoice || 'default',
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
  // Ensure message.userId is undefined instead of null for DB compatibility
  const formattedMessage = {
    ...message,
    userId: message.userId || undefined
  };

  await db.insert(chatbotMessages).values(formattedMessage);
}

// Get chat history
export async function getChatHistory(
  userId: number | null,
  sessionId: string,
  limit: number = 20
): Promise<ChatbotMessage[]> { // Use ChatbotMessage[] type
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

// Search chat history
export async function searchChatHistory(
  userId: number | null,
  sessionId: string,
  query: string
): Promise<ChatbotMessage[]> {
  const queryBuilder = db.select().from(chatbotMessages);

  // Add conditions based on userId and sessionId
  if (userId) {
    queryBuilder.where(and(eq(chatbotMessages.userId, userId), eq(chatbotMessages.sessionId, sessionId)));
  } else {
    queryBuilder.where(eq(chatbotMessages.sessionId, sessionId));
  }

  // Add search query condition (case-insensitive partial match)
  queryBuilder.where(like(chatbotMessages.content, `%${query}%`));

  return queryBuilder;
}


// Get available challenges
export async function getAvailableChallenges(difficulty?: string): Promise<any[]> {
  let baseQuery = eq(chatbotChallenges.isActive, true);

  const query = difficulty
    ? and(baseQuery, eq(chatbotChallenges.difficulty, difficulty))
    : baseQuery;

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
    const systemPrompt = `You are Mirxa AI's friendly and gamified assistant. Your primary role is to assist users by performing tasks, answering questions, and guiding them through the Mirxa platform, which specializes in AI agents and automation.

    YOUR CAPABILITIES:
    - Answering questions about the Mirxa platform and AI in general.
    - Performing tasks like Document Summarization, Content Generation, Code Generation (HTML, CSS, JS), and Image Generation when requested.
    - Searching your conversation history.
    - Generating PDF documents from text.
    - Guiding users on how to use AI agents, browser automation, and other platform features.

    USER PROFILE:
    - Level: ${gameInfo.level}
    - Points: ${gameInfo.points}
    - Streak: ${gameInfo.streak} days
    - Badges earned: ${gameInfo.badges.length > 0 ? gameInfo.badges.join(', ') : 'none yet'}
    - Completed challenges: ${gameInfo.completedChallenges.length}

    YOUR PERSONALITY:
    - Enthusiastic, friendly, and encouraging.
    - Knowledgeable about AI, automation, document summarization, and content creation.
    - Concise in general interactions (3-4 sentences max), but provide detailed output when performing tasks like summarization or content generation.
    - Occasionally congratulatory about the user's progress.
    - Motivational, encouraging users to explore more features and utilize your task-performing abilities.

    HOW TO RESPOND:
    1.  Identify the user's intent:
        *   Is it a request for a specific task (e.g., "summarize this text...", "write an article about...")?
        *   Is it a question about the platform or a general query?
        *   Is it a casual chat?
    2.  If a task is requested (Summarization/Content Generation):
        *   Acknowledge the task.
        *   Perform the task to the best of your ability using the provided information.
        *   If necessary information is missing (e.g., the text to summarize), politely ask for it.
    3.  If a question is asked:
        *   Address their specific query directly and helpfully.
    4.  General Interaction Style:
        *   ${isNewUser ?
        `For new users: Provide a warm welcome. Briefly explain Mirxa's capabilities (AI agents, automation, and your ability to perform tasks like summarization/content generation). Suggest a simple starting point. Mention they can earn points and level up.`
        :
        `For returning users: Reference their current level/badges when appropriate. Suggest the next feature they could explore or a task you could perform for them. If they seem stuck, offer clear guidance.`
      }
    5.  Maintain context from the conversation history.
    6.  Integrate gamification elements naturally (e.g., "Great job on asking for a summary! That's a smart way to use my skills. You're making good progress towards level ${gameInfo.level + 1}!").

    MAIN PLATFORM FEATURES TO HIGHLIGHT (when relevant, don't force it):
    - AI agents with various capabilities (document analysis, content creation, etc.)
    - Secure credential management system for API connections
    - Browser automation tools for workflow optimization
    - Templates library for common automation tasks (mention you can help generate content for these too!)
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
      max_tokens: 1024, // Increased token limit for potentially longer generated content/summaries
      top_p: 0.9,
      presence_penalty: 0.2
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

    // Fetch the latest gameInfo after potential updates (like badge awards)
    const updatedGameInfo = await getOrCreateGameProgress(userId, sessionId);

    return {
      content: responseContent,
      // metadata: { // Keeping metadata for potential future use, but gameInfo is primary now
      //   model: DEFAULT_MODEL,
      //   usage: completion.usage,
      //   userLevel: updatedGameInfo.level,
      //   pointsToNextLevel: 100 - (updatedGameInfo.points % 100)
      // },
      gameInfo: updatedGameInfo // Ensure the full, updated gameInfo is returned
    };
  } catch (error) {
    console.error("Error generating chatbot response:", error);
    const updatedGameInfoOnError = await getOrCreateGameProgress(userId, sessionId);


    // Provide a more helpful error message based on the error type
    if (error instanceof Error) {
      if (error.message.includes("Rate limit")) {
        return {
          content: "I'm currently handling many requests. Please try again in a moment while I catch my breath!",
          gameInfo: updatedGameInfoOnError
        };
      } else if (error.message.includes("Authentication")) {
        console.error("OpenAI API key authentication issue");
        return {
          content: "I'm having trouble connecting to my AI capabilities. The system team has been notified.",
          gameInfo: updatedGameInfoOnError
        };
      }
    }

    return {
      content: "Sorry, I'm having trouble thinking right now. Please try again shortly and I'll do my best to help you!",
      gameInfo: updatedGameInfoOnError
    };
  }
}
