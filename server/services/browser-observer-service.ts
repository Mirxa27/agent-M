import { db } from "../db";
import {
  browserActions,
  browserSequences,
  browserSequenceSteps,
  browserAiSuggestions,
  browserSettings,
  type BrowserAction,
  type BrowserSequence,
  type BrowserSequenceStep,
  type BrowserAiSuggestion,
  type BrowserSetting,
  type InsertBrowserAction,
  type InsertBrowserSequence,
  type InsertBrowserSequenceStep,
  type InsertBrowserAiSuggestion,
  type InsertBrowserSetting
} from "@shared/schema";
import { desc, eq, and, sql, SQL } from "drizzle-orm"; // Added SQL import
// Import AI service - adjust to your available service
import * as openaiService from "./openai-service";

/**
 * Service for handling browser action recording, sequence management,
 * and AI-powered suggestions based on user interactions
 */
export class BrowserObserverService {
  /**
   * Records a browser action event
   * @param action Browser action to record
   * @returns The saved browser action
   */
  async recordAction(action: InsertBrowserAction): Promise<BrowserAction> {
    try {
      const [savedAction] = await db
        .insert(browserActions)
        .values(action)
        .returning();

      return savedAction;
    } catch (error) {
      console.error("Error recording browser action:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to record browser action: ${message}`);
    }
  }

  /**
   * Records multiple browser actions in a batch
   * @param actions Array of browser actions
   * @returns Array of saved browser actions
   */
  async recordBatchActions(actions: InsertBrowserAction[]): Promise<BrowserAction[]> {
    if (!actions || actions.length === 0) {
      return [];
    }

    try {
      const savedActions = await db
        .insert(browserActions)
        .values(actions)
        .returning();

      return savedActions;
    } catch (error) {
      console.error("Error recording batch browser actions:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to record batch browser actions: ${message}`);
    }
  }

  /**
   * Get recent browser actions for a user
   * @param userId User ID
   * @param limit Number of actions to return (default 100)
   * @returns Array of recent browser actions
   */
  async getRecentActions(userId: number, limit = 100): Promise<BrowserAction[]> {
    try {
      const actions = await db
        .select()
        .from(browserActions)
        .where(eq(browserActions.userId, userId))
        .orderBy(desc(browserActions.timestamp))
        .limit(limit);

      return actions;
    } catch (error) {
      console.error("Error getting recent browser actions:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get recent browser actions: ${message}`);
    }
  }

  /**
   * Get recent browser actions for a specific session
   * @param sessionId Session ID
   * @param limit Number of actions to return (default 100)
   * @returns Array of session browser actions
   */
  async getSessionActions(sessionId: string, limit = 100): Promise<BrowserAction[]> {
    try {
      const actions = await db
        .select()
        .from(browserActions)
        .where(eq(browserActions.sessionId, sessionId))
        .orderBy(desc(browserActions.timestamp))
        .limit(limit);

      return actions;
    } catch (error) {
      console.error("Error getting session browser actions:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get session browser actions: ${message}`);
    }
  }

  /**
   * Create a new browser automation sequence
   * @param sequence Sequence to create
   * @returns The saved sequence
   */
  async createSequence(sequence: InsertBrowserSequence): Promise<BrowserSequence> {
    try {
      const [savedSequence] = await db
        .insert(browserSequences)
        .values(sequence)
        .returning();

      return savedSequence;
    } catch (error) {
      console.error("Error creating browser sequence:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create browser sequence: ${message}`);
    }
  }

  /**
   * Get a browser sequence by ID
   * @param id Sequence ID
   * @returns The browser sequence or null if not found
   */
  async getSequence(id: number): Promise<BrowserSequence | null> {
    try {
      const [sequence] = await db
        .select()
        .from(browserSequences)
        .where(eq(browserSequences.id, id));

      return sequence || null;
    } catch (error) {
      console.error("Error getting browser sequence:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get browser sequence: ${message}`);
    }
  }

  /**
   * Get all browser sequences for a user
   * @param userId User ID
   * @returns Array of browser sequences
   */
  async getUserSequences(userId: number): Promise<BrowserSequence[]> {
    try {
      const sequences = await db
        .select()
        .from(browserSequences)
        .where(eq(browserSequences.userId, userId))
        .orderBy(desc(browserSequences.updatedAt));

      return sequences;
    } catch (error) {
      console.error("Error getting user browser sequences:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get user browser sequences: ${message}`);
    }
  }

  /**
   * Update a browser sequence
   * @param id Sequence ID
   * @param updates Fields to update
   * @returns The updated sequence
   */
  async updateSequence(
    id: number,
    updates: Partial<Omit<BrowserSequence, "id" | "createdAt">>
  ): Promise<BrowserSequence> {
    try {
      const [updatedSequence] = await db
        .update(browserSequences)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(browserSequences.id, id))
        .returning();

      if (!updatedSequence) {
        throw new Error(`Browser sequence with ID ${id} not found`);
      }

      return updatedSequence;
    } catch (error) {
      console.error("Error updating browser sequence:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update browser sequence: ${message}`);
    }
  }

  /**
   * Delete a browser sequence and its steps
   * @param id Sequence ID
   * @returns Boolean indicating success
   */
  async deleteSequence(id: number): Promise<boolean> {
    try {
      // Delete associated steps first
      await db
        .delete(browserSequenceSteps)
        .where(eq(browserSequenceSteps.sequenceId, id));

      // Then delete the sequence
      const result = await db
        .delete(browserSequences)
        .where(eq(browserSequences.id, id))
        .returning({ id: browserSequences.id });

      return result.length > 0;
    } catch (error) {
      console.error("Error deleting browser sequence:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete browser sequence: ${message}`);
    }
  }

  /**
   * Add steps to a browser sequence
   * @param steps Array of sequence steps to add
   * @returns Array of saved sequence steps
   */
  async addSequenceSteps(
    steps: InsertBrowserSequenceStep[]
  ): Promise<BrowserSequenceStep[]> {
    if (!steps || steps.length === 0) {
      return [];
    }

    try {
      const savedSteps = await db
        .insert(browserSequenceSteps)
        .values(steps)
        .returning();

      return savedSteps;
    } catch (error) {
      console.error("Error adding browser sequence steps:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to add browser sequence steps: ${message}`);
    }
  }

  /**
   * Get all steps for a browser sequence
   * @param sequenceId Sequence ID
   * @returns Array of sequence steps
   */
  async getSequenceSteps(sequenceId: number): Promise<BrowserSequenceStep[]> {
    try {
      const steps = await db
        .select()
        .from(browserSequenceSteps)
        .where(eq(browserSequenceSteps.sequenceId, sequenceId))
        .orderBy(browserSequenceSteps.stepOrder);

      return steps;
    } catch (error) {
      console.error("Error getting browser sequence steps:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get browser sequence steps: ${message}`);
    }
  }

  /**
   * Update a sequence step
   * @param id Step ID
   * @param updates Fields to update
   * @returns The updated step
   */
  async updateSequenceStep(
    id: number,
    updates: Partial<Omit<BrowserSequenceStep, "id">>
  ): Promise<BrowserSequenceStep> {
    try {
      const [updatedStep] = await db
        .update(browserSequenceSteps)
        .set(updates)
        .where(eq(browserSequenceSteps.id, id))
        .returning();

      if (!updatedStep) {
        throw new Error(`Browser sequence step with ID ${id} not found`);
      }

      return updatedStep;
    } catch (error) {
      console.error("Error updating browser sequence step:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update browser sequence step: ${message}`);
    }
  }

  /**
   * Delete a sequence step
   * @param id Step ID
   * @returns Boolean indicating success
   */
  async deleteSequenceStep(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(browserSequenceSteps)
        .where(eq(browserSequenceSteps.id, id))
        .returning({ id: browserSequenceSteps.id });

      return result.length > 0;
    } catch (error) {
      console.error("Error deleting browser sequence step:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete browser sequence step: ${message}`);
    }
  }

  /**
   * Generate AI suggestions based on recorded user actions
   * @param userId User ID
   * @param sessionId Session ID
   * @returns A promise resolving to AI suggestions
   */
  async generateAiSuggestions(userId: number, sessionId: string): Promise<BrowserAiSuggestion[]> {
    try {
      // Get the most recent user actions (last 100)
      const recentActions = await this.getSessionActions(sessionId, 100);

      if (recentActions.length < 10) {
        // Not enough actions to generate meaningful suggestions
        return [];
      }

      // Group actions by URL to identify patterns
      const actionsByUrl = this.groupActionsByUrl(recentActions);

      // Generate suggestions
      const suggestions: InsertBrowserAiSuggestion[] = [];

      // Pattern 1: Repetitive form filling
      const formFillingSuggestion = await this.detectFormFillingPatterns(
        actionsByUrl,
        userId,
        sessionId
      );

      if (formFillingSuggestion) {
        suggestions.push(formFillingSuggestion);
      }

      // Pattern 2: Repetitive navigation paths
      const navigationSuggestion = await this.detectNavigationPatterns(
        recentActions,
        userId,
        sessionId
      );

      if (navigationSuggestion) {
        suggestions.push(navigationSuggestion);
      }

      // Save and return the suggestions
      if (suggestions.length > 0) {
        const savedSuggestions = await db
          .insert(browserAiSuggestions)
          .values(suggestions)
          .returning();

        return savedSuggestions;
      }

      return [];
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate AI suggestions: ${message}`);
    }
  }

  /**
   * Get AI suggestions for a user
   * @param userId User ID
   * @param status Optional filter by status
   * @returns Array of AI suggestions
   */
  async getAiSuggestions(
    userId: number,
    status?: "pending" | "accepted" | "rejected" | "implemented"
  ): Promise<BrowserAiSuggestion[]> {
    try {
      const conditions: (SQL<unknown> | undefined)[] = [eq(browserAiSuggestions.userId, userId)];
      if (status) {
        conditions.push(eq(browserAiSuggestions.status, status));
      }

      const finalConditions = conditions.filter(c => c !== undefined) as SQL<unknown>[];

      const suggestions = await db
        .select()
        .from(browserAiSuggestions)
        .where(finalConditions.length > 1 ? and(...finalConditions) : finalConditions[0])
        .orderBy(desc(browserAiSuggestions.createdAt));
      return suggestions;
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get AI suggestions: ${message}`);
    }
  }

  /**
   * Update an AI suggestion status
   * @param id Suggestion ID
   * @param status New status
   * @returns The updated suggestion
   */
  async updateAiSuggestionStatus(
    id: number,
    status: "pending" | "accepted" | "rejected" | "implemented"
  ): Promise<BrowserAiSuggestion> {
    try {
      const updates: Partial<BrowserAiSuggestion> = { status };

      if (status === "implemented") {
        updates.implementedAt = new Date();
      }

      const [updatedSuggestion] = await db
        .update(browserAiSuggestions)
        .set(updates)
        .where(eq(browserAiSuggestions.id, id))
        .returning();

      if (!updatedSuggestion) {
        throw new Error(`AI suggestion with ID ${id} not found`);
      }

      return updatedSuggestion;
    } catch (error) {
      console.error("Error updating AI suggestion status:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update AI suggestion status: ${message}`);
    }
  }

  /**
   * Create or update browser settings for a user
   * @param settings Browser settings
   * @returns The saved browser settings
   */
  async saveSettings(settings: InsertBrowserSetting): Promise<BrowserSetting> {
    try {
      // Check if settings already exist for this user
      const [existingSettings] = await db
        .select()
        .from(browserSettings)
        .where(eq(browserSettings.userId, settings.userId));

      if (existingSettings) {
        // Update existing settings
        const [updatedSettings] = await db
          .update(browserSettings)
          .set({
            ...settings,
            updatedAt: new Date(),
          })
          .where(eq(browserSettings.id, existingSettings.id))
          .returning();

        return updatedSettings;
      }

      // Create new settings
      const [newSettings] = await db
        .insert(browserSettings)
        .values(settings)
        .returning();

      return newSettings;
    } catch (error) {
      console.error("Error saving browser settings:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to save browser settings: ${message}`);
    }
  }

  /**
   * Get browser settings for a user
   * @param userId User ID
   * @returns Browser settings or default settings if not found
   */
  async getSettings(userId: number): Promise<BrowserSetting> {
    try {
      const [settings] = await db
        .select()
        .from(browserSettings)
        .where(eq(browserSettings.userId, userId));

      if (settings) {
        return settings;
      }

      // Return default settings if none found
      return {
        id: 0, // Placeholder ID that will be replaced when saved
        userId,
        isEnabled: true,
        privacyLevel: "balanced",
        recordUrls: true,
        recordInputValues: true,
        domainAllowList: [],
        domainBlockList: [],
        aiSuggestions: true,
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error getting browser settings:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get browser settings: ${message}`);
    }
  }

  // Helper methods

  /**
   * Group browser actions by URL for pattern detection
   * @private
   */
  private groupActionsByUrl(actions: BrowserAction[]): Record<string, BrowserAction[]> {
    const result: Record<string, BrowserAction[]> = {};

    for (const action of actions) {
      if (!result[action.url]) {
        result[action.url] = [];
      }
      result[action.url].push(action);
    }

    return result;
  }

  /**
   * Detect form filling patterns
   * @private
   */
  private async detectFormFillingPatterns(
    actionsByUrl: Record<string, BrowserAction[]>,
    userId: number,
    sessionId: string
  ): Promise<InsertBrowserAiSuggestion | null> {
    // Detect forms with multiple input actions
    for (const [url, actions] of Object.entries(actionsByUrl)) {
      const inputActions = actions.filter(a => a.actionType === "input");

      if (inputActions.length >= 3) {
        // Found a potential form filling pattern
        const formFields = inputActions.map(a => a.targetElement);

        // Create a suggestion
        return {
          userId,
          sessionId,
          suggestionType: "automation",
          title: "Automate Form Filling",
          description: `I noticed you frequently fill out a form on ${new URL(url).hostname}. Would you like to automate this process?`,
          suggestedActions: inputActions.map(a => ({
            actionType: a.actionType,
            targetElement: a.targetElement,
            valueOrText: a.valueOrText || "",
            url: a.url,
          })),
          confidence: "0.85",
          status: "pending",
        };
      }
    }

    return null;
  }

  /**
   * Detect navigation patterns
   * @private
   */
  private async detectNavigationPatterns(
    actions: BrowserAction[],
    userId: number,
    sessionId: string
  ): Promise<InsertBrowserAiSuggestion | null> {
    // Find sequences of navigation actions that are repeated
    const navigationActions = actions.filter(a =>
      a.actionType === "navigation" || a.actionType === "click"
    );

    if (navigationActions.length >= 5) {
      // Look for repeated sequences of at least 3 actions
      const sequences = this.findRepeatedSequences(navigationActions, 3);

      if (sequences.length > 0) {
        // Sort by frequency and take the most common sequence
        sequences.sort((a, b) => b.frequency - a.frequency);
        const mostCommon = sequences[0];

        if (mostCommon.frequency >= 2) {
          // Create a suggestion
          return {
            userId,
            sessionId,
            suggestionType: "shortcut",
            title: "Create Navigation Shortcut",
            description: `I noticed you frequently navigate through a specific path. Would you like to create a shortcut for this sequence?`,
            suggestedActions: mostCommon.sequence.map(a => ({
              actionType: a.actionType,
              targetElement: a.targetElement,
              valueOrText: a.valueOrText || "",
              url: a.url,
            })),
            confidence: "0.78",
            status: "pending",
          };
        }
      }
    }

    return null;
  }

  /**
   * Find repeated sequences of actions
   * @private
   */
  private findRepeatedSequences(
    actions: BrowserAction[],
    minLength: number
  ): { sequence: BrowserAction[], frequency: number }[] {
    const result: { sequence: BrowserAction[], frequency: number }[] = [];

    // Simple algorithm to detect repeated sequences
    for (let i = 0; i <= actions.length - minLength; i++) {
      const candidateSequence = actions.slice(i, i + minLength);
      let frequency = 1;

      // Check how many times this sequence appears
      for (let j = i + minLength; j <= actions.length - minLength; j++) {
        const compareSequence = actions.slice(j, j + minLength);

        if (this.sequencesMatch(candidateSequence, compareSequence)) {
          frequency++;
        }
      }

      if (frequency > 1) {
        result.push({
          sequence: candidateSequence,
          frequency
        });
      }
    }

    return result;
  }

  /**
   * Check if two sequences of actions match
   * @private
   */
  private sequencesMatch(seq1: BrowserAction[], seq2: BrowserAction[]): boolean {
    if (seq1.length !== seq2.length) {
      return false;
    }

    for (let i = 0; i < seq1.length; i++) {
      // Match based on action type and target element, not exact values
      if (
        seq1[i].actionType !== seq2[i].actionType ||
        seq1[i].targetElement !== seq2[i].targetElement
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Convert a session sequence into a permanent user sequence
   * @param userId User ID
   * @param sessionId Session ID
   * @param name Sequence name
   * @param description Sequence description
   * @returns The created sequence with its steps
   */
  async convertSessionToSequence(
    userId: number,
    sessionId: string,
    name: string,
    description?: string
  ): Promise<{ sequence: BrowserSequence; steps: BrowserSequenceStep[] }> {
    try {
      // Get session actions
      const sessionActions = await this.getSessionActions(sessionId);

      if (sessionActions.length === 0) {
        throw new Error("No actions found for this session");
      }

      // Create new sequence
      const sequence = await this.createSequence({
        userId,
        name,
        description,
        isAutomated: false,
        isActive: true,
      });

      // Convert actions to steps
      const steps: InsertBrowserSequenceStep[] = sessionActions.map((actionItem, index) => {
        const action = actionItem as BrowserAction; // Explicit cast
        return {
          sequenceId: sequence.id,
          stepOrder: index + 1,
          actionType: action.actionType as string,
          targetElement: action.targetElement as string,
          targetUrl: action.url as string,
          valueOrText: action.valueOrText as (string | null),
          isConditional: false,
          metadata: action.metadata as any, // Assuming metadata is compatible
        };
      });

      // Add steps to sequence
      const savedSteps = await this.addSequenceSteps(steps);

      return { sequence, steps: savedSteps };
    } catch (error) {
      console.error("Error converting session to sequence:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to convert session to sequence: ${error.message}`);
      }
      throw new Error(`Failed to convert session to sequence: An unknown error occurred`);
    }
  }
}

// Export a singleton instance
export const browserObserverService = new BrowserObserverService();
