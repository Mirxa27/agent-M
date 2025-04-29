import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workflowProgressService } from '@/lib/workflow-progress-service';
import type { WorkflowExecution, WorkflowStepExecution } from '@shared/schema';

interface UseWorkflowProgressOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
  onCompleted?: (execution: WorkflowExecution) => void;
  onFailed?: (execution: WorkflowExecution, error?: string) => void;
}

/**
 * Hook for tracking workflow execution progress
 */
export function useWorkflowProgress(
  sequenceId: number,
  initialExecutionId?: number | null,
  options: UseWorkflowProgressOptions = {}
) {
  const {
    refreshInterval = 2000,
    autoRefresh = true,
    onCompleted,
    onFailed,
  } = options;

  const [executionId, setExecutionId] = useState<number | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  
  // Create or start a workflow execution
  const startExecution = async (browserSessionId?: string) => {
    try {
      const execution = await workflowProgressService.startExecution(
        sequenceId,
        browserSessionId
      );
      setExecutionId(execution.id);
      setHasStarted(true);
      setIsCompleted(false);
      setHasFailed(false);
      return execution;
    } catch (error) {
      console.error("Failed to start workflow execution:", error);
      throw error;
    }
  };

  // Query for execution data
  const executionQuery = useQuery({
    queryKey: executionId ? [`/api/workflow-progress/executions/${executionId}`] : null,
    refetchInterval: autoRefresh && executionId 
      ? (data: WorkflowExecution) => 
          data?.status === 'completed' || data?.status === 'failed' || data?.status === 'cancelled'
            ? false 
            : refreshInterval
      : false,
    enabled: !!executionId,
    onSuccess: (data: WorkflowExecution) => {
      if (data.status === 'completed' && !isCompleted) {
        setIsCompleted(true);
        onCompleted?.(data);
      } else if (data.status === 'failed' && !hasFailed) {
        setHasFailed(true);
        onFailed?.(data, data.error);
      }
    },
  });

  // Query for execution steps
  const stepsQuery = useQuery({
    queryKey: executionId ? [`/api/workflow-progress/executions/${executionId}/steps`] : null,
    refetchInterval: autoRefresh && executionId && !isCompleted && !hasFailed 
      ? refreshInterval 
      : false,
    enabled: !!executionId,
  });

  // Get execution data
  const execution = executionQuery.data;
  
  // Get execution steps
  const steps = stepsQuery.data || [];
  
  // Get current step
  const currentStep = execution?.currentStepId 
    ? steps.find(step => step.id === execution.currentStepId)
    : null;
  
  // Calculate if loading
  const isLoading = !hasStarted || executionQuery.isLoading || stepsQuery.isLoading;
  
  // Get error
  const error = executionQuery.error || stepsQuery.error;
  
  return {
    // Status
    executionId,
    hasStarted,
    isCompleted,
    hasFailed,
    isLoading,
    error,
    
    // Data
    execution,
    steps,
    currentStep,
    progress: execution?.progress || 0,
    status: execution?.status || 'pending',
    
    // Actions
    startExecution,
    refetchExecution: executionQuery.refetch,
    refetchSteps: stepsQuery.refetch,
  };
}