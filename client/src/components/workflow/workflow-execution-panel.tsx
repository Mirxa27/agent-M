import React, { useState } from 'react';
import { useWorkflowProgress } from '@/hooks/use-workflow-progress';
import { WorkflowProgressTracker } from './workflow-progress-tracker';
import { WorkflowStepProgress } from './workflow-step-progress';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  PlayCircle, 
  Pause, 
  RotateCw, 
  ListIcon, 
  BarChart, 
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface WorkflowExecutionPanelProps {
  sequenceId: number;
  sequenceName: string;
  userId?: number;
  executionId?: number | null;
  onExecutionComplete?: (executionId: number) => void;
  autoStart?: boolean;
  className?: string;
}

/**
 * A complete panel for managing workflow execution with controls and progress visualization
 */
export function WorkflowExecutionPanel({
  sequenceId,
  sequenceName,
  userId,
  onExecutionComplete,
  autoStart = false,
  className,
}: WorkflowExecutionPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('progress');
  const [lastExecutionId, setLastExecutionId] = useState<number | null>(null);
  
  // Use our workflow progress hook
  const {
    executionId,
    hasStarted,
    isCompleted,
    hasFailed,
    isLoading,
    error,
    execution,
    steps,
    progress,
    status,
    startExecution,
  } = useWorkflowProgress(sequenceId, {
    onCompleted: (execution) => {
      toast({
        title: "Workflow completed",
        description: `The workflow "${sequenceName}" has completed successfully.`,
      });
      setLastExecutionId(execution.id);
      onExecutionComplete?.(execution.id);
    },
    onFailed: (execution, error) => {
      toast({
        title: "Workflow failed",
        description: error || "The workflow failed with an unknown error.",
        variant: "destructive",
      });
      setLastExecutionId(execution.id);
    }
  });
  
  // Start execution if autoStart is true
  React.useEffect(() => {
    if (autoStart && !hasStarted && !isLoading) {
      handleStartExecution();
    }
  }, [autoStart, hasStarted, isLoading]);
  
  // Function to start execution
  const handleStartExecution = async () => {
    try {
      await startExecution();
      toast({
        title: "Workflow started",
        description: `Starting the "${sequenceName}" workflow...`,
      });
    } catch (error) {
      toast({
        title: "Failed to start workflow",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Render loading state while initializing
  if (isLoading && !hasStarted) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center">
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
              Initializing Workflow
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (error && !hasStarted) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-500">Workflow Error</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to initialize workflow: {error instanceof Error ? error.message : String(error)}
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={handleStartExecution}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{sequenceName}</span>
          {!hasStarted ? (
            <Button onClick={handleStartExecution} variant="outline" size="sm">
              <PlayCircle className="mr-2 h-4 w-4" />
              Run Workflow
            </Button>
          ) : (
            <div className="flex items-center space-x-2 text-sm">
              <span>Status: </span>
              <span className={
                status === 'completed' ? 'text-green-500' :
                status === 'failed' ? 'text-red-500' :
                status === 'running' ? 'text-blue-500' :
                'text-muted-foreground'
              }>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              {status === 'running' && (
                <RotateCw className="h-4 w-4 text-blue-500 animate-spin" />
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {hasStarted ? (
          <Tabs defaultValue="progress" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="progress">
                <Activity className="mr-2 h-4 w-4" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="steps">
                <ListIcon className="mr-2 h-4 w-4" />
                Steps
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <BarChart className="mr-2 h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="progress">
              {executionId && (
                <WorkflowProgressTracker
                  executionId={executionId}
                  autoRefresh={status !== 'completed' && status !== 'failed'}
                  showStepDetails={false}
                />
              )}
            </TabsContent>
            
            <TabsContent value="steps">
              {steps && steps.length > 0 ? (
                <div className="p-4 border rounded-lg flex items-center justify-center">
                  <WorkflowStepProgress steps={steps} alwaysShowTooltip={false} />
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No step data available yet.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="timeline">
              <div className="space-y-4">
                {steps && steps.length > 0 ? (
                  steps
                  .sort((a, b) => a.order - b.order)
                  .map((step) => (
                    <div key={step.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">Step {step.order}: {step.actionType}</h4>
                          <p className="text-sm text-muted-foreground">
                            {step.targetElement || step.targetUrl || "No target specified"}
                          </p>
                        </div>
                        <div className="text-sm">
                          {step.status === 'completed' ? (
                            <span className="text-green-500">Completed</span>
                          ) : step.status === 'running' ? (
                            <span className="text-blue-500 flex items-center">
                              Running <RotateCw className="ml-1 h-3 w-3 animate-spin" />
                            </span>
                          ) : step.status === 'failed' ? (
                            <span className="text-red-500">Failed</span>
                          ) : (
                            <span className="text-muted-foreground">{step.status}</span>
                          )}
                        </div>
                      </div>
                      
                      {step.startedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Started: {new Date(step.startedAt).toLocaleString()}
                          {step.completedAt && (
                            <> · Completed: {new Date(step.completedAt).toLocaleString()}</>
                          )}
                          {step.duration && (
                            <> · Duration: {step.duration < 1000 ? `${step.duration}ms` : `${(step.duration / 1000).toFixed(1)}s`}</>
                          )}
                          {step.retries > 0 && (
                            <> · Retries: {step.retries}</>
                          )}
                        </p>
                      )}
                      
                      {step.error && (
                        <p className="text-xs text-red-500 mt-1">{step.error}</p>
                      )}
                      
                      {step.screenshot && (
                        <div className="mt-2">
                          <a 
                            href={step.screenshot} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                          >
                            View Screenshot
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No steps recorded yet.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center p-8">
            <PlayCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Click "Run Workflow" to start the workflow execution.
            </p>
          </div>
        )}
      </CardContent>
      
      {isCompleted && (
        <CardFooter className="flex justify-center border-t pt-4">
          <Button 
            variant="outline" 
            onClick={handleStartExecution}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Run Again
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}