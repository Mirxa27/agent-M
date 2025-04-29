import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorkflowExecution, WorkflowStepExecution } from '@shared/schema';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, Clock, RotateCw, FastForward, PauseCircle } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

interface WorkflowProgressTrackerProps {
  executionId: number;
  onComplete?: (execution: WorkflowExecution) => void;
  onError?: (error: Error, execution?: WorkflowExecution) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showStepDetails?: boolean;
}

/**
 * Component for tracking and visualizing workflow execution progress
 */
export function WorkflowProgressTracker({
  executionId,
  onComplete,
  onError,
  autoRefresh = true,
  refreshInterval = 2000,
  showStepDetails = true,
}: WorkflowProgressTrackerProps) {
  // Get execution data with automatic refreshing
  const { 
    data: execution,
    error: executionError,
    isLoading: isLoadingExecution,
  } = useQuery({
    queryKey: [`/api/workflow-progress/executions/${executionId}`],
    refetchInterval: autoRefresh ? refreshInterval : false,
    enabled: !!executionId,
  });

  // Get execution steps
  const {
    data: steps,
    error: stepsError,
    isLoading: isLoadingSteps,
  } = useQuery({
    queryKey: [`/api/workflow-progress/executions/${executionId}/steps`],
    refetchInterval: autoRefresh ? refreshInterval : false,
    enabled: !!executionId,
  });

  // Track if we've already called onComplete
  const [hasCalledComplete, setHasCalledComplete] = useState(false);
  
  // Track if we've already called onError
  const [hasCalledError, setHasCalledError] = useState(false);

  // Call onComplete when execution is completed
  useEffect(() => {
    if (
      execution && 
      execution.status === 'completed' && 
      onComplete && 
      !hasCalledComplete
    ) {
      onComplete(execution);
      setHasCalledComplete(true);
    }
  }, [execution, onComplete, hasCalledComplete]);

  // Call onError when execution fails
  useEffect(() => {
    if (
      execution && 
      execution.status === 'failed' && 
      onError && 
      !hasCalledError
    ) {
      onError(new Error(execution.error || 'Workflow execution failed'), execution);
      setHasCalledError(true);
    }
  }, [execution, onError, hasCalledError]);

  // Call onError on API errors
  useEffect(() => {
    if ((executionError || stepsError) && onError && !hasCalledError) {
      onError(executionError || stepsError);
      setHasCalledError(true);
    }
  }, [executionError, stepsError, onError, hasCalledError]);

  const isLoading = isLoadingExecution || isLoadingSteps;
  const error = executionError || stepsError;

  if (isLoading && !execution) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Loading Workflow Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={0} className="h-2 mb-2" />
          <p className="text-sm text-muted-foreground">Loading workflow execution details...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load workflow progress: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!execution) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No execution found</AlertTitle>
        <AlertDescription>
          No workflow execution data found for ID: {executionId}
        </AlertDescription>
      </Alert>
    );
  }

  // Function to get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'running':
        return <Badge className="bg-blue-500 flex items-center"><RotateCw className="w-3 h-3 mr-1 animate-spin" /> Running</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Complete</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="flex items-center"><PauseCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      case 'skipped':
        return <Badge variant="secondary" className="flex items-center"><FastForward className="w-3 h-3 mr-1" /> Skipped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format duration nicely
  const formatDuration = (ms?: number): string => {
    if (!ms) return '--';
    
    if (ms < 1000) return `${ms}ms`;
    
    const seconds = Math.floor(ms / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Workflow Progress</CardTitle>
          {getStatusBadge(execution.status)}
        </div>
        <CardDescription>
          Started: {new Date(execution.startedAt).toLocaleString()}
          {execution.completedAt && (
            <> · Completed: {new Date(execution.completedAt).toLocaleString()}</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress:</span>
              <span>{execution.progress}%</span>
            </div>
            <Progress value={execution.progress} className="h-2" />
          </div>

          {execution.error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{execution.error}</AlertDescription>
            </Alert>
          )}

          {showStepDetails && steps && steps.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Workflow Steps</h4>
              <div className="space-y-2">
                {steps.map((step: WorkflowStepExecution) => (
                  <div key={step.id} className="rounded-md border p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="font-medium">Step {step.order}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          {step.actionType}
                        </span>
                      </div>
                      {getStatusBadge(step.status)}
                    </div>
                    
                    {(step.status === 'completed' || step.status === 'failed') && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Duration: {formatDuration(step.duration)}
                        {step.retries > 0 && <> · Retries: {step.retries}</>}
                      </div>
                    )}
                    
                    {step.error && (
                      <div className="mt-2 text-sm text-red-500">{step.error}</div>
                    )}
                    
                    {step.screenshot && (
                      <div className="mt-2">
                        <a 
                          href={step.screenshot} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          View Screenshot
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {execution.status === 'running' || execution.status === 'pending' ? (
          <Button 
            variant="ghost" 
            size="sm" 
            disabled={!autoRefresh} 
            onClick={() => {
              // Force refetch
              queryClient.invalidateQueries({ 
                queryKey: [`/api/workflow-progress/executions/${executionId}`] 
              });
              queryClient.invalidateQueries({ 
                queryKey: [`/api/workflow-progress/executions/${executionId}/steps`] 
              });
            }}
          >
            <RotateCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}