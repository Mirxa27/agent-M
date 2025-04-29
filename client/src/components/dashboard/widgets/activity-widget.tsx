import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { Widget } from './widget-base';
import { LoadingWidget } from './loading-widget';
import { EmptyState } from '@/components/ui/empty-state';
import { TimelineList, TimelineItem } from '@/components/ui/timeline';

export interface ActivityWidgetProps {
  limit?: number;
  onRemove?: () => void;
}

export const ActivityWidget = ({ limit = 5, onRemove }: ActivityWidgetProps) => {
  const { 
    isLoading, 
    error, 
    data: activities,
    refetch 
  } = useQuery({
    queryKey: ['/api/user/activity', { limit }],
  });

  if (isLoading) {
    return <LoadingWidget title="Recent Activity" icon={<Activity className="h-5 w-5" />} />;
  }

  if (error) {
    return (
      <Widget 
        id="activity"
        title="Recent Activity" 
        icon={<Activity className="h-5 w-5" />}
        onRemove={onRemove}
        onRefresh={() => refetch()}
      >
        <EmptyState
          icon={<Activity className="h-10 w-10" />}
          title="Failed to load activities"
          description="There was an error loading your recent activities."
          actionText="Retry"
          onAction={() => refetch()}
        />
      </Widget>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Widget 
        id="activity"
        title="Recent Activity" 
        icon={<Activity className="h-5 w-5" />}
        onRemove={onRemove}
        onRefresh={() => refetch()}
      >
        <EmptyState
          icon={<Activity className="h-10 w-10" />}
          title="No recent activity"
          description="Your recent actions will appear here."
        />
      </Widget>
    );
  }

  return (
    <Widget 
      id="activity"
      title="Recent Activity"
      description="Your latest actions and events"
      icon={<Activity className="h-5 w-5" />}
      onRemove={onRemove}
      onRefresh={() => refetch()}
    >
      <TimelineList>
        {activities.map((activity: any) => (
          <TimelineItem
            key={activity.id}
            title={activity.activityType}
            description={activity.metadata?.description || ''}
            timestamp={new Date(activity.timestamp)}
            icon={activity.metadata?.icon || undefined}
          />
        ))}
      </TimelineList>
    </Widget>
  );
};