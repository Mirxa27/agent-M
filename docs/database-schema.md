# Mirxa AI Agent Platform Database Schema

This document outlines the database schema for the Mirxa AI Agent Platform, including tables, relationships, and their purposes. The schema is primarily defined in `shared/schema.ts` using Drizzle ORM.

## Core Tables

### `users`

Stores user account information including authentication details and subscription status.

| Column          | Type      | Modifiers                  | Description                                     |
|-----------------|-----------|----------------------------|-------------------------------------------------|
| `id`            | `serial`  | `PRIMARY KEY`              | Unique identifier for the user                  |
| `username`      | `text`    | `NOT NULL, UNIQUE`         | Unique username for login                       |
| `password`      | `text`    | `NOT NULL`                 | Hashed password                                 |
| `email`         | `text`    | `NOT NULL, UNIQUE`         | Unique email address                            |
| `fullName`      | `text`    |                            | User's full name                                |
| `planId`        | `integer` | `REFERENCES plans(id)`     | Optional reference to subscription plan         |
| `planExpiresAt` | `timestamp`|                            | When the current plan expires                   |
| `role`          | `text`    | `NOT NULL, DEFAULT 'user'` | User role (e.g., "user", "admin")               |
| `isActive`      | `boolean` | `NOT NULL, DEFAULT true`   | Account status                                  |
| `createdAt`     | `timestamp`| `NOT NULL, DEFAULT now()`  | Timestamp of user creation                      |
| `updatedAt`     | `timestamp`| `NOT NULL, DEFAULT now()`  | Timestamp of last user update                   |

### `credentials`

Stores encrypted credentials for third-party services and APIs.

| Column            | Type      | Modifiers                        | Description                                         |
|-------------------|-----------|----------------------------------|-----------------------------------------------------|
| `id`              | `serial`  | `PRIMARY KEY`                    | Unique identifier for the credential                |
| `userId`          | `integer` | `NOT NULL, REFERENCES users(id)` | Foreign key to `users` table                        |
| `name`            | `text`    | `NOT NULL`                       | Human-readable credential name                      |
| `type`            | `text`    | `NOT NULL`                       | Credential type (e.g., "api_key", "oauth")          |
| `service`         | `text`    |                                  | Service associated (e.g., "openai", "gmail")        |
| `authMethod`      | `text`    |                                  | Authentication method used (e.g., "apiKey", "oauth2") |
| `data`            | `text`    | `NOT NULL`                       | Encrypted credential data                           |
| `expiresAt`       | `timestamp`|                                  | When the credential expires                         |
| `lastRefreshedAt` | `timestamp`|                                  | When the credential was last refreshed              |
| `createdAt`       | `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of credential creation                    |
| `updatedAt`       | `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of last credential update                 |

### `agents`

Defines AI agents created by users, including templates.

| Column        | Type      | Modifiers                        | Description                                      |
|---------------|-----------|----------------------------------|--------------------------------------------------|
| `id`          | `serial`  | `PRIMARY KEY`                    | Unique identifier for the agent                  |
| `userId`      | `integer` | `NOT NULL, REFERENCES users(id)` | Foreign key to `users` table (owner)             |
| `name`        | `text`    | `NOT NULL`                       | Agent name                                       |
| `description` | `text`    |                                  | Agent description                                |
| `type`        | `text`    |                                  | Agent type (e.g., "assistant", "builder")        |
| `icon`        | `text`    |                                  | Icon identifier for the agent                    |
| `config`      | `jsonb`   |                                  | Agent-specific configuration (model, prompts etc.) |
| `tools`       | `jsonb`   |                                  | Array of tool IDs or configurations used by agent  |
| `isPublic`    | `boolean` | `DEFAULT false`                  | Whether the agent is publicly accessible         |
| `isTemplate`  | `boolean` | `DEFAULT false`                  | Whether this agent is a template                 |
| `isActive`    | `boolean` | `DEFAULT true`                   | Whether the agent is active                      |
| `taskCount`   | `integer` | `DEFAULT 0`                      | Number of tasks processed by this agent          |
| `createdAt`   | `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of agent creation                      |
| `updatedAt`   | `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of last agent update                   |

### `agentTools`

Defines tools that can be used by agents.

| Column        | Type      | Modifiers                  | Description                                     |
|---------------|-----------|----------------------------|-------------------------------------------------|
| `id`          | `serial`  | `PRIMARY KEY`              | Unique identifier for the tool                  |
| `name`        | `text`    | `NOT NULL, UNIQUE`         | Tool name                                       |
| `description` | `text`    |                            | Tool description                                |
| `category`    | `text`    |                            | Tool category (e.g., "ai", "research", "code")  |
| `type`        | `text`    |                            | Specific type of tool (e.g., "openai", "gmail") |
| `icon`        | `text`    |                            | Icon identifier for the tool                    |
| `config`      | `jsonb`   |                            | Tool-specific configuration (API spec, params)  |
| `isActive`    | `boolean` | `NOT NULL, DEFAULT true`   | Whether the tool is active                      |
| `isSystem`    | `boolean` | `NOT NULL, DEFAULT false`  | Whether this is a system-provided tool          |
| `createdAt`   | `timestamp`| `NOT NULL, DEFAULT now()`  | Timestamp of tool creation                      |
| `updatedAt`   | `timestamp`| `NOT NULL, DEFAULT now()`  | Timestamp of last tool update                   |

### `siteSettings`

Stores global site configuration. Assumed to have a single row with `id = 1`.

| Column         | Type      | Modifiers                  | Description                                     |
|----------------|-----------|----------------------------|-------------------------------------------------|
| `id`           | `integer` | `PRIMARY KEY, DEFAULT 1`   | Primary key, typically always 1                 |
| `logo`         | `jsonb`   |                            | Logo configuration (URL, text, showText)        |
| `colors`       | `jsonb`   |                            | Site color scheme (primary, secondary, etc.)    |
| `header`       | `jsonb`   |                            | Header configuration (sticky, transparent)      |
| `footer`       | `jsonb`   |                            | Footer configuration (copyright, social links)  |
| `chatbot`      | `jsonb`   |                            | Chatbot settings (enabled, position, welcome)   |
| `widgets`      | `jsonb`   |                            | Configuration for landing page widgets          |
| `version`      | `integer` | `NOT NULL, DEFAULT 1`      | Settings version number                         |
| `updatedBy`    | `integer` | `REFERENCES users(id)`     | User ID of the last admin who updated settings  |
| `createdAt`    | `timestamp`| `NOT NULL, DEFAULT now()`  | Timestamp of settings creation                  |
| `lastUpdated`  | `timestamp`| `NOT NULL, DEFAULT now()`  | Timestamp of last settings update               |

### `files`

Stores metadata about uploaded files.

| Column             | Type      | Modifiers                        | Description                                     |
|--------------------|-----------|----------------------------------|-------------------------------------------------|
| `id`               | `serial`  | `PRIMARY KEY`                    | Unique identifier for the file                  |
| `userId`           | `integer` | `NOT NULL, REFERENCES users(id)` | Foreign key to `users` table (uploader)         |
| `name`             | `text`    | `NOT NULL`                       | Original file name                              |
| `path`             | `text`    | `NOT NULL`                       | Storage path of the file                        |
| `type`             | `text`    |                                  | File MIME type or general type (e.g., "pdf")    |
| `size`             | `integer` |                                  | File size in bytes                              |
| `description`      | `text`    |                                  | Optional file description                       |
| `isTemplate`       | `boolean` | `DEFAULT false`                  | Whether this file is a template                 |
| `templateType`     | `text`    |                                  | If template, its type (e.g., "contract")        |
| `templateCategory` | `text`    |                                  | If template, its category (e.g., "legal")       |
| `createdAt`        | `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of file creation                      |
| `updatedAt`        | `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of last file update                   |

### `tasks`

Represents tasks assigned to AI agents.

| Column        | Type      | Modifiers                        | Description                                     |
|---------------|-----------|----------------------------------|-------------------------------------------------|
| `id`          | `serial`  | `PRIMARY KEY`                    | Unique identifier for the task                  |
| `userId`      | `integer` | `NOT NULL, REFERENCES users(id)` | Foreign key to `users` table (task creator)     |
| `agentId`     | `integer` | `NOT NULL, REFERENCES agents(id)`| Foreign key to `agents` table (assigned agent)  |
| `title`       | `text`    | `NOT NULL`                       | Task title                                      |
| `description` | `text`    |                                  | Task description                                |
| `status`      | `text`    | `NOT NULL, DEFAULT 'pending'`  | Task status (e.g., "pending", "running", "completed", "failed") |
| `result`      | `jsonb`   |                                  | Stores the final result of the task             |
| `priority`    | `text`    |                                  | Task priority (e.g., "low", "medium", "high")   |
| `isExample`   | `boolean` | `DEFAULT false`                  | Whether this is an example task for a template  |
| `createdAt`   | `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of task creation                      |
| `completedAt` | `timestamp`|                                  | Timestamp of task completion                    |

### `messages`

Stores messages exchanged within tasks or conversations.

| Column          | Type      | Modifiers                           | Description                                     |
|-----------------|-----------|-------------------------------------|-------------------------------------------------|
| `id`            | `serial`  | `PRIMARY KEY`                       | Unique identifier for the message               |
| `taskId`        | `integer` | `REFERENCES tasks(id)`              | Foreign key to `tasks` (if part of a task)      |
| `conversationId`| `integer` | `REFERENCES conversations(id)`      | Foreign key to `conversations` (if part of a direct conversation) |
| `role`          | `text`    | `NOT NULL`                          | Sender role (e.g., "user", "assistant", "system", "tool") |
| `content`       | `text`    | `NOT NULL`                          | Message content                                 |
| `timestamp`     | `timestamp`| `NOT NULL, DEFAULT now()`           | Timestamp of when the message was created/sent  |
| `metadata`      | `jsonb`   |                                     | Additional metadata (e.g., tool calls, results) |

### `taskFiles`

Junction table linking `tasks` and `files`.

| Column    | Type      | Modifiers                                  | Description                         |
|-----------|-----------|--------------------------------------------|-------------------------------------|
| `id`      | `serial`  | `PRIMARY KEY`                              | Unique identifier for the link      |
| `taskId`  | `integer` | `NOT NULL, REFERENCES tasks(id)`           | Foreign key to `tasks` table        |
| `fileId`  | `integer` | `NOT NULL, REFERENCES files(id)`           | Foreign key to `files` table        |
| `createdAt`| `timestamp`| `NOT NULL, DEFAULT now()`                | Timestamp of link creation          |
| *Unique*  |           | `(taskId, fileId)`                         | Ensures a file is linked once per task |

### `aiProviders`

Stores information about available AI providers.

| Column        | Type      | Modifiers                  | Description                                     |
|---------------|-----------|----------------------------|-------------------------------------------------|
| `id`          | `serial`  | `PRIMARY KEY`              | Unique identifier for the AI provider           |
| `name`        | `text`    | `NOT NULL, UNIQUE`         | Provider name (e.g., "OpenAI", "Anthropic")     |
| `slug`        | `text`    | `NOT NULL, UNIQUE`         | Short name/slug for the provider                |
| `description` | `text`    |                            | Provider description                            |
| `icon`        | `text`    |                            | Icon identifier for the provider                |
| `apiUrl`      | `text`    |                            | Base API endpoint for the provider              |
| `authMethod`  | `text`    |                            | Default authentication method                   |
| `config`      | `jsonb`   |                            | Provider-specific configuration                 |
| `isActive`    | `boolean` | `NOT NULL, DEFAULT true`   | Whether the provider is active                  |
| `createdAt`   | `timestamp`| `NOT NULL, DEFAULT now()`  | Timestamp of provider creation                  |
| `updatedAt`   | `timestamp`| `NOT NULL, DEFAULT now()`  | Timestamp of last provider update               |

### `aiModels`

Stores details about specific AI models from various providers.

| Column          | Type      | Modifiers                             | Description                                     |
|-----------------|-----------|---------------------------------------|-------------------------------------------------|
| `id`            | `serial`  | `PRIMARY KEY`                         | Unique identifier for the AI model              |
| `providerId`    | `integer` | `NOT NULL, REFERENCES aiProviders(id)`| Foreign key to `aiProviders` table              |
| `name`          | `text`    | `NOT NULL`                            | Human-readable model name (e.g., "GPT-4o")      |
| `modelId`       | `text`    | `NOT NULL`                            | Actual model identifier used in API calls       |
| `displayName`   | `text`    |                                       | Display name for UI                             |
| `description`   | `text`    |                                       | Model description                               |
| `capabilities`  | `jsonb`   |                                       | List of model capabilities (e.g., "text", "vision") |
| `contextWindow` | `integer` |                                       | Model's context window size (tokens)            |
| `config`        | `jsonb`   |                                       | Model-specific configuration                    |
| `isActive`      | `boolean` | `NOT NULL, DEFAULT true`              | Whether the model is active                     |
| `createdAt`     | `timestamp`| `NOT NULL, DEFAULT now()`             | Timestamp of model creation                     |
| `updatedAt`     | `timestamp`| `NOT NULL, DEFAULT now()`             | Timestamp of last model update                  |
| *Unique*        |           | `(providerId, modelId)`               | Ensures model uniqueness per provider           |

### `aiPrompts`

Stores reusable AI prompts. (Schema details might vary based on usage)

| Column    | Type      | Modifiers                        | Description                                     |
|-----------|-----------|----------------------------------|-------------------------------------------------|
| `id`      | `serial`  | `PRIMARY KEY`                    | Unique identifier for the prompt                |
| `modelId` | `integer` | `REFERENCES aiModels(id)`        | Optional: AI model this prompt is for           |
| `name`    | `text`    | `NOT NULL`                       | Prompt name/title                               |
| `content` | `text`    | `NOT NULL`                       | The actual prompt text                          |
| `category`| `text`    |                                  | Prompt category                                 |
| `isSystem`| `boolean` | `DEFAULT false`                  | Whether this is a system prompt                 |
| `createdAt`| `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of prompt creation                    |
| `updatedAt`| `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of last prompt update                 |

### `plans`

Defines subscription plans available to users.

| Column     | Type      | Modifiers                  | Description                                     |
|------------|-----------|----------------------------|-------------------------------------------------|
| `id`       | `serial`  | `PRIMARY KEY`              | Unique identifier for the plan                  |
| `name`     | `text`    | `NOT NULL, UNIQUE`         | Plan name (e.g., "Free", "Basic", "Pro")        |
| `price`    | `decimal` | `NOT NULL`                 | Plan price                                      |
| `interval` | `text`    | `NOT NULL`                 | Billing interval (e.g., "monthly", "yearly")    |
| `features` | `jsonb`   |                            | Plan features and limits (e.g., agentLimit)     |
| `isActive` | `boolean` | `NOT NULL, DEFAULT true`   | Whether the plan is currently offered           |

### `userActivities`

Logs user actions within the platform for auditing and activity feeds.

| Column         | Type      | Modifiers                        | Description                                     |
|----------------|-----------|----------------------------------|-------------------------------------------------|
| `id`           | `serial`  | `PRIMARY KEY`                    | Unique identifier for the activity log          |
| `userId`       | `integer` | `NOT NULL, REFERENCES users(id)` | Foreign key to `users` table (who performed)    |
| `activityType` | `text`    | `NOT NULL`                       | Type of activity (e.g., "task_created")         |
| `resourceId`   | `integer` |                                  | ID of the resource related to the activity      |
| `resourceType` | `text`    |                                  | Type of resource (e.g., "task", "agent")        |
| `metadata`     | `jsonb`   |                                  | Additional details about the activity           |
| `createdAt`    | `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of the activity                       |

### `dashboardPreferences`

Stores user-specific dashboard customization settings.

| Column           | Type      | Modifiers                        | Description                                     |
|------------------|-----------|----------------------------------|-------------------------------------------------|
| `id`             | `serial`  | `PRIMARY KEY`                    | Unique identifier for the preference set        |
| `userId`         | `integer` | `NOT NULL, UNIQUE, REFERENCES users(id)` | Foreign key to `users` table (one-to-one)   |
| `layout`         | `jsonb`   |                                  | Dashboard layout configuration (columns, etc.)  |
| `widgets`        | `jsonb`   |                                  | Configuration of enabled/disabled widgets       |
| `theme`          | `text`    |                                  | User's preferred theme (e.g., "light", "dark")  |
| `favoriteAgents` | `jsonb`   |                                  | Array of favorite agent IDs                     |
| `recentTasks`    | `jsonb`   |                                  | Array of recently accessed task IDs             |
| `updatedAt`      | `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of last preference update             |

### `analytics`

Stores aggregated analytics data. (Schema details might vary based on specific analytics)

| Column      | Type      | Modifiers                        | Description                                     |
|-------------|-----------|----------------------------------|-------------------------------------------------|
| `id`        | `serial`  | `PRIMARY KEY`                    | Unique identifier for the analytics entry       |
| `userId`    | `integer` | `REFERENCES users(id)`           | Optional: User-specific analytics               |
| `period`    | `text`    | `NOT NULL`                       | Analytics period (e.g., "daily", "weekly")      |
| `periodStart`| `date`    | `NOT NULL`                       | Start date of the analytics period              |
| `periodEnd` | `date`    | `NOT NULL`                       | End date of the analytics period                |
| `data`      | `jsonb`   |                                  | The actual analytics data (e.g., counts, sums)  |
| `createdAt` | `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of analytics record creation          |

### `conversations`

Stores metadata for direct conversations with agents (not necessarily tied to a task).

| Column      | Type      | Modifiers                        | Description                                     |
|-------------|-----------|----------------------------------|-------------------------------------------------|
| `id`        | `serial`  | `PRIMARY KEY`                    | Unique identifier for the conversation          |
| `userId`    | `integer` | `NOT NULL, REFERENCES users(id)` | User who initiated/owns the conversation        |
| `agentId`   | `integer` | `NOT NULL, REFERENCES agents(id)`| Agent involved in the conversation              |
| `title`     | `text`    |                                  | Optional title for the conversation             |
| `createdAt` | `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of conversation creation              |
| `updatedAt` | `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of last message in conversation       |

## Gamified Chatbot Tables

### `chatbotGameProgress`

Tracks user progress in the gamified chatbot system.

| Column                | Type      | Modifiers                        | Description                                     |
|-----------------------|-----------|----------------------------------|-------------------------------------------------|
| `id`                  | `serial`  | `PRIMARY KEY`                    | Unique identifier for game progress             |
| `userId`              | `integer` | `REFERENCES users(id)`           | Foreign key to `users` (nullable for guests)    |
| `sessionId`           | `text`    | `NOT NULL`                       | Session identifier for tracking progress        |
| `points`              | `integer` | `NOT NULL, DEFAULT 0`            | Accumulated points                              |
| `level`               | `integer` | `NOT NULL, DEFAULT 1`            | Current user level                              |
| `badges`              | `jsonb`   |                                  | Array of earned badge names/IDs                 |
| `streak`              | `integer` | `NOT NULL, DEFAULT 0`            | Consecutive day activity streak                 |
| `avatarChoice`        | `text`    |                                  | Selected avatar identifier                      |
| `completedChallenges` | `jsonb`   |                                  | Array of completed challenge IDs                |
| `lastInteraction`     | `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of the last interaction               |
| *Unique*              |           | `(userId, sessionId)` or `(sessionId)` if userId is nullable | Ensures one progress record per user/session |

### `chatbotChallenges`

Defines challenges that users can complete for rewards.

| Column         | Type      | Modifiers                  | Description                                     |
|----------------|-----------|----------------------------|-------------------------------------------------|
| `id`           | `serial`  | `PRIMARY KEY`              | Unique identifier for the challenge             |
| `title`        | `text`    | `NOT NULL`                 | Challenge title                                 |
| `description`  | `text`    | `NOT NULL`                 | Challenge description                           |
| `difficulty`   | `text`    |                            | Challenge difficulty (e.g., "easy", "hard")     |
| `pointsReward` | `integer` | `NOT NULL, DEFAULT 0`      | Points awarded upon completion                  |
| `badgeReward`  | `text`    |                            | Name/ID of badge awarded upon completion        |
| `isActive`     | `boolean` | `NOT NULL, DEFAULT true`   | Whether the challenge is currently active       |

## Browser Automation Tables

### `browserSequences`

Stores sequences of browser automation steps.

| Column           | Type      | Modifiers                        | Description                                     |
|------------------|-----------|----------------------------------|-------------------------------------------------|
| `id`             | `serial`  | `PRIMARY KEY`                    | Unique identifier for the browser sequence      |
| `userId`         | `integer` | `NOT NULL, REFERENCES users(id)` | User who owns this sequence                     |
| `name`           | `text`    | `NOT NULL`                       | Name of the browser sequence                    |
| `description`    | `text`    |                                  | Description of the sequence                     |
| `isActive`       | `boolean` | `DEFAULT true`                   | Whether the sequence is active/usable           |
| `executionCount` | `integer` | `DEFAULT 0`                      | How many times this sequence has been run       |
| `lastExecutedAt` | `timestamp`|                                  | Timestamp of the last execution                 |
| `createdAt`      | `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of sequence creation                  |
| `updatedAt`      | `timestamp`| `NOT NULL, DEFAULT now()`        | Timestamp of last sequence update               |

### `browserSequenceSteps`

Defines individual steps within a `browserSequence`.

| Column          | Type      | Modifiers                                  | Description                                     |
|-----------------|-----------|--------------------------------------------|-------------------------------------------------|
| `id`            | `serial`  | `PRIMARY KEY`                              | Unique identifier for the step                  |
| `sequenceId`    | `integer` | `NOT NULL, REFERENCES browserSequences(id)`| Foreign key to `browserSequences` table         |
| `stepOrder`     | `integer` | `NOT NULL`                                 | Order of this step within the sequence          |
| `actionType`    | `text`    | `NOT NULL`                                 | Type of browser action (e.g., "navigate", "click", "type") |
| `selector`      | `text`    |                                            | CSS selector for targeting an element           |
| `value`         | `text`    |                                            | Value for action (e.g., URL, text to type)      |
| `coordinates`   | `jsonb`   |                                            | X, Y coordinates for click actions              |
| `waitTimeMs`    | `integer` |                                            | Time to wait before/after this step (in ms)     |
| `waitBeforeMs`  | `integer` | `DEFAULT 0`                                | Milliseconds to wait before executing the step  |
| `waitAfterMs`   | `integer` | `DEFAULT 0`                                | Milliseconds to wait after executing the step   |
| `isConditional` | `boolean` | `DEFAULT false`                            | Whether this step has conditional logic         |
| `condition`     | `jsonb`   |                                            | Condition for execution (if `isConditional`)    |
| `metadata`      | `jsonb`   |                                            | Additional step-specific parameters             |

## Session Table

### `session`

Stores user session data, typically managed by `connect-pg-simple`.

| Column | Type   | Description                        |
|--------|--------|------------------------------------|
| `sid`  | `text` | Session ID, Primary Key            |
| `sess` | `json` | Session data                       |
| `expire`| `timestamp` | Session expiration timestamp   |

## Relationships Summary

*   **One-to-Many:**
    *   `users` to `credentials`, `agents`, `files`, `tasks`, `conversations`, `userActivities`, `dashboardPreferences`, `analytics` (optional), `chatbotGameProgress`, `browserSequences`.
    *   `agents` to `tasks`, `conversations`.
    *   `tasks` to `messages`.
    *   `conversations` to `messages`.
    *   `aiProviders` to `aiModels`.
    *   `aiModels` to `aiPrompts` (optional).
    *   `browserSequences` to `browserSequenceSteps`.
*   **Many-to-Many:**
    *   `tasks` to `files` (through `taskFiles`).
    *   `agents` to `agentTools` (implicitly, agent config stores tool IDs/references).
*   **One-to-One:**
    *   `users` to `dashboardPreferences`.

## Encryption

*   Sensitive data in the `credentials.data` field is encrypted using AES-256. The encryption key is sourced from the `ENCRYPTION_KEY` environment variable. This is handled by utility functions in `shared/crypto.ts`.

## Indexing Strategy (Illustrative)

Common indexes would include:

*   Primary keys on all `id` columns.
*   Foreign keys to enforce relationships.
*   Unique constraints (e.g., `users.username`, `users.email`, `agentTools.name`, `aiProviders.name`, `aiProviders.slug`, `aiModels(providerId, modelId)`).
*   On `userId` columns in most tables for efficient user-specific data retrieval.
*   On `taskId` and `conversationId` in the `messages` table.
*   On `sessionId` in `chatbotGameProgress`.
*   On `sequenceId` in `browserSequenceSteps`.
*   Timestamps like `createdAt` or `updatedAt` for sorting recent items.
