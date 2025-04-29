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
      
    let layoutData: DashboardLayout = { columns: 2, showWelcome: true };
    
    if (preferences.layout && typeof preferences.layout === 'object') {
      const layout = preferences.layout as Record<string, unknown>;
      layoutData = {
        columns: typeof layout.columns === 'number' ? layout.columns : 2,
        showWelcome: typeof layout.showWelcome === 'boolean' ? layout.showWelcome : true
      };
    }

    return {
      ...preferences,
      widgets: widgetsData as WidgetConfig[],
      layout: layoutData,
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
      
    let layoutData: DashboardLayout = defaultLayout;
    
    if (newPreferences.layout && typeof newPreferences.layout === 'object') {
      const layout = newPreferences.layout as Record<string, unknown>;
      layoutData = {
        columns: typeof layout.columns === 'number' ? layout.columns : defaultLayout.columns,
        showWelcome: typeof layout.showWelcome === 'boolean' ? layout.showWelcome : defaultLayout.showWelcome
      };
    }

    return {
      ...newPreferences,
      widgets: widgetsData as WidgetConfig[],
      layout: layoutData,
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

    // Default layout values
    const defaultLayout: DashboardLayout = { 
      columns: 2, 
      showWelcome: true 
    };

    // Extract current layout safely
    let currentLayout: DashboardLayout = defaultLayout;
    if (existingPrefs.layout && typeof existingPrefs.layout === 'object') {
      const layoutObj = existingPrefs.layout as Record<string, unknown>;
      currentLayout = {
        columns: typeof layoutObj.columns === 'number' ? layoutObj.columns : defaultLayout.columns,
        showWelcome: typeof layoutObj.showWelcome === 'boolean' ? layoutObj.showWelcome : defaultLayout.showWelcome
      };
    }

    // Process layout updates safely
    let updatedLayout = currentLayout;
    if (updates.layout) {
      if (typeof updates.layout === 'object') {
        const layoutUpdates = updates.layout as unknown as Record<string, unknown>;
        updatedLayout = {
          columns: typeof layoutUpdates.columns === 'number' ? layoutUpdates.columns : currentLayout.columns,
          showWelcome: typeof layoutUpdates.showWelcome === 'boolean' ? layoutUpdates.showWelcome : currentLayout.showWelcome
        };
      }
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
      
    // Create a properly typed layout object
    let layoutData: DashboardLayout = { columns: 2, showWelcome: true };
    
    if (updated.layout && typeof updated.layout === 'object') {
      const layout = updated.layout as Record<string, unknown>;
      layoutData = {
        columns: typeof layout.columns === 'number' ? layout.columns : 2,
        showWelcome: typeof layout.showWelcome === 'boolean' ? layout.showWelcome : true
      };
    }

    return {
      ...updated,
      widgets: widgetsData as WidgetConfig[],
      layout: layoutData,
    };
  } catch (error) {
    console.error("Error updating dashboard preferences:", error);
    throw error;
  }
}