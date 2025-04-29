# Mirxa AI Agent Platform Database Schema

This document outlines the database schema for the Mirxa AI Agent Platform, including tables, relationships, and their purposes.

## Core Tables

### Users

Table: `users`

Stores user account information including authentication details and subscription status.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| username | text | Unique username for login |
| password | text | Hashed password |
| email | text | Unique email address |
| fullName | text | User's full name |
| planId | integer | Optional reference to subscription plan |
| planExpiresAt | timestamp | When the current plan expires |
| role | text | User role (default: "user") |
| isActive | boolean | Account status |

### Credentials

Table: `credentials`

Stores encrypted credentials for third-party services and APIs.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| userId | integer | Foreign key to users table |
| name | text | Human-readable credential name |
| type | text | Service type (e.g., "gmail", "openai") |
| authMethod | text | Authentication method (e.g., "apiKey", "oauth") |
| data | text | Encrypted credential data |
| expiresAt | timestamp | When the credential expires |
| lastRefreshedAt | timestamp | When the credential was last refreshed |
| createdAt | timestamp | When the credential was created |
| updatedAt | timestamp | When the credential was last updated |

### Agents

Table: `agents`

Defines AI agents created by users.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| userId | integer | Foreign key to users table |
| name | text | Agent name |
| description | text | Agent description |
| config | jsonb | Agent configuration |
| isPublic | boolean | Whether the agent is publicly accessible |
| createdAt | timestamp | When the agent was created |
| updatedAt | timestamp | When the agent was last updated |

### Agent Tools

Table: `agent_tools`

Defines tools that can be used by agents.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| name | text | Tool name |
| description | text | Tool description |
| category | text | Tool category |
| apiSpec | jsonb | Tool API specification |
| isActive | boolean | Whether the tool is active |

## Gamified Chatbot Tables

### Chatbot Messages

Table: `chatbot_messages`

Stores chat messages between users and the gamified chatbot.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| userId | integer | Foreign key to users table (null for unauthenticated users) |
| sessionId | text | Session identifier for tracking conversations |
| content | text | Message content |
| isBot | boolean | Whether the message is from the bot or user |
| timestamp | timestamp | When the message was sent |
| metadata | jsonb | Additional message metadata |

### Chatbot Game Progress

Table: `chatbot_game_progress`

Tracks user progress in the gamified chatbot system.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| userId | integer | Foreign key to users table (null for unauthenticated users) |
| sessionId | text | Session identifier for tracking progress |
| points | integer | Accumulated points |
| level | integer | Current user level |
| badges | jsonb | Earned badges |
| streak | integer | Consecutive day streak |
| avatarChoice | text | Selected avatar |
| completedChallenges | jsonb | Completed challenges |
| lastInteraction | timestamp | Last interaction time |

### Chatbot Challenges

Table: `chatbot_challenges`

Defines challenges that users can complete for rewards.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| title | text | Challenge title |
| description | text | Challenge description |
| difficulty | text | Challenge difficulty level |
| pointsReward | integer | Points awarded for completion |
| badgeReward | text | Badge awarded for completion |
| isActive | boolean | Whether the challenge is active |

## AI Browser Tables

### Browser Sessions

Table: `browser_sessions`

Tracks AI browser sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| userId | integer | Foreign key to users table |
| startedAt | timestamp | When the session started |
| endedAt | timestamp | When the session ended |
| metadata | jsonb | Session metadata |

### Browser Actions

Table: `browser_actions`

Records actions performed in the AI browser.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| sessionId | integer | Foreign key to browser_sessions table |
| actionType | text | Type of action performed |
| url | text | URL where action was performed |
| content | jsonb | Action content details |
| timestamp | timestamp | When the action was performed |
| observation | text | AI observation of the action |

## Relationships

- `users` to `credentials`: One-to-many
- `users` to `agents`: One-to-many
- `users` to `chatbot_game_progress`: One-to-many
- `users` to `browser_sessions`: One-to-many
- `agents` to `agent_tools`: Many-to-many (through junction table)
- `browser_sessions` to `browser_actions`: One-to-many

## Encryption

Sensitive data in the `credentials` table is encrypted using AES-256 encryption with the `ENCRYPTION_KEY` environment variable as the key.

## Indexing Strategy

The following indexes are created for optimizing query performance:

- `users.username` and `users.email` (for login lookups)
- `credentials.userId` (for retrieving user credentials)
- `agents.userId` (for retrieving user agents)
- `chatbot_messages.sessionId` (for retrieving conversation history)
- `browser_actions.sessionId` (for retrieving session actions)