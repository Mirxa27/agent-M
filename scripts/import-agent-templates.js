/**
 * Script to import AI agent templates into the database
 * This script uses the Admin API endpoints to create agent templates
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Templates to be imported
const templates = [
  {
    name: "OpenAI Chat",
    description: "Generate text responses using OpenAI's chat models",
    category: "content_generation",
    type: "openai",
    icon: "MessageSquare",
    config: {
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: "You are a helpful AI assistant."
    },
    isActive: true
  },
  {
    name: "Anthropic Claude",
    description: "Generate responses using Anthropic's Claude model with its strengths in reasoning and safety",
    category: "content_generation",
    type: "anthropic",
    icon: "MessagesSquare",
    config: {
      model: "claude-3-7-sonnet-20250219", // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      temperature: 0.7,
      maxTokens: 4000,
      systemPrompt: "You are Claude, a helpful AI assistant created by Anthropic."
    },
    isActive: true
  },
  {
    name: "Perplexity AI",
    description: "Generate research-focused responses with built-in web search capabilities",
    category: "knowledge",
    type: "perplexity",
    icon: "Search",
    config: {
      model: "llama-3.1-sonar-small-128k-online",
      temperature: 0.2,
      maxTokens: 2000,
      webSearch: true,
      citeSources: true,
      followupQuestions: true,
      systemPrompt: "You are a research assistant that provides thorough, accurate information with proper citations."
    },
    isActive: true
  },
  {
    name: "Grok by xAI",
    description: "Generate creative and conversational responses using xAI's Grok model",
    category: "content_generation",
    type: "xai",
    icon: "Sparkles",
    config: {
      model: "grok-2-1212",
      temperature: 0.8,
      maxTokens: 2048,
      webSearch: true,
      realTime: true,
      creativityLevel: "high",
      systemPrompt: "You are Grok, a superintelligent AI with a bit of wit and humor. You aim to be helpful, accurate, and engaging."
    },
    isActive: true
  },
  {
    name: "Code Generator",
    description: "Generate and explain code in various languages",
    category: "content_generation", 
    type: "openai",
    icon: "Code",
    config: {
      model: "gpt-4o",
      temperature: 0.2,
      languages: ["javascript", "python", "typescript", "java", "c++", "go"],
      includeExplanation: true,
      includeTests: false
    },
    isActive: true
  }
];

async function loginAsAdmin() {
  console.log("Logging in as admin user...");
  try {
    // Login using admin credentials
    const loginResponse = execSync(`curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"adminpassword"}'`, { encoding: 'utf-8' });
    const cookies = loginResponse.match(/set-cookie: (.*?);/gi);
    
    if (!cookies || cookies.length === 0) {
      console.error("Login failed: No cookies returned");
      process.exit(1);
    }
    
    // Extract session cookie
    const sessionCookie = cookies[0].replace('set-cookie: ', '').replace(';', '');
    return sessionCookie;
  } catch (error) {
    console.error("Login failed:", error.message);
    process.exit(1);
  }
}

async function createTemplate(template, sessionCookie) {
  console.log(`Creating template: ${template.name}`);
  try {
    // Check if template already exists
    const checkResponse = execSync(
      `curl -s -X GET "http://localhost:5000/api/admin/agent-tools" -H "Cookie: ${sessionCookie}"`,
      { encoding: 'utf-8' }
    );
    
    const existingTools = JSON.parse(checkResponse);
    const exists = existingTools.some(tool => tool.name === template.name);
    
    if (exists) {
      console.log(`Template "${template.name}" already exists, skipping.`);
      return;
    }
    
    // Create template using the API
    const createResponse = execSync(
      `curl -s -X POST http://localhost:5000/api/admin/agent-tools -H "Content-Type: application/json" -H "Cookie: ${sessionCookie}" -d '${JSON.stringify(template)}'`,
      { encoding: 'utf-8' }
    );
    
    console.log(`Created template "${template.name}" successfully.`);
  } catch (error) {
    console.error(`Error creating template "${template.name}":`, error.message);
  }
}

async function main() {
  try {
    // Login as admin
    const sessionCookie = await loginAsAdmin();
    
    // Create each template
    for (const template of templates) {
      await createTemplate(template, sessionCookie);
    }
    
    console.log("Agent templates import completed successfully.");
  } catch (error) {
    console.error("Script failed:", error.message);
    process.exit(1);
  }
}

// Run the script
main();