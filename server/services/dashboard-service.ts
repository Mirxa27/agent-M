import { db } from "../db";
import { eq } from "drizzle-orm";
import { dashboardPreferences } from "@shared/schema";

export interface WidgetConfig {
  id: string;
  position: number;
  enabled: boolean;
  settings?: Record<string, unknown>;
}

export interface DashboardLayout {
  columns: number;
  showWelcome: boolean;
}

export interface DashboardPreference {
  id: number;
  userId: number;
  widgets: WidgetConfig[];
  layout: DashboardLayout;
  theme: string;
}

export async function getDashboardPreferences(userId: number): Promise<DashboardPreference | null> {
  try {
    const [preferences] = await db
      .select()
      .from(dashboardPreferences)
      .where(eq(dashboardPreferences.userId, userId));

    if (!preferences) {
      return null;
    }

    // Safe type casting for JSON fields
    const widgetsData = Array.isArray(preferences.widgets) 
      ? preferences.widgets 
      : [];
      
    const layoutData = preferences.layout && typeof preferences.layout === 'object'
      ? preferences.layout as Record<string, unknown>
      : { columns: 2, showWelcome: true };

    return {
      ...preferences,
      widgets: widgetsData as WidgetConfig[],
      layout: layoutData as DashboardLayout,
    };
  } catch (error) {
    console.error("Error fetching dashboard preferences:", error);
    throw error;
  }
}

export async function createDefaultDashboardPreferences(
  userId: number
): Promise<DashboardPreference> {
  const defaultWidgets: WidgetConfig[] = [
    { id: "activity", position: 0, enabled: true },
    { id: "stats", position: 1, enabled: true },
    { id: "quickActions", position: 2, enabled: true },
    { id: "recentFiles", position: 3, enabled: true },
    { id: "agentStatus", position: 4, enabled: true },
    { id: "aiProviders", position: 5, enabled: true },
  ];

  const defaultLayout: DashboardLayout = {
    columns: 2,
    showWelcome: true,
  };

  const defaultPreferences = {
    userId,
    widgets: defaultWidgets,
    layout: defaultLayout,
    theme: "system",
  };

  try {
    const [newPreferences] = await db
      .insert(dashboardPreferences)
      .values(defaultPreferences)
      .returning();

    // Safe type casting for JSON fields
    const widgetsData = Array.isArray(newPreferences.widgets) 
      ? newPreferences.widgets 
      : defaultWidgets;
      
    const layoutData = newPreferences.layout && typeof newPreferences.layout === 'object'
      ? newPreferences.layout as Record<string, unknown>
      : defaultLayout;

    return {
      ...newPreferences,
      widgets: widgetsData as WidgetConfig[],
      layout: layoutData as DashboardLayout,
    };
  } catch (error) {
    console.error("Error creating dashboard preferences:", error);
    throw error;
  }
}

export async function updateDashboardPreferences(
  userId: number,
  updates: Partial<DashboardPreference>
): Promise<DashboardPreference> {
  try {
    const [existingPrefs] = await db
      .select()
      .from(dashboardPreferences)
      .where(eq(dashboardPreferences.userId, userId));

    if (!existingPrefs) {
      const newPrefs = await createDefaultDashboardPreferences(userId);
      return updateDashboardPreferences(userId, updates);
    }

    // Process nested objects safely
    let updatedWidgets = existingPrefs.widgets;
    if (updates.widgets && Array.isArray(updates.widgets)) {
      updatedWidgets = updates.widgets;
    }

    let updatedLayout = existingPrefs.layout;
    if (updates.layout && typeof updates.layout === 'object') {
      const currentLayout = typeof existingPrefs.layout === 'object' 
        ? existingPrefs.layout as Record<string, unknown>
        : { columns: 2, showWelcome: true };
      
      updatedLayout = {
        ...currentLayout,
        ...updates.layout as Record<string, unknown>
      };
    }

    // Merge updates with existing preferences
    const updatedPreferences = {
      ...existingPrefs,
      ...updates,
      // Override with our processed nested objects
      widgets: updatedWidgets,
      layout: updatedLayout,
    };

    const [updated] = await db
      .update(dashboardPreferences)
      .set(updatedPreferences)
      .where(eq(dashboardPreferences.userId, userId))
      .returning();

    // Safe type casting for JSON fields in response
    const widgetsData = Array.isArray(updated.widgets) 
      ? updated.widgets 
      : [];
      
    const layoutData = updated.layout && typeof updated.layout === 'object'
      ? updated.layout as Record<string, unknown>
      : { columns: 2, showWelcome: true };

    return {
      ...updated,
      widgets: widgetsData as WidgetConfig[],
      layout: layoutData as DashboardLayout,
    };
  } catch (error) {
    console.error("Error updating dashboard preferences:", error);
    throw error;
  }
}