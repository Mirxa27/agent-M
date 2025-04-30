import OpenAI from 'openai';
import { AIMessage, AIProvider, AgentConfig, AgentResponse, AgentTask } from '../../shared/types';

// Initialize OpenRouter client with API key
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://agentapi.repl.co', // Your app's domain
    'X-Title': 'Agent API Platform', // Your app's name
  }
});

// Model capabilities table for reference
export const openRouterModels = [
  // Anthropic models
  { id: 'anthropic/claude-3-opus', provider: 'anthropic', capabilities: ['chat', 'reasoning'] },
  { id: 'anthropic/claude-3-sonnet', provider: 'anthropic', capabilities: ['chat', 'reasoning'] },
  { id: 'anthropic/claude-3-haiku', provider: 'anthropic', capabilities: ['chat', 'fast'] },
  
  // OpenAI models
  { id: 'openai/gpt-4o', provider: 'openai', capabilities: ['chat', 'reasoning', 'advanced'] },
  { id: 'openai/gpt-4-turbo', provider: 'openai', capabilities: ['chat', 'reasoning'] },
  { id: 'openai/gpt-3.5-turbo', provider: 'openai', capabilities: ['chat', 'fast'] },
  
  // Mistral models
  { id: 'mistralai/mistral-large', provider: 'mistral', capabilities: ['chat', 'reasoning'] },
  { id: 'mistralai/mistral-medium', provider: 'mistral', capabilities: ['chat'] },
  { id: 'mistralai/mistral-small', provider: 'mistral', capabilities: ['chat', 'fast'] },
  
  // Meta models
  { id: 'meta-llama/llama-3-70b-instruct', provider: 'meta', capabilities: ['chat', 'reasoning'] },
  { id: 'meta-llama/llama-3-8b-instruct', provider: 'meta', capabilities: ['chat', 'fast'] },
  
  // Google models
  { id: 'google/gemini-pro', provider: 'google', capabilities: ['chat', 'reasoning'] },
  { id: 'google/gemini-flash', provider: 'google', capabilities: ['chat', 'fast'] },
];

// Check if OpenRouter is properly configured
export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

// Process an agent task using OpenRouter
export async function processAgentTask(
  task: AgentTask,
  config: AgentConfig,
  previousMessages: AIMessage[] = []
): Promise<AgentResponse> {
  try {
    // Use the model specified in the config, or fall back to a default
    const model = config?.model || 'openai/gpt-4o';

    // Create message history from previous messages
    const messageHistory = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add system instructions if needed
    if (config?.systemPrompt && messageHistory.length === 0) {
      messageHistory.unshift({
        role: 'system',
        content: config.systemPrompt,
      });
    }

    // Add the current task/user message
    messageHistory.push({
      role: 'user',
      content: task.content,
    });

    // Call OpenRouter API
    const response = await openai.chat.completions.create({
      model,
      messages: messageHistory,
      temperature: config?.temperature ?? 0.7,
      max_tokens: config?.maxTokens ?? 1024,
    });

    // Format the response
    return {
      content: response.choices[0].message.content || 'No response generated',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      model: model,
      provider: 'openrouter',
    };
  } catch (error) {
    console.error('Error processing task with OpenRouter:', error);
    return {
      content: `Error: Failed to process task with OpenRouter. ${error instanceof Error ? error.message : 'Unknown error'}`,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      model: config?.model || 'openai/gpt-4o',
      provider: 'openrouter',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Generate an image using OpenRouter
export async function generateImage(
  prompt: string,
  size: '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024'
): Promise<string> {
  try {
    const response = await openai.images.generate({
      model: 'openai/dall-e-3',
      prompt,
      size,
      n: 1,
    });

    return response.data[0]?.url || '';
  } catch (error) {
    console.error('Error generating image with OpenRouter:', error);
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Analyze image using OpenRouter (vision model required)
export async function analyzeImage(
  imageUrl: string, 
  prompt: string,
  provider: AIProvider,
  model?: string
): Promise<string> {
  try {
    // Default to gpt-4-vision if no model specified
    const selectedModel = model || 'openai/gpt-4-vision';
    
    const response = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 1024,
    });

    return response.choices[0].message.content || 'No analysis generated';
  } catch (error) {
    console.error('Error analyzing image with OpenRouter:', error);
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get available models from OpenRouter
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://agentapi.repl.co',
        'X-Title': 'Agent API Platform',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.map((model: any) => model.id);
  } catch (error) {
    console.error('Error fetching models from OpenRouter:', error);
    return openRouterModels.map(model => model.id); // Fall back to static list
  }
}

export default {
  processAgentTask,
  generateImage,
  analyzeImage,
  getAvailableModels,
  isOpenRouterConfigured,
  openRouterModels,
};