import { useQuery } from '@tanstack/react-query';
import { BarChart2, Loader2 } from 'lucide-react';
import { Widget } from './widget-base';
import { LoadingWidget } from './loading-widget';
import { EmptyState } from '@/components/ui/empty-state';

export interface UserAnalytics {
  message?: string;
  taskCount?: number;
  successfulTaskCount?: number;
  failedTaskCount?: number;
  tokenUsage?: number;
  averageCompletionTime?: number;
  mostUsedAgentId?: number | null;
  mostUsedToolType?: string | null;
  period?: string;
  periodStart?: string;
  periodEnd?: string;
  metadata?: Record<string, any>;
}

export interface StatsWidgetProps {
  onRemove?: () => void;
}

export const StatsWidget = ({ onRemove }: StatsWidgetProps) => {
  const { 
    isLoading, 
    error, 
    data: analytics,
    refetch 
  } = useQuery<UserAnalytics>({
    queryKey: ['/api/user/analytics'],
  });

  if (isLoading) {
    return <LoadingWidget title="Analytics" icon={<BarChart2 className="h-5 w-5" />} />;
  }

  if (error) {
    return (
      <Widget 
        id="stats"
        title="Analytics" 
        icon={<BarChart2 className="h-5 w-5" />}
        onRemove={onRemove}
        onRefresh={() => refetch()}
      >
        <EmptyState
          icon={<BarChart2 className="h-10 w-10" />}
          title="Failed to load analytics"
          description="There was an error loading your analytics data."
          actionText="Retry"
          onAction={() => refetch()}
        />
      </Widget>
    );
  }

  if (!analytics || analytics.message === "No analytics data available") {
    return (
      <Widget 
        id="stats"
        title="Analytics" 
        icon={<BarChart2 className="h-5 w-5" />}
        onRemove={onRemove}
        onRefresh={() => refetch()}
      >
        <EmptyState
          icon={<BarChart2 className="h-10 w-10" />}
          title="No analytics data"
          description="Start using the platform to generate analytics data."
        />
      </Widget>
    );
  }

  return (
    <Widget 
      id="stats"
      title="Analytics"
      description="Your platform usage statistics"
      icon={<BarChart2 className="h-5 w-5" />}
      onRemove={onRemove}
      onRefresh={() => refetch()}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-effect-lighter rounded-lg p-3 border border-white/10 shadow-md relative group overflow-hidden hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <h3 className="text-sm font-medium text-white/80 mb-1 text-shadow-sm">Tasks</h3>
          <p className="text-2xl font-bold text-high-contrast text-shadow-md">{analytics.taskCount || 0}</p>
        </div>
        <div className="glass-effect-lighter rounded-lg p-3 border border-white/10 shadow-md relative group overflow-hidden hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <h3 className="text-sm font-medium text-white/80 mb-1 text-shadow-sm">Success Rate</h3>
          <p className="text-2xl font-bold text-high-contrast text-shadow-md">
            {analytics.taskCount 
              ? Math.round((analytics.successfulTaskCount / analytics.taskCount) * 100) 
              : 0}%
          </p>
        </div>
        <div className="glass-effect-lighter rounded-lg p-3 border border-white/10 shadow-md relative group overflow-hidden hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <h3 className="text-sm font-medium text-white/80 mb-1 text-shadow-sm">Token Usage</h3>
          <p className="text-2xl font-bold text-high-contrast text-shadow-md">{analytics.tokenUsage ? analytics.tokenUsage.toLocaleString() : 0}</p>
        </div>
        <div className="glass-effect-lighter rounded-lg p-3 border border-white/10 shadow-md relative group overflow-hidden hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <h3 className="text-sm font-medium text-white/80 mb-1 text-shadow-sm">Avg. Time</h3>
          <p className="text-2xl font-bold text-high-contrast text-shadow-md">
            {analytics.averageCompletionTime 
              ? Math.round(analytics.averageCompletionTime / 60) 
              : 0} min
          </p>
        </div>
      </div>
    </Widget>
  );
};