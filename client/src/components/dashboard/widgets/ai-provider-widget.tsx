import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Sparkles, CheckCircle, XCircle, AlertCircle, Settings } from 'lucide-react';
import { Widget } from './widget-base';
import { LoadingWidget } from './loading-widget';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';

export interface AIProviderWidgetProps {
  onRemove?: () => void;
}

export const AIProviderWidget = ({ onRemove }: AIProviderWidgetProps) => {
  const { user } = useAuth();
  
  const { 
    isLoading, 
    error, 
    data: providers,
    refetch 
  } = useQuery({
    queryKey: ['/api/ai-providers/status'],
    enabled: !!user,
  });

  if (isLoading) {
    return <LoadingWidget title="AI Providers" icon={<Sparkles className="h-5 w-5" />} />;
  }

  // If no providers are available, show empty state
  if (!providers || !Array.isArray(providers) || providers.length === 0) {
    return (
      <Widget 
        id="aiProviders"
        title="AI Providers" 
        icon={<Sparkles className="h-5 w-5" />}
        onRemove={onRemove}
        onRefresh={() => refetch()}
      >
        <EmptyState
          icon={<Sparkles className="h-10 w-10" />}
          title="No AI Providers"
          description="No AI providers are currently configured."
          actionText="Refresh"
          onAction={() => refetch()}
        />
      </Widget>
    );
  }

  const data = providers;

  if (error) {
    return (
      <Widget 
        id="aiProviders"
        title="AI Providers" 
        icon={<Sparkles className="h-5 w-5" />}
        onRemove={onRemove}
        onRefresh={() => refetch()}
      >
        <EmptyState
          icon={<Sparkles className="h-10 w-10" />}
          title="Failed to load AI providers"
          description="There was an error loading your AI provider status."
          actionText="Retry"
          onAction={() => refetch()}
        />
      </Widget>
    );
  }

  const getStatusIcon = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Widget 
      id="aiProviders"
      title="AI Providers"
      description="Status of connected AI services"
      icon={<Sparkles className="h-5 w-5" />}
      onRemove={onRemove}
      onRefresh={() => refetch()}
    >
      <div className="space-y-3">
        {Array.isArray(data) && data.map((provider: any) => (
          <div key={provider.id} className="border rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span>{getStatusIcon(provider.status)}</span>
                <span className="font-medium">{provider.name}</span>
              </div>
              <Link href="/credentials">
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Settings className="h-3.5 w-3.5 mr-1" />
                  Configure
                </Button>
              </Link>
            </div>
            
            {provider.status === 'active' && provider.quotaLimit > 0 && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Quota Usage</span>
                  <span>{provider.quotaUsed} / {provider.quotaLimit} {provider.quotaUnit}</span>
                </div>
                <Progress 
                  value={(provider.quotaUsed / provider.quotaLimit) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </Widget>
  );
};