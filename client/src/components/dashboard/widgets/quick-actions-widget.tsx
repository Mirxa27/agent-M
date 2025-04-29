import { Link, useLocation } from 'wouter';
import { Zap, Plus, RefreshCw, Settings, Command, Key } from 'lucide-react';
import { Widget } from './widget-base';
import { Button } from '@/components/ui/button';

export interface QuickActionsWidgetProps {
  onRemove?: () => void;
}

export const QuickActionsWidget = ({ onRemove }: QuickActionsWidgetProps) => {
  const [_, navigate] = useLocation();

  const actions = [
    {
      label: 'Create Agent',
      icon: <Plus className="h-4 w-4 mr-2" />,
      onClick: () => navigate('/agents/new'),
    },
    {
      label: 'Manage Credentials',
      icon: <Key className="h-4 w-4 mr-2" />,
      onClick: () => navigate('/credentials'),
    },
    {
      label: 'Launch AI Browser',
      icon: <Command className="h-4 w-4 mr-2" />,
      onClick: () => navigate('/ai-browser'),
    },
    {
      label: 'View Settings',
      icon: <Settings className="h-4 w-4 mr-2" />,
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <Widget 
      id="quickActions"
      title="Quick Actions"
      description="Common tasks and shortcuts"
      icon={<Zap className="h-5 w-5" />}
      onRemove={onRemove}
      onRefresh={() => {}}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Button 
            key={index}
            variant="outline" 
            className="justify-start"
            onClick={action.onClick}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </Widget>
  );
};