import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { db } from '../../db';
import { aiModels, aiProviders } from '../../../shared/schema';

// Mock the database
jest.mock('../../db');

// Mock AI provider clients
jest.mock('@anthropic-ai/sdk');
jest.mock('openai');

describe('AIService', () => {
  let aiService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the module to get a fresh instance
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Model Selection', () => {
    it('should select the default model when no preference is given', async () => {
      const mockModels = [
        { id: 1, modelId: 'gpt-4', isDefault: true, isActive: true },
        { id: 2, modelId: 'claude-3', isDefault: false, isActive: true },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            execute: jest.fn().mockResolvedValue(mockModels),
          }),
        }),
      });

      const AIService = (await import('../ai-service')).AIService;
      aiService = new AIService();
      
      const model = await aiService.getDefaultModel();
      expect(model.modelId).toBe('gpt-4');
    });

    it('should fallback to alternative provider on primary failure', async () => {
      const mockProviders = [
        { id: 1, provider: 'openai', isActive: true },
        { id: 2, provider: 'anthropic', isActive: true },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            execute: jest.fn().mockResolvedValue(mockProviders),
          }),
        }),
      });

      const AIService = (await import('../ai-service')).AIService;
      aiService = new AIService();

      // Mock first provider to fail
      jest.spyOn(aiService, 'callOpenAI').mockRejectedValue(new Error('OpenAI error'));
      jest.spyOn(aiService, 'callAnthropic').mockResolvedValue({
        content: 'Response from Anthropic',
      });

      const response = await aiService.generateResponse({
        prompt: 'Test prompt',
        provider: 'auto',
      });

      expect(response.content).toBe('Response from Anthropic');
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits per user', async () => {
      const AIService = (await import('../ai-service')).AIService;
      aiService = new AIService();

      const userId = 1;
      const requests = [];

      // Simulate multiple rapid requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          aiService.checkRateLimit(userId)
        );
      }

      const results = await Promise.all(requests);
      const allowedCount = results.filter(r => r === true).length;
      
      // Should enforce rate limiting
      expect(allowedCount).toBeLessThan(10);
    });
  });

  describe('Token Counting', () => {
    it('should accurately count tokens for OpenAI models', () => {
      const AIService = (await import('../ai-service')).AIService;
      aiService = new AIService();

      const text = 'This is a test message for token counting.';
      const tokenCount = aiService.countTokens(text, 'gpt-4');
      
      // Approximate token count (actual may vary slightly)
      expect(tokenCount).toBeGreaterThan(5);
      expect(tokenCount).toBeLessThan(15);
    });

    it('should handle large texts without overflow', () => {
      const AIService = (await import('../ai-service')).AIService;
      aiService = new AIService();

      const largeText = 'Lorem ipsum '.repeat(10000);
      const tokenCount = aiService.countTokens(largeText, 'gpt-4');
      
      expect(tokenCount).toBeGreaterThan(10000);
      expect(tokenCount).toBeLessThan(50000);
    });
  });

  describe('Error Handling', () => {
    it('should handle provider authentication errors gracefully', async () => {
      const AIService = (await import('../ai-service')).AIService;
      aiService = new AIService();

      jest.spyOn(aiService, 'callOpenAI').mockRejectedValue(
        new Error('Invalid API key')
      );

      await expect(
        aiService.generateResponse({
          prompt: 'Test',
          provider: 'openai',
        })
      ).rejects.toThrow('Authentication failed');
    });

    it('should handle network timeouts', async () => {
      const AIService = (await import('../ai-service')).AIService;
      aiService = new AIService();

      jest.spyOn(aiService, 'callOpenAI').mockImplementation(
        () => new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        })
      );

      await expect(
        aiService.generateResponse({
          prompt: 'Test',
          provider: 'openai',
          timeout: 50,
        })
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Response Streaming', () => {
    it('should support streaming responses', async () => {
      const AIService = (await import('../ai-service')).AIService;
      aiService = new AIService();

      const chunks: string[] = [];
      const mockStream = {
        on: (event: string, callback: Function) => {
          if (event === 'data') {
            callback('Hello ');
            callback('World!');
          }
          if (event === 'end') {
            callback();
          }
        },
      };

      jest.spyOn(aiService, 'streamResponse').mockReturnValue(mockStream);

      await new Promise((resolve) => {
        aiService.streamResponse({
          prompt: 'Test',
          onChunk: (chunk: string) => chunks.push(chunk),
          onComplete: resolve,
        });
      });

      expect(chunks).toEqual(['Hello ', 'World!']);
    });
  });

  describe('Context Management', () => {
    it('should maintain conversation context', async () => {
      const AIService = (await import('../ai-service')).AIService;
      aiService = new AIService();

      const context = aiService.createContext();
      
      context.addMessage('user', 'Hello');
      context.addMessage('assistant', 'Hi there!');
      context.addMessage('user', 'How are you?');

      const messages = context.getMessages();
      expect(messages).toHaveLength(3);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
    });

    it('should truncate context when exceeding token limit', async () => {
      const AIService = (await import('../ai-service')).AIService;
      aiService = new AIService();

      const context = aiService.createContext({ maxTokens: 100 });
      
      // Add many messages
      for (let i = 0; i < 100; i++) {
        context.addMessage('user', `Message ${i}: This is a long message that contains many tokens.`);
      }

      const messages = context.getMessages();
      const totalTokens = aiService.countContextTokens(messages);
      
      expect(totalTokens).toBeLessThanOrEqual(100);
    });
  });

  describe('Prompt Templates', () => {
    it('should apply prompt templates correctly', async () => {
      const mockPrompt = {
        systemPrompt: 'You are a helpful assistant.',
        temperature: 0.7,
        topP: 0.9,
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            execute: jest.fn().mockResolvedValue([mockPrompt]),
          }),
        }),
      });

      const AIService = (await import('../ai-service')).AIService;
      aiService = new AIService();

      const config = await aiService.getPromptConfig('email_writing');
      
      expect(config.systemPrompt).toBe('You are a helpful assistant.');
      expect(config.temperature).toBe(0.7);
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate costs accurately for different models', () => {
      const AIService = (await import('../ai-service')).AIService;
      aiService = new AIService();

      const cost = aiService.calculateCost({
        model: 'gpt-4',
        inputTokens: 1000,
        outputTokens: 500,
      });

      // GPT-4 pricing (example rates)
      const expectedCost = (1000 * 0.03 + 500 * 0.06) / 1000;
      expect(cost).toBeCloseTo(expectedCost, 4);
    });
  });

  describe('Caching', () => {
    it('should cache repeated requests', async () => {
      const AIService = (await import('../ai-service')).AIService;
      aiService = new AIService();

      const mockResponse = { content: 'Cached response' };
      jest.spyOn(aiService, 'callOpenAI').mockResolvedValue(mockResponse);

      // First call
      const response1 = await aiService.generateResponse({
        prompt: 'Test prompt',
        provider: 'openai',
        enableCache: true,
      });

      // Second call with same prompt
      const response2 = await aiService.generateResponse({
        prompt: 'Test prompt',
        provider: 'openai',
        enableCache: true,
      });

      expect(response1).toEqual(response2);
      expect(aiService.callOpenAI).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache after TTL', async () => {
      jest.useFakeTimers();

      const AIService = (await import('../ai-service')).AIService;
      aiService = new AIService();

      const mockResponse1 = { content: 'Response 1' };
      const mockResponse2 = { content: 'Response 2' };
      
      jest.spyOn(aiService, 'callOpenAI')
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // First call
      await aiService.generateResponse({
        prompt: 'Test prompt',
        provider: 'openai',
        enableCache: true,
        cacheTTL: 3600, // 1 hour
      });

      // Advance time by 2 hours
      jest.advanceTimersByTime(2 * 60 * 60 * 1000);

      // Second call after TTL
      const response = await aiService.generateResponse({
        prompt: 'Test prompt',
        provider: 'openai',
        enableCache: true,
      });

      expect(response.content).toBe('Response 2');
      expect(aiService.callOpenAI).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });
});