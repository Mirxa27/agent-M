import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Plus, LayoutGrid, LayoutList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Import our widgets
import {
  ActivityWidget,
  StatsWidget,
  QuickActionsWidget,
  RecentFilesWidget,
  AgentStatusWidget,
  AIProviderWidget,
  AVAILABLE_WIDGETS,
  WidgetConfig
} from './widgets';

export const DashboardWidgets = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  // Fetch dashboard preferences
  const { isLoading, error, data } = useQuery({
    queryKey: ['/api/user/dashboard/preferences'],
    retry: 1,
    enabled: !!user, // Only run query if user is logged in
  });

  // Update dashboard preferences
  const { mutate: updatePreferences } = useMutation({
    mutationFn: (updates: any) =>
      apiRequest('PATCH', '/api/user/dashboard/preferences', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/user/dashboard/preferences'],
      });
      toast({
        title: 'Dashboard Updated',
        description: 'Your dashboard preferences have been saved.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update dashboard preferences.',
      });
    },
  });

  // Handle widget toggle
  const handleWidgetToggle = (widgetId: string, enabled: boolean) => {
    if (!data) return;

    const updatedWidgets = data.widgets.map((widget: WidgetConfig) =>
      widget.id === widgetId ? { ...widget, enabled } : widget,
    );

    updatePreferences({ widgets: updatedWidgets });
  };

  // Handle widget removal
  const handleRemoveWidget = (widgetId: string) => {
    if (!data) return;

    const updatedWidgets = data.widgets.filter(
      (widget: WidgetConfig) => widget.id !== widgetId,
    );

    updatePreferences({ widgets: updatedWidgets });
    
    toast({
      title: 'Widget Removed',
      description: 'The widget has been removed from your dashboard.'
    });
  };

  // Add a new widget
  const handleAddWidget = () => {
    if (!data || !selectedWidgetId) return;

    // Check if widget already exists
    if (data.widgets.some((w: WidgetConfig) => w.id === selectedWidgetId)) {
      // Just enable it if it exists
      const updatedWidgets = data.widgets.map((widget: WidgetConfig) =>
        widget.id === selectedWidgetId ? { ...widget, enabled: true } : widget,
      );
      updatePreferences({ widgets: updatedWidgets });
    } else {
      // Add new widget
      const newWidget = {
        id: selectedWidgetId,
        position: data.widgets.length,
        enabled: true,
      };
      
      updatePreferences({ 
        widgets: [...data.widgets, newWidget] 
      });
    }

    setAddWidgetOpen(false);
    setSelectedWidgetId(null);

    toast({
      title: 'Widget Added',
      description: 'The widget has been added to your dashboard.'
    });
  };

  // Handle layout change
  const handleLayoutChange = (columns: number) => {
    if (!data) return;

    updatePreferences({
      layout: {
        ...data.layout,
        columns,
      },
    });
  };

  // Widget mappings
  const widgetComponents: Record<string, React.FC<{onRemove: () => void}>> = {
    activity: (props) => <ActivityWidget {...props} />,
    stats: (props) => <StatsWidget {...props} />,
    quickActions: (props) => <QuickActionsWidget {...props} />,
    recentFiles: (props) => <RecentFilesWidget {...props} />,
    agentStatus: (props) => <AgentStatusWidget {...props} />,
    aiProviders: (props) => <AIProviderWidget {...props} />
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 border rounded-md text-center">
        <p className="text-muted-foreground">
          Failed to load dashboard preferences. Please refresh the page.
        </p>
      </div>
    );
  }

  const { layout, widgets } = data;
  const enabledWidgets = widgets.filter((w: WidgetConfig) => w.enabled);
  const sortedWidgets = [...enabledWidgets].sort(
    (a: WidgetConfig, b: WidgetConfig) => a.position - b.position
  );

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium">Your Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Customize your dashboard by adding, removing, or rearranging widgets.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end">
          <div className="flex border rounded-md">
            <Button
              variant={layout.columns === 1 ? 'default' : 'ghost'}
              className="h-9 px-3"
              onClick={() => handleLayoutChange(1)}
              size="sm"
            >
              <LayoutList className="h-4 w-4" />
              <span className="sr-only">Single column</span>
            </Button>
            <Button
              variant={layout.columns === 2 ? 'default' : 'ghost'}
              className="h-9 px-3"
              onClick={() => handleLayoutChange(2)}
              size="sm"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Two columns</span>
            </Button>
          </div>

          <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9">
                <Plus className="h-4 w-4 mr-1" />
                Add Widget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Dashboard Widget</DialogTitle>
                <DialogDescription>
                  Select a widget to add to your dashboard.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <Select onValueChange={(value) => setSelectedWidgetId(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a widget" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_WIDGETS.map((widget) => (
                      <SelectItem key={widget.id} value={widget.id}>
                        {widget.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="mt-4">
                  {selectedWidgetId && (
                    <p className="text-sm text-muted-foreground">
                      {AVAILABLE_WIDGETS.find(w => w.id === selectedWidgetId)?.description}
                    </p>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddWidgetOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddWidget} disabled={!selectedWidgetId}>
                  Add Widget
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div
        className={`grid gap-6 ${
          layout.columns === 1
            ? 'grid-cols-1'
            : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
        {sortedWidgets.map((widget: WidgetConfig) => {
          const WidgetComponent = widgetComponents[widget.id];
          return WidgetComponent ? (
            <div key={widget.id}>
              <WidgetComponent onRemove={() => handleRemoveWidget(widget.id)} />
            </div>
          ) : null;
        })}
        
        {sortedWidgets.length === 0 && (
          <div className="col-span-full p-8 border rounded-md text-center">
            <h3 className="text-lg font-medium mb-2">No Widgets Added</h3>
            <p className="text-muted-foreground mb-4">
              Your dashboard is empty. Add widgets to customize your experience.
            </p>
            <Button onClick={() => setAddWidgetOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Your First Widget
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 border rounded-md bg-muted/50">
        <h3 className="text-sm font-medium mb-2">Dashboard Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-full pb-2 mb-2 border-b">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Layout</h4>
            <div className="flex items-center gap-4">
              <Button
                variant={layout.columns === 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLayoutChange(1)}
              >
                Single Column
              </Button>
              <Button
                variant={layout.columns === 2 ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLayoutChange(2)}
              >
                Two Columns
              </Button>
            </div>
          </div>
          
          <div className="col-span-full">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Widgets</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.widgets.map((widget: WidgetConfig) => {
                const widgetInfo = AVAILABLE_WIDGETS.find(w => w.id === widget.id);
                return (
                  <div key={widget.id} className="flex items-center space-x-2">
                    <Switch
                      id={`widget-${widget.id}`}
                      checked={widget.enabled}
                      onCheckedChange={(checked) =>
                        handleWidgetToggle(widget.id, checked)
                      }
                    />
                    <Label htmlFor={`widget-${widget.id}`}>
                      {widgetInfo?.title || widget.id}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};