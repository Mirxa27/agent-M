import { AgentTool, Task } from "@shared/schema";
import OpenAI from "openai";
import { agentToolsService } from "./agent-tools-service";

// Create OpenAI client
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export interface AgentResponse {
  content: string;
  rawResponse?: any;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  metadata?: {
    toolCalls?: any[];
    toolResults?: any[];
  };
}

// Tool definition format for OpenAI
export interface ToolDefinition {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

/**
 * Convert AgentTool to OpenAI function format
 */
function convertToolToFunction(tool: AgentTool): any {
  // Start with basic properties that all tools have
  const functionDef = {
    name: tool.name.replace(/\s+/g, '_').toLowerCase(),
    description: tool.description || `Use the ${tool.name} tool`,
    parameters: {
      type: "object",
      properties: {},
      required: [] as string[],
    } as any,
  };

  // Add input schema based on tool type
  switch (tool.type) {
    case 'database':
      functionDef.parameters.properties = {
        operation: {
          type: "string",
          enum: ["query", "select", "insert", "update", "delete"],
          description: "The database operation to perform"
        },
        query: {
          type: "string",
          description: "The SQL query to execute (for 'query' operation)"
        },
        tableName: {
          type: "string",
          description: "The name of the table to operate on"
        },
        columns: {
          type: "array",
          items: { type: "string" },
          description: "Columns to select (for 'select' operation)"
        },
        conditions: {
          type: "object",
          description: "Key-value pairs representing WHERE conditions"
        },
        values: {
          type: "object",
          description: "Key-value pairs of data to insert or update"
        }
      };
      functionDef.parameters.required = ["operation"];
      break;

    case 'file_system':
      functionDef.parameters.properties = {
        operation: {
          type: "string",
          enum: ["read", "write", "append", "delete", "list", "exists", "mkdir", "rmdir", "move", "copy"],
          description: "The file system operation to perform"
        },
        path: {
          type: "string",
          description: "File or directory path relative to the sandbox directory"
        },
        content: {
          type: "string",
          description: "Content to write or append to a file"
        },
        source: {
          type: "string",
          description: "Source path for move/copy operations"
        },
        destination: {
          type: "string",
          description: "Destination path for move/copy operations"
        },
        recursive: {
          type: "boolean",
          description: "Whether to perform operation recursively (for rmdir)"
        }
      };
      functionDef.parameters.required = ["operation"];
      break;

    case 'email':
      functionDef.parameters.properties = {
        to: {
          type: "string",
          description: "Recipient email address"
        },
        subject: {
          type: "string",
          description: "Email subject line"
        },
        body: {
          type: "string",
          description: "Email body content"
        }
      };
      functionDef.parameters.required = ["to", "subject", "body"];
      break;

    case 'sms':
      functionDef.parameters.properties = {
        to: {
          type: "string",
          description: "Recipient phone number"
        },
        message: {
          type: "string",
          description: "SMS message content"
        }
      };
      functionDef.parameters.required = ["to", "message"];
      break;

    case 'search':
      functionDef.parameters.properties = {
        query: {
          type: "string",
          description: "Search query string"
        }
      };
      functionDef.parameters.required = ["query"];
      break;

    default:
      // For custom tools, use generic input parameter
      functionDef.parameters.properties = {
        input: {
          type: "string",
          description: "Input for the tool"
        }
      };
      functionDef.parameters.required = ["input"];
      break;
  }

  return functionDef;
}

/**
 * Process a task using OpenAI with tool calling support
 */
export async function processWithOpenAI(
  task: Task,
  config: {
    provider: string;
    model: string;
    systemInstructions?: string;
  },
  previousMessages: AIMessage[] = [],
  tools: AgentTool[] = []
): Promise<AgentResponse> {
  try {
    // Use specified model or default to gpt-4o
    const model = config.model || "gpt-4o";

    // Build the message array
    const messages: AIMessage[] = [];

    // Add system instructions if provided
    if (config.systemInstructions) {
      messages.push({
        role: "system",
        content: config.systemInstructions,
      });
    }

    // Add previous conversation history if any
    if (previousMessages.length > 0) {
      messages.push(...previousMessages);
    }

    // Add the current task as the user message if it's not already in previous messages
    const userMessageExists = previousMessages.some(
      (msg) => msg.role === "user" && (msg.content === (task.description || task.title))
    );

    if (!userMessageExists) {
      messages.push({
        role: "user",
        content: task.description || task.title,
      });
    }

    // Convert tools to OpenAI function format if any tools are provided
    const openaiTools = tools.length > 0
      ? tools.map(tool => ({
        type: "function" as const,
        function: convertToolToFunction(tool)
      }))
      : undefined;

    // Initialize metadata to collect tool calls and results
    const metadata: any = {
      toolCalls: [],
      toolResults: []
    };

    // Maximum number of tool calling iterations to prevent infinite loops
    const MAX_TOOL_ITERATIONS = 10;
    let iterations = 0;

    // Start with the original messages
    let currentMessages = [...messages];
    let finalContent = "";
    let finalResponse: any = null;

    // Continue conversation until the model provides a final answer or max iterations reached
    while (iterations < MAX_TOOL_ITERATIONS) {
      // Make the API call
      console.log(`Making OpenAI API call (iteration ${iterations + 1})...`);

      const response = await openai.chat.completions.create({
        model: model,
        messages: currentMessages as any,
        temperature: 0.7,
        max_tokens: 4096,
        tools: openaiTools,
        tool_choice: openaiTools && openaiTools.length > 0 ? "auto" : "none",
      });

      // Store the response for returning later
      finalResponse = response;

      const responseMessage = response.choices[0].message;

      // Check if the model wants to use tools
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        // Add the assistant's response with tool calls to the conversation
        currentMessages.push({
          role: "assistant",
          content: responseMessage.content || "",
          tool_calls: responseMessage.tool_calls
        });

        // Store tool calls in metadata
        metadata.toolCalls.push(...responseMessage.tool_calls);

        // Process each tool call
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          let functionArgs;

          try {
            functionArgs = JSON.parse(toolCall.function.arguments);
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`Error parsing function arguments: ${msg}`);
            functionArgs = { error: "Failed to parse arguments" };
          }

          console.log(`Tool call: ${functionName}, Arguments:`, functionArgs);

          // Find the corresponding tool
          const tool = tools.find(t => t.name.replace(/\s+/g, '_').toLowerCase() === functionName);

          let toolResult;
          if (tool) {
            // Execute the tool using the tool's ID
            try {
              toolResult = await agentToolsService.executeTool(tool.id, functionArgs);
              console.log(`Tool execution result:`, toolResult);
            } catch (error) {
              const msg = error instanceof Error ? error.message : String(error);
              console.error(`Error executing tool ${functionName}: ${msg}`);
              toolResult = {
                success: false,
                error: `Tool execution error: ${msg}`
              };
            }
          } else {
            toolResult = {
              success: false,
              error: `Tool '${functionName}' not found`
            };
          }

          // Store tool result in metadata
          metadata.toolResults.push({
            toolCall: toolCall,
            result: toolResult
          });

          // Add the tool result to messages
          currentMessages.push({
            role: "assistant", // OpenAI expects only 'assistant', 'user', or 'system'
            content: JSON.stringify({ tool_call_id: toolCall.id, name: functionName, result: toolResult })
          });
        }

        // Continue to the next iteration
        iterations++;
        continue;
      }

      // If no tool calls, we have our final answer
      finalContent = responseMessage.content || "";
      break;
    }

    // If we reached max iterations without a final answer, use the last response
    if (iterations >= MAX_TOOL_ITERATIONS) {
      console.warn(`Reached maximum tool iterations (${MAX_TOOL_ITERATIONS}). Returning last response.`);
    }

    return {
      content: finalContent,
      rawResponse: finalResponse,
      metadata,
      usage: {
        promptTokens: finalResponse.usage?.prompt_tokens,
        completionTokens: finalResponse.usage?.completion_tokens,
        totalTokens: finalResponse.usage?.total_tokens,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error processing task with OpenAI:", msg);
    throw new Error(`OpenAI API error: ${msg}`);
  }
}

/**
 * Generate an image using DALL-E 3
 */
export async function generateImageWithOpenAI(
  prompt: string,
  size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024",
  quality: "standard" | "hd" = "standard"
): Promise<string> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      quality,
    });

    return response.data?.[0]?.url || "";
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error generating image with OpenAI:", msg);
    throw new Error(`OpenAI image generation error: ${msg}`);
  }
}

/**
 * Analyze an image using Vision API
 */
export async function analyzeImageWithOpenAI(
  imageUrl: string,
  prompt: string,
  model: string = "gpt-4o"
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ],
        },
      ],
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error analyzing image with OpenAI:", msg);
    throw new Error(`OpenAI vision API error: ${msg}`);
  }
}

export default {
  processTask: processWithOpenAI,
  generateImage: generateImageWithOpenAI,
  analyzeImage: analyzeImageWithOpenAI,
};
