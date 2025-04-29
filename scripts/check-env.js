#!/usr/bin/env node

/**
 * Environment Configuration Check Utility
 * 
 * This script validates that all required environment variables are properly set
 * and provides recommendations for missing or misconfigured variables.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file if present
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

// Define required environment variables and their validation rules
const requiredVars = {
  // Database
  DATABASE_URL: {
    required: true,
    description: 'PostgreSQL connection string',
    format: 'postgres://username:password@hostname:5432/database_name',
    validator: (value) => value && value.startsWith('postgres://'),
  },
  
  // Security
  ENCRYPTION_KEY: {
    required: true,
    description: 'Key used for credential encryption (must be 32 characters)',
    validator: (value) => value && value.length === 32,
  },
  SESSION_SECRET: {
    required: true,
    description: 'Secret used for session encryption',
    validator: (value) => value && value.length >= 16,
  },
  
  // Server configuration
  NODE_ENV: {
    required: false,
    description: 'Node environment (development, test, production)',
    defaultValue: 'development',
    validator: (value) => ['development', 'test', 'production'].includes(value),
  },
  PORT: {
    required: false,
    description: 'Port for the server to listen on',
    defaultValue: '5000',
    validator: (value) => !isNaN(parseInt(value, 10)),
  },
  HOST: {
    required: false,
    description: 'Host for the server to bind to',
    defaultValue: '0.0.0.0',
  },
  BASE_URL: {
    required: false,
    description: 'Base URL for the application (for OAuth redirects)',
    defaultValue: 'http://localhost:5000',
  },
  
  // AI provider configurations
  OPENAI_API_KEY: {
    required: false,
    description: 'OpenAI API key',
    group: 'ai-provider',
    validator: (value) => !value || value.startsWith('sk-'),
  },
  ANTHROPIC_API_KEY: {
    required: false,
    description: 'Anthropic API key',
    group: 'ai-provider',
    validator: (value) => !value || value.startsWith('sk-'),
  },
  XAI_API_KEY: {
    required: false,
    description: 'xAI API key',
    group: 'ai-provider',
  },
  PERPLEXITY_API_KEY: {
    required: false,
    description: 'Perplexity API key',
    group: 'ai-provider',
  },
  
  // OAuth configurations
  GOOGLE_CLIENT_ID: {
    required: false,
    description: 'Google OAuth client ID',
    group: 'oauth-provider',
  },
  GOOGLE_CLIENT_SECRET: {
    required: false,
    description: 'Google OAuth client secret',
    group: 'oauth-provider',
  },
  MICROSOFT_CLIENT_ID: {
    required: false,
    description: 'Microsoft OAuth client ID',
    group: 'oauth-provider',
  },
  MICROSOFT_CLIENT_SECRET: {
    required: false,
    description: 'Microsoft OAuth client secret',
    group: 'oauth-provider',
  },
};

// Results storage
const missing = [];
const invalid = [];
const warnings = [];
const passed = [];

// Group tracking
const groups = {};

// Check each environment variable
for (const [key, config] of Object.entries(requiredVars)) {
  const value = process.env[key];
  
  // Track group presence
  if (config.group) {
    if (!groups[config.group]) {
      groups[config.group] = { total: 0, present: 0 };
    }
    groups[config.group].total++;
    if (value) {
      groups[config.group].present++;
    }
  }
  
  // Check if variable exists
  if (!value) {
    if (config.required) {
      missing.push({
        key,
        description: config.description,
        format: config.format,
      });
    } else if (config.defaultValue) {
      warnings.push({
        key,
        description: `Using default value: "${config.defaultValue}"`,
      });
      passed.push({
        key,
        value: config.defaultValue,
      });
    } else {
      warnings.push({
        key,
        description: 'Optional but not set',
      });
    }
    continue;
  }
  
  // Validate format if a validator is provided
  if (config.validator && !config.validator(value)) {
    invalid.push({
      key,
      description: config.description,
      format: config.format,
      value: key === 'ENCRYPTION_KEY' ? '[HIDDEN]' : value,
    });
    continue;
  }
  
  // If we get here, the variable is valid
  passed.push({
    key,
    value: key === 'ENCRYPTION_KEY' || key.includes('SECRET') || key.includes('API_KEY') 
      ? '[HIDDEN]' 
      : value,
  });
}

// Check group requirements
for (const [groupName, stats] of Object.entries(groups)) {
  if (stats.present === 0) {
    if (groupName === 'ai-provider') {
      missing.push({
        key: 'AI_PROVIDER',
        description: 'At least one AI provider API key is required',
      });
    } else {
      warnings.push({
        key: groupName.toUpperCase(),
        description: `No ${groupName} configured (optional)`,
      });
    }
  }
}

// Output results
console.log('🔍 Mirxa AI Platform Environment Configuration Check');
console.log('=====================================================\n');

if (missing.length > 0) {
  console.log('❌ Missing Required Variables:');
  missing.forEach(({ key, description, format }) => {
    console.log(`   ${key}: ${description}${format ? ` (Format: ${format})` : ''}`);
  });
  console.log('');
}

if (invalid.length > 0) {
  console.log('⚠️  Invalid Variables:');
  invalid.forEach(({ key, description, value, format }) => {
    console.log(`   ${key}: ${description}`);
    console.log(`     Current value: ${value}`);
    if (format) {
      console.log(`     Expected format: ${format}`);
    }
  });
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:');
  warnings.forEach(({ key, description }) => {
    console.log(`   ${key}: ${description}`);
  });
  console.log('');
}

if (passed.length > 0) {
  console.log('✅ Valid Variables:');
  passed.forEach(({ key, value }) => {
    console.log(`   ${key}: ${value}`);
  });
  console.log('');
}

// Final summary and exit code
const totalIssues = missing.length + invalid.length;
if (totalIssues > 0) {
  console.log(`❌ Found ${totalIssues} issue${totalIssues === 1 ? '' : 's'} with your environment configuration.`);
  console.log('   Fix these issues before proceeding to production deployment.\n');
  process.exit(1);
} else {
  console.log('✅ Environment configuration check passed!');
  if (warnings.length > 0) {
    console.log(`   (with ${warnings.length} warning${warnings.length === 1 ? '' : 's'})`);
  }
  console.log('   Your Mirxa AI Platform is correctly configured.\n');
  process.exit(0);
}