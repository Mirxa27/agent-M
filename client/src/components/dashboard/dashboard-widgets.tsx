import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Plus, LayoutGrid, LayoutList, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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

// Widget Component Map to render the correct widget based on ID
const WIDGET_COMPONENTS: Record<string, React.FC<{ onRemove: () => void }>> = {
  activity: ({ onRemove }) => <ActivityWidget onRemove={onRemove} />,
  stats: ({ onRemove }) => <StatsWidget onRemove={onRemove} />,
  quickActions: ({ onRemove }) => <QuickActionsWidget onRemove={onRemove} />,
  recentFiles: ({ onRemove }) => <RecentFilesWidget onRemove={onRemove} />,
  agentStatus: ({ onRemove }) => <AgentStatusWidget onRemove={onRemove} />,
  aiProviders: ({ onRemove }) => <AIProviderWidget onRemove={onRemove} />,
};

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
      widget.id === widgetId ? { ...widget, enabled } : widget
    );

    updatePreferences({ widgets: updatedWidgets });
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

  // Handle the removal of a widget
  const handleRemoveWidget = (widgetId: string) => {
    if (!data) return;

    const updatedWidgets = data.widgets.map((widget: WidgetConfig) =>
      widget.id === widgetId ? { ...widget, enabled: false } : widget
    );

    updatePreferences({ widgets: updatedWidgets });
  };

  // Handle adding a new widget
  const handleAddWidget = () => {
    if (!data || !selectedWidgetId) return;

    // Check if widget is already in the list but disabled
    const existingWidget = data.widgets.find((w: WidgetConfig) => w.id === selectedWidgetId);
    
    if (existingWidget) {
      // Re-enable existing widget
      const updatedWidgets = data.widgets.map((widget: WidgetConfig) =>
        widget.id === selectedWidgetId ? { ...widget, enabled: true } : widget
      );
      
      updatePreferences({ widgets: updatedWidgets });
    } else {
      // Add new widget with next position
      const maxPosition = Math.max(...data.widgets.map((w: WidgetConfig) => w.position), 0);
      
      const newWidget: WidgetConfig = {
        id: selectedWidgetId,
        position: maxPosition + 1,
        enabled: true,
      };
      
      updatePreferences({ widgets: [...data.widgets, newWidget] });
    }
    
    setAddWidgetOpen(false);
    setSelectedWidgetId(null);
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination || !data) return;

    const items = Array.from(data.widgets.filter((w: WidgetConfig) => w.enabled));
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions based on new order
    const updatedWidgets = data.widgets.map((widget: WidgetConfig) => {
      if (!widget.enabled) return widget;
      
      const newIndex = items.findIndex((item: WidgetConfig) => item.id === widget.id);
      return { ...widget, position: newIndex };
    });

    updatePreferences({ widgets: updatedWidgets });
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

  // Get available widgets that aren't already enabled
  const availableWidgetsToAdd = AVAILABLE_WIDGETS.filter(
    (w) => !enabledWidgets.some((ew: WidgetConfig) => ew.id === w.id)
  );

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium text-high-contrast text-shadow-sm">Your Dashboard</h2>
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
                <DialogTitle>Add Widget</DialogTitle>
                <DialogDescription>
                  Choose a widget to add to your dashboard.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select
                  value={selectedWidgetId || ''}
                  onValueChange={setSelectedWidgetId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select widget..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWidgetsToAdd.map((widget) => (
                      <SelectItem key={widget.id} value={widget.id}>
                        {widget.title}
                      </SelectItem>
                    ))}
                    {availableWidgetsToAdd.length === 0 && (
                      <SelectItem value="none" disabled>
                        No widgets available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedWidgetId && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {AVAILABLE_WIDGETS.find((w) => w.id === selectedWidgetId)?.description}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddWidgetOpen(false);
                    setSelectedWidgetId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddWidget}
                  disabled={!selectedWidgetId || availableWidgetsToAdd.length === 0}
                >
                  Add Widget
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {sortedWidgets.length === 0 ? (
        <div className="p-12 card-glass rounded-lg text-center">
          <p className="text-high-contrast text-shadow-sm mb-4">
            Your dashboard is empty. Add some widgets to get started.
          </p>
          <Button
            onClick={() => setAddWidgetOpen(true)}
            variant="default"
            className="shadow-glow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="widgets" direction="vertical">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`grid gap-6 ${
                  layout.columns === 1
                    ? "grid-cols-1"
                    : layout.columns === 3
                    ? "grid-cols-1 md:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                {sortedWidgets.map((widget: WidgetConfig, index: number) => {
                  const WidgetComponent = WIDGET_COMPONENTS[widget.id];
                  if (!WidgetComponent) return null;

                  return (
                    <Draggable key={widget.id} draggableId={widget.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`relative ${snapshot.isDragging ? 'z-50' : ''}`}
                        >
                          <div 
                            className="absolute top-3 left-3 cursor-grab p-1 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 z-10"
                            {...provided.dragHandleProps}
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="pl-7">
                            <div className="glass-effect-lighter rounded-lg p-4 hover:shadow-xl transition-all duration-300 card-hover text-shadow-sm border border-white/10">
                              <WidgetComponent onRemove={() => handleRemoveWidget(widget.id)} />
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <Dialog open={false}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Widgets</DialogTitle>
            <DialogDescription>
              Enable or disable widgets on your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-3">
              {widgets.map((widget: WidgetConfig) => {
                const widgetInfo = AVAILABLE_WIDGETS.find(
                  (w) => w.id === widget.id
                );
                return (
                  <div
                    key={widget.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
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
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};