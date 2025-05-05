// filepath: /workspaces/agent-M/server/agent-task-processor.ts
import { AgentTool, Task } from '@shared/schema'; // Import AgentTool type
import aiService from './services/ai-service';
import { AIMessage } from './services/openai-service';
import { IStorage } from './storage';

/**
 * Process an agent task based on task ID
 * This function:
 * 1. Retrieves the task from storage
 * 2. Gets the associated agent configuration
 * 3. Retrieves previous messages for context
 * 4. Processes the task using the appropriate AI service
 * 5. Updates the task status and results
 * 6. Stores the assistant's response as a message
 */
export async function processAgentTask(taskId: number, storage: IStorage): Promise<Task> {
    try {
        // Retrieve task details
        const task = await storage.getTask(taskId);

        if (!task) {
            throw new Error(`Task with ID ${taskId} not found`);
        }

        // Check if task is already completed or failed
        if (task.status === 'completed' || task.status === 'failed') {
            return task;
        }

        // Update task status to running
        await storage.updateTask(taskId, { status: 'running' });

        // Get agent information
        const agent = await storage.getAgent(task.agentId);

        if (!agent) {
            throw new Error(`Agent with ID ${task.agentId} not found`);
        }

        if (!agent.isActive) {
            throw new Error(`Agent with ID ${task.agentId} is not active`);
        }

        // Get agent tools if configured
        let agentTools: AgentTool[] = []; // Initialize with the correct type
        if (Array.isArray(agent.tools) && agent.tools.length > 0) {
            const toolPromises = agent.tools.map(async (toolId: number) => {
                return await storage.getAgentTool(toolId);
            });

            // Wait for all tool queries to complete and filter results
            // Explicitly type agentTools after filtering
            agentTools = (await Promise.all(toolPromises)).filter((tool): tool is AgentTool => tool !== null && tool !== undefined && tool.isActive) as AgentTool[];
            // Removed duplicate Promise.all call
        }

        // Retrieve previous messages for context
        const messages = await storage.getMessagesByTaskId(taskId);

        // Format messages for AI service
        // Note: Removed metadata access as it's not in the schema
        const aiMessages: AIMessage[] = messages.map(msg => ({
            // Cast role to the expected union type
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content
            // TODO: If tool call info needs to be preserved, it might need a different mechanism
            // or schema modification. For now, just passing role and content.
        }));

        // Determine AI provider and model from agent configuration using safer access
        const agentConfig = agent.config as any || {}; // Cast to any for dynamic access, fallback to {}
        const provider = agentConfig.provider ?? 'openai'; // Use nullish coalescing
        const model = agentConfig.model ?? 'gpt-4o'; // Use nullish coalescing

        // Create system instructions based on agent configuration
        let systemInstructions = `You are an AI assistant named ${agent.name}. ${agent.description || ''}`;

        // Add information about available tools if any
        if (agentTools.length > 0) {
            systemInstructions += `\n\nYou have the following tools available:\n`;
            agentTools.forEach(tool => {
                // Add check for tool existence to satisfy linter
                if (tool) {
                    systemInstructions += `- ${tool.name}: ${tool.description}\n`;
                }
            });
            systemInstructions += `\nWhen appropriate, use these tools to accomplish tasks. You can call multiple tools in sequence if needed.`;
        }

        // Add custom instructions if configured, using safer access
        if (agentConfig.instructions) {
            systemInstructions += `\n\n${agentConfig.instructions}`;
        }

        // Process task using AI service, passing the tools
        const agentResponse = await aiService.processTask(
            task,
            {
                provider: provider as any,
                model,
                systemInstructions
            },
            aiMessages // Removed the extra agentTools argument
        );

        // Store all messages from tool conversation if applicable
        if (agentResponse.metadata?.toolCalls && agentResponse.metadata.toolCalls.length > 0) {
            console.log("Tool calls were made during task processing, storing conversation history");

            const toolResults = agentResponse.metadata.toolResults || [];

            // Store the assistant message with tool calls, including tool call info in metadata
            const firstToolCall = agentResponse.metadata.toolCalls[0];
            await storage.createMessage({
                taskId,
                role: 'assistant',
                content: firstToolCall.function ?
                    `I'm using the ${firstToolCall.function.name} tool to help answer your question. Tool calls: ${JSON.stringify(agentResponse.metadata.toolCalls)}` :
                    `I'm using a tool to help answer your question. Tool calls: ${JSON.stringify(agentResponse.metadata.toolCalls)}`,
                timestamp: new Date(),
                metadata: { toolCalls: agentResponse.metadata.toolCalls }
            });

            // Store each tool result as a tool message, including tool call info in metadata
            for (const toolResult of toolResults) {
                await storage.createMessage({
                    taskId,
                    role: 'tool',
                    content: `Tool Call ID: ${toolResult.toolCall.id}\nTool Name: ${toolResult.toolCall.function.name}\nResult: ${JSON.stringify(toolResult.result)}`,
                    timestamp: new Date(),
                    metadata: { toolCall: toolResult.toolCall, result: toolResult.result }
                });
            }
        }

        // Store the final assistant response, include any metadata if present
        await storage.createMessage({
            taskId,
            role: 'assistant',
            content: agentResponse.content,
            timestamp: new Date(),
            metadata: agentResponse.metadata ? agentResponse.metadata : {}
        });

        // Update task status and result
        const updatedTask = await storage.updateTask(taskId, {
            status: 'completed',
            result: JSON.stringify({
                content: agentResponse.content,
                metadata: agentResponse.metadata || {},
                completedAt: new Date().toISOString(),
                toolsUsed: agentResponse.metadata?.toolCalls ?
                    agentResponse.metadata.toolCalls.map(tc => tc.function?.name).filter(Boolean) :
                    []
            }),
            completedAt: new Date()
        });

        // Log task completion in user activity
        // Add check for updatedTask before accessing properties
        if (updatedTask) {
            await storage.createUserActivity({
                userId: updatedTask.userId, // Use updatedTask.userId
                activityType: 'task_completed',
                resourceId: taskId,
                resourceType: 'task',
                metadata: {
                    taskTitle: updatedTask.title, // Use updatedTask.title
                    agentName: agent.name,
                    toolsUsed: agentResponse.metadata?.toolCalls ?
                        agentResponse.metadata.toolCalls.map(tc => tc.function?.name).filter(Boolean) :
                        []
                }
            });
        } else {
            console.warn(`Task ${taskId} could not be updated or retrieved after completion.`);
        }
        // Removed stray resourceType: 'task', line

        // Increment agent task count
        await storage.updateAgent(agent.id, {
            taskCount: (agent.taskCount || 0) + 1
        });

        // Ensure a Task object is returned even if updatedTask is undefined
        if (!updatedTask) {
            console.error(`Failed to update task ${taskId} after completion, returning original task state.`);
            // Re-fetch the original task to return the latest state before the failed update
            const originalTask = await storage.getTask(taskId);
            if (!originalTask) {
                // This should ideally not happen if the task existed initially
                throw new Error(`Task ${taskId} disappeared during processing.`);
            }
            return originalTask;
        }
        return updatedTask;

    } catch (error) {
        console.error(`Error processing agent task ${taskId}:`, error);

        // Update task as failed
        const updatedTask = await storage.updateTask(taskId, {
            status: 'failed',
            result: JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                timestamp: new Date().toISOString()
            }),
            completedAt: new Date()
        });

        // Store error message
        await storage.createMessage({
            taskId,
            role: 'system',
            content: `Task processing failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
            timestamp: new Date(),
            metadata: { error: error instanceof Error ? error.message : 'Unknown error occurred' }
        });

        // Log task failure in user activity
        // Add check for updatedTask before accessing properties
        if (updatedTask) {
            await storage.createUserActivity({
                userId: updatedTask.userId,
                activityType: 'task_failed',
                resourceId: taskId,
                resourceType: 'task',
                metadata: {
                    taskTitle: updatedTask.title,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        } else {
            console.warn(`Task ${taskId} could not be updated or retrieved after failure.`);
        }

        // Ensure a Task object is returned even if updatedTask is undefined
        if (!updatedTask) {
            console.error(`Failed to update task ${taskId} after failure, returning original task state.`);
            // Re-fetch the original task to return the latest state before the failed update
            const originalTask = await storage.getTask(taskId);
            if (!originalTask) {
                // This should ideally not happen if the task existed initially
                throw new Error(`Task ${taskId} disappeared during error handling.`);
            }
            // Update the original task object with failure status for return consistency
            originalTask.status = 'failed';
            originalTask.result = JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
            return originalTask;
        }
        return updatedTask;
    }
}
