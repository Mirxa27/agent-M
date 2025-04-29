export * from './widget-base';
export * from './loading-widget';
export * from './activity-widget';
export * from './stats-widget';
export * from './quick-actions-widget';
export * from './recent-files-widget';
export * from './agent-status-widget';
export * from './ai-provider-widget';

// Define widget type for dashboard configuration
export interface WidgetConfig {
  id: string;
  position: number;
  enabled: boolean;
  settings?: Record<string, any>;
}

// Map widget IDs to titles and descriptions for the widget selector
export const AVAILABLE_WIDGETS = [
  {
    id: 'activity',
    title: 'Recent Activity',
    description: 'Your latest actions and events',
    defaultEnabled: true,
  },
  {
    id: 'stats',
    title: 'Analytics',
    description: 'Your platform usage statistics',
    defaultEnabled: true,
  },
  {
    id: 'quickActions',
    title: 'Quick Actions',
    description: 'Common tasks and shortcuts',
    defaultEnabled: true,
  },
  {
    id: 'recentFiles',
    title: 'Recent Files',
    description: 'Your recently uploaded and viewed files',
    defaultEnabled: true,
  },
  {
    id: 'agentStatus',
    title: 'Agent Status',
    description: 'Current state of your AI agents',
    defaultEnabled: true,
  },
  {
    id: 'aiProviders',
    title: 'AI Providers',
    description: 'Status of connected AI services',
    defaultEnabled: true,
  },
];