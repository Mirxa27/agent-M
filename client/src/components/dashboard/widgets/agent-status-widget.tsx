import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Gauge, Play, Pause, Settings, ExternalLink } from 'lucide-react';
import { Widget } from './widget-base';
import { LoadingWidget } from './loading-widget';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

export interface AgentStatusWidgetProps {
  limit?: number;
  onRemove?: () => void;
}

export const AgentStatusWidget = ({ limit = 5, onRemove }: AgentStatusWidgetProps) => {
  const { user } = useAuth();
  
  const { 
    isLoading, 
    error, 
    data: agents,
    refetch 
  } = useQuery({
    queryKey: ['/api/agents/status', { limit }],
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

  if (!agents || agents.length === 0) {
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

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active':
      case 'running':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'paused':
        return <Badge variant="outline">Paused</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  return (
    <Widget 
      id="agentStatus"
      title="Agent Status"
      description="Current state of your AI agents"
      icon={<Gauge className="h-5 w-5" />}
      onRemove={onRemove}
      onRefresh={() => refetch()}
    >
      <div className="space-y-2">
        {agents.map((agent: any) => (
          <div key={agent.id} className="flex items-center justify-between border rounded-md p-2">
            <div className="flex items-center">
              <div className="mr-3 text-muted-foreground">
                {agent.icon || <Gauge className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-medium truncate max-w-[150px]">{agent.name}</p>
                <div className="flex items-center gap-2">
                  {getStatusBadge(agent.status || 'inactive')}
                  {agent.lastActive && (
                    <span className="text-xs text-muted-foreground">
                      Last active: {new Date(agent.lastActive).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" title={agent.status === 'active' ? 'Pause agent' : 'Start agent'}>
                {agent.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" title="Agent settings">
                <Settings className="h-4 w-4" />
              </Button>
              <Link href={`/agents/${agent.id}`}>
                <Button variant="ghost" size="icon" title="View agent details">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Widget>
  );
};