import { useQuery } from '@tanstack/react-query';
import { BarChart2, Loader2 } from 'lucide-react';
import { Widget } from './widget-base';
import { LoadingWidget } from './loading-widget';
import { EmptyState } from '@/components/ui/empty-state';

export interface StatsWidgetProps {
  onRemove?: () => void;
}

export const StatsWidget = ({ onRemove }: StatsWidgetProps) => {
  const { 
    isLoading, 
    error, 
    data: analytics,
    refetch 
  } = useQuery({
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
        <div className="border rounded-md p-3">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Tasks</h3>
          <p className="text-2xl font-bold">{analytics.taskCount || 0}</p>
        </div>
        <div className="border rounded-md p-3">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Success Rate</h3>
          <p className="text-2xl font-bold">
            {analytics.taskCount 
              ? Math.round((analytics.successfulTaskCount / analytics.taskCount) * 100) 
              : 0}%
          </p>
        </div>
        <div className="border rounded-md p-3">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Token Usage</h3>
          <p className="text-2xl font-bold">{analytics.tokenUsage ? analytics.tokenUsage.toLocaleString() : 0}</p>
        </div>
        <div className="border rounded-md p-3">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Avg. Time</h3>
          <p className="text-2xl font-bold">
            {analytics.averageCompletionTime 
              ? Math.round(analytics.averageCompletionTime / 60) 
              : 0} min
          </p>
        </div>
      </div>
    </Widget>
  );
};