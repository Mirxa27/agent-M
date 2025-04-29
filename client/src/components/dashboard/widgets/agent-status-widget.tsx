import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Gauge, Play, Pause, Settings, ExternalLink, CircleCheck, CircleX } from 'lucide-react';
import { Widget } from './widget-base';
import { LoadingWidget } from './loading-widget';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Progress } from '@/components/ui/progress';

// Interface for the agent status counts returned from API
interface AgentStatusCounts {
  total: number;
  active: number;
  inactive: number;
}

export interface AgentStatusWidgetProps {
  limit?: number;
  onRemove?: () => void;
}

export const AgentStatusWidget = ({ limit = 5, onRemove }: AgentStatusWidgetProps) => {
  const { user } = useAuth();
  
  // Updated to use the new status endpoint that returns count totals
  const { 
    isLoading, 
    error, 
    data: statusCounts,
    refetch 
  } = useQuery<AgentStatusCounts>({
    queryKey: ['/api/agents/status'],
    enabled: !!user,
  });

  if (isLoading) {
    return <LoadingWidget title="Agent Status" icon={<Gauge className="h-5 w-5" />} />;
  }

  if (error) {
    return (
      <Widget 
        id="agentStatus"
        title="Agent Status" 
        icon={<Gauge className="h-5 w-5" />}
        onRemove={onRemove}
        onRefresh={() => refetch()}
      >
        <EmptyState
          icon={<Gauge className="h-10 w-10" />}
          title="Failed to load agents"
          description="There was an error loading your agent status."
          actionText="Retry"
          onAction={() => refetch()}
        />
      </Widget>
    );
  }

  if (!statusCounts || statusCounts.total === 0) {
    return (
      <Widget 
        id="agentStatus"
        title="Agent Status" 
        icon={<Gauge className="h-5 w-5" />}
        onRemove={onRemove}
        onRefresh={() => refetch()}
      >
        <EmptyState
          icon={<Gauge className="h-10 w-10" />}
          title="No agents found"
          description="Create agents to monitor their status here."
          actionText="Create Agent"
          onAction={() => window.location.href = '/agents/new'}
        />
      </Widget>
    );
  }

  // Calculate the percentage of active agents
  const activePercentage = statusCounts.total > 0 
    ? Math.round((statusCounts.active / statusCounts.total) * 100) 
    : 0;

  return (
    <Widget 
      id="agentStatus"
      title="Agent Status"
      description="Current state of your AI agents"
      icon={<Gauge className="h-5 w-5" />}
      onRemove={onRemove}
      onRefresh={() => refetch()}
    >
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Agent Status</span>
            <span className="text-sm font-medium">{activePercentage}% Active</span>
          </div>
          <Progress value={activePercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <CircleCheck className="h-8 w-8 text-green-500 mb-1" />
            <span className="text-xl font-bold">{statusCounts.active}</span>
            <span className="text-xs text-muted-foreground">Active Agents</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-500/10 border border-gray-500/20">
            <CircleX className="h-8 w-8 text-gray-500 mb-1" />
            <span className="text-xl font-bold">{statusCounts.inactive}</span>
            <span className="text-xs text-muted-foreground">Inactive Agents</span>
          </div>
        </div>

        <div className="flex justify-center mt-2">
          <Link href="/agents">
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              View All Agents
            </Button>
          </Link>
        </div>
      </div>
    </Widget>
  );
};