import { db } from "../db";
import { 
  workflowExecutions, 
  workflowStepExecutions, 
  browserSequenceSteps,
  InsertWorkflowExecution, 
  InsertWorkflowStepExecution,
  WorkflowExecution,
  WorkflowStepExecution
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Workflow Progress Service
 * 
 * Handles tracking and visualization of workflow execution progress
 */
class WorkflowProgressService {
  
  /**
   * Start a new workflow execution
   * 
   * @param executionData The execution data to create
   * @returns The created workflow execution
   */
  async startExecution(executionData: InsertWorkflowExecution): Promise<WorkflowExecution> {
    const [execution] = await db
      .insert(workflowExecutions)
      .values(executionData)
      .returning();
    
    // Get all steps for this sequence to create step executions
    const steps = await db
      .select()
      .from(browserSequenceSteps)
      .where(eq(browserSequenceSteps.sequenceId, executionData.sequenceId))
      .orderBy(browserSequenceSteps.stepOrder);
    
    // Create a step execution record for each step
    if (steps.length > 0) {
      const stepExecutions: InsertWorkflowStepExecution[] = steps.map((step, index) => ({
        executionId: execution.id,
        stepId: step.id,
        status: index === 0 ? "pending" : "pending",
        order: step.stepOrder,
        retries: 0,
        logs: [],
      }));
      
      await db
        .insert(workflowStepExecutions)
        .values(stepExecutions);
    }
    
    return execution;
  }
  
  /**
   * Update an execution's overall progress
   * 
   * @param executionId Execution ID to update
   * @param status New status
   * @param progress Progress percentage (0-100)
   * @param currentStepId Current step being executed
   * @param error Optional error message if failed
   * @returns Updated execution
   */
  async updateExecutionProgress(
    executionId: number,
    status: string,
    progress: number,
    currentStepId?: number,
    error?: string
  ): Promise<WorkflowExecution> {
    const updates: Partial<WorkflowExecution> = {
      status,
      progress,
      currentStepId,
    };
    
    if (status === "completed") {
      updates.completedAt = new Date();
    } else if (status === "failed" && error) {
      updates.error = error;
    }
    
    const [updatedExecution] = await db
      .update(workflowExecutions)
      .set(updates)
      .where(eq(workflowExecutions.id, executionId))
      .returning();
    
    return updatedExecution;
  }
  
  /**
   * Start a specific step execution
   * 
   * @param executionId Workflow execution ID
   * @param stepId Step ID to start
   * @returns Updated step execution
   */
  async startStepExecution(executionId: number, stepId: number): Promise<WorkflowStepExecution> {
    const [updatedStep] = await db
      .update(workflowStepExecutions)
      .set({
        status: "running",
        startedAt: new Date(),
      })
      .where(
        and(
          eq(workflowStepExecutions.executionId, executionId),
          eq(workflowStepExecutions.stepId, stepId)
        )
      )
      .returning();
    
    // Update the execution's current step
    const progress = await this.calculateProgress(executionId);
    await this.updateExecutionProgress(
      executionId,
      "running",
      progress,
      stepId
    );
    
    return updatedStep;
  }
  
  /**
   * Complete a step execution
   * 
   * @param executionId Workflow execution ID
   * @param stepId Step ID to complete
   * @param result Optional result data
   * @param screenshot Optional screenshot path
   * @returns Updated step execution
   */
  async completeStepExecution(
    executionId: number, 
    stepId: number,
    result?: any,
    screenshot?: string
  ): Promise<WorkflowStepExecution> {
    const now = new Date();
    const stepExecution = await this.getStepExecution(executionId, stepId);
    
    if (!stepExecution) {
      throw new Error(`Step execution not found: ${executionId}/${stepId}`);
    }
    
    const startTime = stepExecution.startedAt 
      ? new Date(stepExecution.startedAt).getTime() 
      : now.getTime();
    
    const duration = now.getTime() - startTime;
    
    const [updatedStep] = await db
      .update(workflowStepExecutions)
      .set({
        status: "completed",
        completedAt: now,
        duration,
        result: result || null,
        screenshot: screenshot || null,
      })
      .where(
        and(
          eq(workflowStepExecutions.executionId, executionId),
          eq(workflowStepExecutions.stepId, stepId)
        )
      )
      .returning();
    
    // Get all steps to check if execution is complete
    const allSteps = await this.getStepExecutions(executionId);
    
    const isComplete = allSteps.every(step => step.status === "completed" || step.status === "skipped");
    const progress = this.calculateProgress(executionId);
    
    // If all steps are done, complete the execution
    if (isComplete) {
      await this.updateExecutionProgress(executionId, "completed", 100);
    } else {
      // Otherwise, find the next step
      const nextStep = allSteps.find(step => 
        step.status === "pending" && step.order > updatedStep.order
      );
      
      if (nextStep) {
        await this.updateExecutionProgress(
          executionId,
          "running",
          progress,
          nextStep.stepId
        );
      }
    }
    
    return updatedStep;
  }
  
  /**
   * Mark a step execution as failed
   * 
   * @param executionId Workflow execution ID
   * @param stepId Step ID that failed
   * @param error Error message
   * @param screenshot Optional screenshot of failure
   * @returns Updated step execution
   */
  async failStepExecution(
    executionId: number,
    stepId: number,
    error: string,
    screenshot?: string
  ): Promise<WorkflowStepExecution> {
    const stepExecution = await this.getStepExecution(executionId, stepId);
    
    if (!stepExecution) {
      throw new Error(`Step execution not found: ${executionId}/${stepId}`);
    }
    
    // Increment retry count
    const retries = (stepExecution.retries || 0) + 1;
    
    const now = new Date();
    const startTime = stepExecution.startedAt 
      ? new Date(stepExecution.startedAt).getTime() 
      : now.getTime();
    
    const duration = now.getTime() - startTime;
    
    const [updatedStep] = await db
      .update(workflowStepExecutions)
      .set({
        status: "failed",
        completedAt: now,
        duration,
        retries,
        error,
        screenshot: screenshot || null,
      })
      .where(
        and(
          eq(workflowStepExecutions.executionId, executionId),
          eq(workflowStepExecutions.stepId, stepId)
        )
      )
      .returning();
    
    // Mark the execution as failed
    await this.updateExecutionProgress(
      executionId,
      "failed",
      this.calculateProgress(executionId),
      stepId,
      error
    );
    
    return updatedStep;
  }
  
  /**
   * Add a log entry to a step execution
   * 
   * @param executionId Workflow execution ID
   * @param stepId Step ID to log for
   * @param logEntry Log entry to add
   * @returns Updated step execution
   */
  async addStepLog(
    executionId: number,
    stepId: number,
    logEntry: { message: string; level?: string; timestamp?: string }
  ): Promise<WorkflowStepExecution> {
    const step = await this.getStepExecution(executionId, stepId);
    
    if (!step) {
      throw new Error(`Step execution not found: ${executionId}/${stepId}`);
    }
    
    const logs = Array.isArray(step.logs) ? step.logs : [];
    
    // Add timestamp if not provided
    if (!logEntry.timestamp) {
      logEntry.timestamp = new Date().toISOString();
    }
    
    // Set default level
    if (!logEntry.level) {
      logEntry.level = "info";
    }
    
    const [updatedStep] = await db
      .update(workflowStepExecutions)
      .set({
        logs: [...logs, logEntry],
      })
      .where(
        and(
          eq(workflowStepExecutions.executionId, executionId),
          eq(workflowStepExecutions.stepId, stepId)
        )
      )
      .returning();
    
    return updatedStep;
  }
  
  /**
   * Get a specific workflow execution
   * 
   * @param id Execution ID
   * @returns The workflow execution or null if not found
   */
  async getExecution(id: number): Promise<WorkflowExecution | null> {
    const [execution] = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.id, id));
    
    return execution || null;
  }
  
  /**
   * Get executions for a specific user
   * 
   * @param userId User ID
   * @param limit Maximum number of executions to return
   * @returns List of workflow executions
   */
  async getUserExecutions(userId: number, limit = 10): Promise<WorkflowExecution[]> {
    return await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.userId, userId))
      .orderBy(desc(workflowExecutions.startedAt))
      .limit(limit);
  }
  
  /**
   * Get executions for a specific sequence
   * 
   * @param sequenceId Sequence ID
   * @param limit Maximum number of executions to return
   * @returns List of workflow executions
   */
  async getSequenceExecutions(sequenceId: number, limit = 10): Promise<WorkflowExecution[]> {
    return await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.sequenceId, sequenceId))
      .orderBy(desc(workflowExecutions.startedAt))
      .limit(limit);
  }
  
  /**
   * Get all step executions for a workflow execution
   * 
   * @param executionId Workflow execution ID
   * @returns List of step executions ordered by step order
   */
  async getStepExecutions(executionId: number): Promise<WorkflowStepExecution[]> {
    return await db
      .select()
      .from(workflowStepExecutions)
      .where(eq(workflowStepExecutions.executionId, executionId))
      .orderBy(workflowStepExecutions.order);
  }
  
  /**
   * Get a specific step execution
   * 
   * @param executionId Workflow execution ID
   * @param stepId Step ID
   * @returns The step execution or null if not found
   */
  async getStepExecution(executionId: number, stepId: number): Promise<WorkflowStepExecution | null> {
    const [stepExecution] = await db
      .select()
      .from(workflowStepExecutions)
      .where(
        and(
          eq(workflowStepExecutions.executionId, executionId),
          eq(workflowStepExecutions.stepId, stepId)
        )
      );
    
    return stepExecution || null;
  }
  
  /**
   * Calculate the overall progress percentage for a workflow execution
   * 
   * @param executionId Workflow execution ID
   * @returns Progress percentage (0-100)
   */
  async calculateProgress(executionId: number): Promise<number> {
    const steps = await this.getStepExecutions(executionId);
    
    if (!steps.length) {
      return 0;
    }
    
    const completedSteps = steps.filter(
      step => step.status === "completed" || step.status === "skipped"
    ).length;
    
    return Math.round((completedSteps / steps.length) * 100);
  }
}

export const workflowProgressService = new WorkflowProgressService();