import {
  DashboardPreference,
  InsertDashboardPreference,
} from "@shared/schema";
import { storage } from "../storage";

/**
 * Get dashboard preferences for a user, creating default settings if none exist
 * @param userId The user ID
 * @returns The user's dashboard preferences
 */
export async function getUserDashboardPreferences(
  userId: number
): Promise<DashboardPreference> {
  try {
    // Check if user already has dashboard preferences
    let preferences = await storage.getDashboardPreferenceByUserId(userId);
    
    // If no preferences exist, create default settings
    if (!preferences) {
      const defaultPreferences: InsertDashboardPreference = {
        userId,
        layout: {
          columns: 2,
          showWelcome: true,
          compactView: false,
        },
        favoriteAgents: [],
        recentTasks: [],
        widgets: [
          { id: "activity", position: 0, enabled: true },
          { id: "stats", position: 1, enabled: true },
          { id: "quickActions", position: 2, enabled: true },
          { id: "recentFiles", position: 3, enabled: true },
          { id: "agentStatus", position: 4, enabled: true },
        ],
        theme: "system",
        updatedAt: new Date(),
      };
      
      preferences = await storage.createDashboardPreference(defaultPreferences);
    }
    
    return preferences;
  } catch (error) {
    console.error("Error getting dashboard preferences:", error);
    throw new Error("Failed to retrieve dashboard preferences");
  }
}

/**
 * Update dashboard preferences for a user
 * @param userId The user ID
 * @param updates The preference updates to apply
 * @returns The updated dashboard preferences
 */
export async function updateDashboardPreferences(
  userId: number,
  updates: Partial<Omit<DashboardPreference, "id" | "userId">>
): Promise<DashboardPreference | null> {
  try {
    // Check if dashboard preferences exist
    const existingPreferences = await storage.getDashboardPreferenceByUserId(userId);
    
    if (!existingPreferences) {
      // Create if doesn't exist
      const defaultPreferences: InsertDashboardPreference = {
        userId,
        layout: updates.layout || {
          columns: 2,
          showWelcome: true,
          compactView: false,
        },
        favoriteAgents: updates.favoriteAgents || [],
        recentTasks: updates.recentTasks || [],
        widgets: updates.widgets || [
          { id: "activity", position: 0, enabled: true },
          { id: "stats", position: 1, enabled: true },
          { id: "quickActions", position: 2, enabled: true },
          { id: "recentFiles", position: 3, enabled: true },
          { id: "agentStatus", position: 4, enabled: true },
        ],
        theme: updates.theme || "system",
        updatedAt: new Date(),
      };
      
      return await storage.createDashboardPreference(defaultPreferences);
    }
    
    // Update existing preferences
    const updatedPreferences = await storage.updateDashboardPreference(
      existingPreferences.id,
      {
        ...updates,
        updatedAt: new Date(),
      }
    );
    
    return updatedPreferences;
  } catch (error) {
    console.error("Error updating dashboard preferences:", error);
    return null;
  }
}

/**
 * Add an agent to the user's favorites
 * @param userId The user ID
 * @param agentId The agent ID to add to favorites
 * @returns Success status
 */
export async function addFavoriteAgent(
  userId: number,
  agentId: number
): Promise<boolean> {
  try {
    const preferences = await getUserDashboardPreferences(userId);
    
    // Check if agent exists in user's favorites
    const favorites = preferences.favoriteAgents as any[] || [];
    if (!favorites.includes(agentId)) {
      // Add to favorites (max 5)
      const updatedFavorites = 
        [...favorites, agentId].slice(-5);
      
      await storage.updateDashboardPreference(preferences.id, {
        favoriteAgents: updatedFavorites,
        updatedAt: new Date(),
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error adding favorite agent:", error);
    return false;
  }
}

/**
 * Remove an agent from the user's favorites
 * @param userId The user ID
 * @param agentId The agent ID to remove from favorites
 * @returns Success status
 */
export async function removeFavoriteAgent(
  userId: number,
  agentId: number
): Promise<boolean> {
  try {
    const preferences = await getUserDashboardPreferences(userId);
    
    // Remove agent from favorites
    const favorites = preferences.favoriteAgents as any[] || [];
    const updatedFavorites = favorites.filter(id => id !== agentId);
    
    await storage.updateDashboardPreference(preferences.id, {
      favoriteAgents: updatedFavorites,
      updatedAt: new Date(),
    });
    
    return true;
  } catch (error) {
    console.error("Error removing favorite agent:", error);
    return false;
  }
}

/**
 * Update the user's recent tasks in dashboard
 * @param userId The user ID
 * @param taskId The task ID to add to recent tasks
 * @returns Success status
 */
export async function updateRecentTasks(
  userId: number,
  taskId: number
): Promise<boolean> {
  try {
    const preferences = await getUserDashboardPreferences(userId);
    
    // Add new task ID to the front, limit to 5 tasks
    const recentTasks = preferences.recentTasks as any[] || [];
    const updatedTasks = 
      [taskId, ...recentTasks.filter(id => id !== taskId)].slice(0, 5);
    
    await storage.updateDashboardPreference(preferences.id, {
      recentTasks: updatedTasks,
      updatedAt: new Date(),
    });
    
    return true;
  } catch (error) {
    console.error("Error updating recent tasks:", error);
    return false;
  }
}