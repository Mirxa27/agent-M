import { apiRequest, queryClient } from './queryClient';
import type { 
  WorkflowExecution, 
  WorkflowStepExecution,
  InsertWorkflowExecution,
  InsertWorkflowStepExecution
} from '@shared/schema';

/**
 * Client service for interacting with workflow progress API
 */
export const workflowProgressService = {
  /**
   * Start a new workflow execution
   * 
   * @param sequenceId The sequence ID to execute
   * @param browserSessionId Optional browser session ID to associate with this execution
   * @returns The created workflow execution
   */
  async startExecution(
    sequenceId: number, 
    browserSessionId?: string
  ): Promise<WorkflowExecution> {
    const data: Partial<InsertWorkflowExecution> = {
      sequenceId,
      status: 'pending',
      progress: 0,
    };
    
    if (browserSessionId) {
      data.browserSessionId = browserSessionId;
    }
    
    const res = await apiRequest('POST', '/api/workflow-progress/executions', data);
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }
    
    const execution = await res.json();
    
    // Invalidate queries that might include this execution
    queryClient.invalidateQueries({ queryKey: ['/api/workflow-progress/executions'] });
    queryClient.invalidateQueries({ 
      queryKey: [`/api/workflow-progress/sequences/${sequenceId}/executions`]
    });
    
    return execution;
  },
  
  /**
   * Get a specific execution
   * 
   * @param executionId The execution ID to retrieve
   * @returns The workflow execution
   */
  async getExecution(executionId: number): Promise<WorkflowExecution> {
    const res = await apiRequest('GET', `/api/workflow-progress/executions/${executionId}`);
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }
    
    return await res.json();
  },
  
  /**
   * Get steps for a workflow execution
   * 
   * @param executionId The execution ID
   * @returns List of workflow step executions
   */
  async getExecutionSteps(executionId: number): Promise<WorkflowStepExecution[]> {
    const res = await apiRequest('GET', `/api/workflow-progress/executions/${executionId}/steps`);
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }
    
    return await res.json();
  },
  
  /**
   * Update a step's status
   * 
   * @param executionId The execution ID
   * @param stepId The step ID to update
   * @param status New status: 'running', 'completed', or 'failed'
   * @param options Additional options
   * @returns Updated step execution
   */
  async updateStepStatus(
    executionId: number,
    stepId: number,
    status: 'running' | 'completed' | 'failed',
    options?: {
      result?: any;
      error?: string;
      screenshot?: string;
    }
  ): Promise<WorkflowStepExecution> {
    const data = {
      status,
      ...options
    };
    
    const res = await apiRequest(
      'PATCH', 
      `/api/workflow-progress/executions/${executionId}/steps/${stepId}`,
      data
    );
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }
    
    const updatedStep = await res.json();
    
    // Invalidate queries to reflect new step status
    queryClient.invalidateQueries({ 
      queryKey: [`/api/workflow-progress/executions/${executionId}`] 
    });
    queryClient.invalidateQueries({ 
      queryKey: [`/api/workflow-progress/executions/${executionId}/steps`] 
    });
    
    return updatedStep;
  },
  
  /**
   * Add a log entry to a step execution
   * 
   * @param executionId The execution ID
   * @param stepId The step ID to log for
   * @param message Log message
   * @param level Log level ('info', 'warn', 'error', etc.)
   * @returns Updated step execution
   */
  async addStepLog(
    executionId: number,
    stepId: number,
    message: string,
    level: 'info' | 'warn' | 'error' | 'debug' = 'info'
  ): Promise<WorkflowStepExecution> {
    const data = {
      message,
      level
    };
    
    const res = await apiRequest(
      'POST',
      `/api/workflow-progress/executions/${executionId}/steps/${stepId}/logs`,
      data
    );
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }
    
    return await res.json();
  },
  
  /**
   * Get user's recent workflow executions
   * 
   * @param limit Maximum number of executions to return
   * @returns List of workflow executions
   */
  async getUserExecutions(limit = 10): Promise<WorkflowExecution[]> {
    const res = await apiRequest('GET', `/api/workflow-progress/executions?limit=${limit}`);
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }
    
    return await res.json();
  },
  
  /**
   * Get executions for a specific sequence
   * 
   * @param sequenceId The sequence ID
   * @param limit Maximum number of executions to return
   * @returns List of workflow executions
   */
  async getSequenceExecutions(sequenceId: number, limit = 10): Promise<WorkflowExecution[]> {
    const res = await apiRequest(
      'GET', 
      `/api/workflow-progress/sequences/${sequenceId}/executions?limit=${limit}`
    );
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }
    
    return await res.json();
  }
};