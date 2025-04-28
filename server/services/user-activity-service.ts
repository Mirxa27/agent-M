import {
  InsertUserActivity,
  UserActivity,
  type InsertAnalytics
} from "@shared/schema";
import { storage } from "../storage";

export type ActivityType =
  | "login"
  | "logout"
  | "agent_created"
  | "agent_deleted"
  | "task_created"
  | "task_completed"
  | "credential_created"
  | "credential_deleted"
  | "file_uploaded"
  | "file_deleted"
  | "settings_changed"
  | "dashboard_customized";

export type ResourceType =
  | "agent"
  | "task"
  | "credential"
  | "file"
  | "user"
  | "dashboard";

/**
 * Track a user activity
 * @param userId The user ID
 * @param activityType The type of activity
 * @param resourceId Optional related resource ID
 * @param resourceType Optional related resource type
 * @param metadata Optional additional activity details
 * @returns The created user activity
 */
export async function trackUserActivity(
  userId: number,
  activityType: ActivityType,
  resourceId?: number | null,
  resourceType?: ResourceType | null,
  metadata: Record<string, any> = {}
): Promise<UserActivity> {
  try {
    const activityData: InsertUserActivity = {
      userId,
      activityType,
      resourceId,
      resourceType,
      metadata
    };

    const activity = await storage.createUserActivity(activityData);
    
    // Update analytics aggregation asynchronously
    updateAnalytics(userId, activityType, resourceType).catch(error => {
      console.error("Error updating analytics:", error);
    });
    
    return activity;
  } catch (error) {
    console.error("Error tracking user activity:", error);
    throw new Error("Failed to track user activity");
  }
}

/**
 * Update user analytics data based on an activity
 */
async function updateAnalytics(
  userId: number, 
  activityType: ActivityType,
  resourceType?: ResourceType | null
): Promise<void> {
  try {
    // Get current date info for analytics period
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Check if we have analytics for this user and period
    const analytics = await storage.getAnalyticsByUserIdAndPeriod(
      userId, 
      "monthly", 
      startOfMonth, 
      endOfMonth
    );

    if (analytics) {
      // Update existing analytics
      const updates: Partial<InsertAnalytics> = {};
      
      if (activityType === "task_created") {
        updates.taskCount = (analytics.taskCount || 0) + 1;
      }
      
      if (activityType === "task_completed") {
        updates.successfulTaskCount = (analytics.successfulTaskCount || 0) + 1;
      }
      
      // Only update if we have changes
      if (Object.keys(updates).length > 0) {
        await storage.updateAnalytics(analytics.id, updates);
      }
    } else {
      // Create new analytics record for this period
      const initialData: InsertAnalytics = {
        userId,
        period: "monthly",
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        taskCount: activityType === "task_created" ? 1 : 0,
        successfulTaskCount: activityType === "task_completed" ? 1 : 0,
        failedTaskCount: 0,
        tokenUsage: 0,
        mostUsedAgentId: null,
        mostUsedToolType: null,
        averageCompletionTime: null,
        metadata: {}
      };
      
      await storage.createAnalytics(initialData);
    }
  } catch (error) {
    console.error("Error updating analytics:", error);
  }
}

/**
 * Get recent activities for a user
 * @param userId The user ID
 * @param limit Optional limit of activities to retrieve
 * @returns List of user activities
 */
export async function getUserRecentActivities(
  userId: number,
  limit = 10
): Promise<UserActivity[]> {
  try {
    return await storage.getUserActivitiesByUserId(userId, limit);
  } catch (error) {
    console.error("Error retrieving user activities:", error);
    return [];
  }
}

/**
 * Get analytics summary for a user
 * @param userId The user ID
 * @returns Analytics data or null if not found
 */
export async function getUserAnalyticsSummary(
  userId: number
): Promise<Record<string, any> | null> {
  try {
    // Get current month analytics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const currentMonthData = await storage.getAnalyticsByUserIdAndPeriod(
      userId, 
      "monthly", 
      startOfMonth, 
      endOfMonth
    );
    
    // Get previous month for comparison
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    
    const prevMonthData = await storage.getAnalyticsByUserIdAndPeriod(
      userId, 
      "monthly", 
      startOfPrevMonth, 
      endOfPrevMonth
    );
    
    // Get user's plan data
    const user = await storage.getUser(userId);
    const planId = user?.planId;
    let planData = null;
    
    if (planId) {
      const plan = await storage.getPlan(planId);
      if (plan) {
        planData = {
          name: plan.name,
          features: plan.features
        };
      }
    }
    
    // If no data exists yet, return empty stats
    if (!currentMonthData) {
      return {
        thisMonth: {
          taskCount: 0,
          successfulTaskCount: 0,
          failedTaskCount: 0,
          tokenUsage: 0
        },
        previousMonth: prevMonthData ? {
          taskCount: prevMonthData.taskCount,
          successfulTaskCount: prevMonthData.successfulTaskCount,
          failedTaskCount: prevMonthData.failedTaskCount,
          tokenUsage: prevMonthData.tokenUsage
        } : null,
        plan: planData,
        recentActivity: []
      };
    }
    
    // Get most used agent if available
    let mostUsedAgentName = null;
    if (currentMonthData.mostUsedAgentId) {
      const agent = await storage.getAgent(currentMonthData.mostUsedAgentId);
      if (agent) {
        mostUsedAgentName = agent.name;
      }
    }
    
    // Get recent activities
    const recentActivities = await storage.getUserActivitiesByUserId(userId, 5);
    
    return {
      thisMonth: {
        taskCount: currentMonthData.taskCount,
        successfulTaskCount: currentMonthData.successfulTaskCount,
        failedTaskCount: currentMonthData.failedTaskCount,
        tokenUsage: currentMonthData.tokenUsage,
        mostUsedAgent: mostUsedAgentName,
        mostUsedToolType: currentMonthData.mostUsedToolType,
        averageCompletionTime: currentMonthData.averageCompletionTime
      },
      previousMonth: prevMonthData ? {
        taskCount: prevMonthData.taskCount,
        successfulTaskCount: prevMonthData.successfulTaskCount,
        failedTaskCount: prevMonthData.failedTaskCount,
        tokenUsage: prevMonthData.tokenUsage
      } : null,
      plan: planData,
      recentActivity: recentActivities.map(a => ({
        id: a.id,
        type: a.activityType,
        resourceType: a.resourceType,
        timestamp: a.createdAt,
        metadata: a.metadata
      }))
    };
  } catch (error) {
    console.error("Error retrieving user analytics:", error);
    return null;
  }
}