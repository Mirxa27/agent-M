import { apiRequest } from '@/lib/queryClient';
import type { WorkflowExecution, WorkflowStepExecution } from '@shared/schema';

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
    const response = await apiRequest('POST', '/api/workflow-progress/executions', {
      sequenceId,
      browserSessionId
    });

    return await response.json();
  },

  /**
   * Get a specific execution
   * 
   * @param executionId The execution ID to retrieve
   * @returns The workflow execution
   */
  async getExecution(executionId: number): Promise<WorkflowExecution> {
    const response = await apiRequest('GET', `/api/workflow-progress/executions/${executionId}`);
    return await response.json();
  },

  /**
   * Get steps for a workflow execution
   * 
   * @param executionId The execution ID
   * @returns List of workflow step executions
   */
  async getExecutionSteps(executionId: number): Promise<WorkflowStepExecution[]> {
    const response = await apiRequest('GET', `/api/workflow-progress/executions/${executionId}/steps`);
    return await response.json();
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
    status: string,
    options: {
      error?: string;
      screenshot?: string;
      startedAt?: Date;
      completedAt?: Date;
      duration?: number;
    } = {}
  ): Promise<WorkflowStepExecution> {
    const response = await apiRequest('PATCH', `/api/workflow-progress/executions/${executionId}/steps/${stepId}`, {
      status,
      ...options
    });

    return await response.json();
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
    level: string = 'info'
  ): Promise<WorkflowStepExecution> {
    const response = await apiRequest('POST', `/api/workflow-progress/executions/${executionId}/steps/${stepId}/logs`, {
      message,
      level
    });

    return await response.json();
  },

  /**
   * Get user's recent workflow executions
   * 
   * @param limit Maximum number of executions to return
   * @returns List of workflow executions
   */
  async getUserExecutions(limit = 10): Promise<WorkflowExecution[]> {
    const response = await apiRequest('GET', `/api/workflow-progress/executions?limit=${limit}`);
    return await response.json();
  },

  /**
   * Get executions for a specific sequence
   * 
   * @param sequenceId The sequence ID
   * @param limit Maximum number of executions to return
   * @returns List of workflow executions
   */
  async getSequenceExecutions(sequenceId: number, limit = 10): Promise<WorkflowExecution[]> {
    const response = await apiRequest('GET', `/api/workflow-progress/executions?sequenceId=${sequenceId}&limit=${limit}`);
    return await response.json();
  },

  /**
   * Cancel a running workflow execution
   * 
   * @param executionId The execution ID to cancel
   * @returns The cancelled workflow execution
   */
  async cancelExecution(executionId: number): Promise<WorkflowExecution> {
    const response = await apiRequest('POST', `/api/workflow-progress/executions/${executionId}/cancel`);
    return await response.json();
  }
};