import React from 'react';
import { cn } from '@/lib/utils';
import { WorkflowStepExecution } from '@shared/schema';
import { CheckCircle, AlertCircle, Clock, RotateCw, FastForward, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WorkflowStepProgressProps {
  steps: WorkflowStepExecution[];
  className?: string;
  alwaysShowTooltip?: boolean;
}

/**
 * Component for visually displaying workflow step progress in a compact, linear format
 */
export function WorkflowStepProgress({
  steps,
  className,
  alwaysShowTooltip = false,
}: WorkflowStepProgressProps) {
  // Sort steps by order
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  // Get step status icon
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-muted-foreground" />;
      case 'running':
        return <RotateCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'skipped':
        return <FastForward className="h-5 w-5 text-muted-foreground" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Get step status class
  const getStepStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-muted-foreground bg-muted';
      case 'running':
        return 'border-blue-500 bg-blue-100 dark:bg-blue-950';
      case 'completed':
        return 'border-green-500 bg-green-100 dark:bg-green-950';
      case 'failed':
        return 'border-red-500 bg-red-100 dark:bg-red-950';
      case 'skipped':
        return 'border-muted-foreground bg-muted';
      case 'cancelled':
        return 'border-gray-500 bg-gray-100 dark:bg-gray-900';
      default:
        return 'border-muted-foreground bg-muted';
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
    <div className={cn("flex items-center", className)}>
      {sortedSteps.map((step, index) => (
        <React.Fragment key={step.id}>
          {/* Connecting line between steps */}
          {index > 0 && (
            <div className="h-[2px] w-8 bg-border flex-shrink-0" />
          )}
          
          {/* Step circle */}
          <TooltipProvider>
            <Tooltip delayDuration={200} open={alwaysShowTooltip ? undefined : undefined}>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full border-2",
                    getStepStatusClass(step.status)
                  )}
                >
                  {getStepIcon(step.status)}
                  <span className="absolute -bottom-6 text-xs font-medium">
                    {step.order}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-sm">
                  <p className="font-semibold">Step {step.order}</p>
                  <p>{step.actionType}</p>
                  <p className="text-xs text-muted-foreground">
                    Status: {step.status}
                    {step.duration ? ` · Duration: ${formatDuration(step.duration)}` : ''}
                    {step.retries > 0 ? ` · Retries: ${step.retries}` : ''}
                  </p>
                  {step.error && (
                    <p className="text-xs text-red-500 max-w-[200px] truncate">
                      Error: {step.error}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Mini version of the workflow step progress for smaller spaces
 */
export function WorkflowStepProgressMini({
  steps,
  className,
}: Omit<WorkflowStepProgressProps, 'alwaysShowTooltip'>) {
  // Sort steps by order
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
  
  // Count steps by status
  const statusCounts = {
    completed: sortedSteps.filter(s => s.status === 'completed').length,
    running: sortedSteps.filter(s => s.status === 'running').length,
    failed: sortedSteps.filter(s => s.status === 'failed').length,
    pending: sortedSteps.filter(s => s.status === 'pending' || s.status === 'skipped').length,
  };
  
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="flex items-center">
        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
        <span className="text-xs">{statusCounts.completed}</span>
      </div>
      
      {statusCounts.running > 0 && (
        <div className="flex items-center">
          <RotateCw className="h-4 w-4 text-blue-500 mr-1 animate-spin" />
          <span className="text-xs">{statusCounts.running}</span>
        </div>
      )}
      
      {statusCounts.failed > 0 && (
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
          <span className="text-xs">{statusCounts.failed}</span>
        </div>
      )}
      
      {statusCounts.pending > 0 && (
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-muted-foreground mr-1" />
          <span className="text-xs">{statusCounts.pending}</span>
        </div>
      )}
      
      <div className="text-xs text-muted-foreground">
        {sortedSteps.length} steps
      </div>
    </div>
  );
}