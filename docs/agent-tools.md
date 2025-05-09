# Agent Tools Documentation

This document provides details on the available agent tools, their configurations, and how to use them.

## Overview

Agent tools extend the capabilities of AI agents, allowing them to interact with external services, data sources, and perform various actions. Each tool has a specific `type` and a `config` object that defines its behavior.

---

## Tool Types

### 1. OpenAI Tool (`openai`)

**Purpose:**
Leverages OpenAI (or compatible) models for advanced text generation, analysis, or other AI-driven tasks.

**Configuration (`config`):**
-   `providerId` (optional, number): ID of the AI Provider to use. Defaults to a system-defined provider if not specified.
-   `modelId` (optional, string): The specific AI model name (e.g., "gpt-4o", "claude-3-opus-20240229"). Defaults to a system-defined model if not specified.
-   `systemPrompt` (optional, string): The system message to guide the AI's behavior. Default: "You are a helpful assistant."
-   `temperature` (optional, number): Sampling temperature (0-2). Default: 0.7.
-   `maxTokens` (optional, number): Maximum number of tokens to generate in the completion.

**Input:**
A string representing the user's prompt or input for the AI model.

```json
"User's question or instruction for the AI."
```

**Output:**
```json
{
  "success": true,
  "result": "The AI model's response text.",
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 150,
    "total_tokens": 200
  }
}
// Or on failure:
{
  "success": false,
  "error": "Error message explaining the failure."
}
```

---

### 2. Custom API Tool (`custom_api`)

**Purpose:**
Allows agents to interact with any external HTTP API.

**Configuration (`config`):**
-   `endpoint` (required, string): The full URL of the API endpoint.
-   `method` (optional, string): HTTP method ("GET", "POST", "PUT", "DELETE", "PATCH"). Default: "POST".
-   `headers` (optional, object): Key-value pairs for HTTP headers (e.g., `{"Content-Type": "application/json", "Authorization": "Bearer YOUR_API_KEY"}`).

**Input:**
The body of the request (for POST, PUT, PATCH) or query parameters (often appended to the endpoint for GET). The service expects the input to be an object that will be JSON.stringify'd for relevant methods.

```json
{
  "param1": "value1",
  "param2": "value2"
}
```

**Output:**
```json
{
  "success": true,
  "result": { /* JSON response from API */ } // or string if non-JSON response
}
// Or on failure:
{
  "success": false,
  "error": "Error message (e.g., API call failed with status 404: Not Found)."
}
```

---

### 3. Webhook Tool (`webhook`)

**Purpose:**
Sends data to a specified webhook URL.

**Configuration (`config`):**
-   `webhookUrl` (required, string): The URL to which the POST request will be sent.
-   `headers` (optional, object): Custom HTTP headers for the webhook call.
-   `additionalData` (optional, object): Static key-value pairs to include in the webhook payload.

**Input:**
Any JSON-serializable data that the agent wants to send to the webhook.

```json
{
  "event_type": "new_lead",
  "lead_details": {
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

**Output (from the webhook execution itself, not necessarily the webhook's response content):**
```json
{
  "success": true,
  "result": { /* JSON response from webhook if any */ } // or string response
}
// Or on failure:
{
  "success": false,
  "error": "Error message (e.g., Webhook call failed with status 500: Internal Server Error)."
}
```
**Webhook Payload Sent:**
The tool will send a POST request with a JSON body structured as follows:
```json
{
  "toolId": 123,
  "toolName": "My Webhook Tool",
  "input": { /* The input provided to the tool */ },
  "timestamp": "2024-05-10T12:00:00.000Z",
  // ...any fields from config.additionalData
}
```

---

### 4. Database Tool (`database`)

**Purpose:**
Allows agents to interact with connected databases (PostgreSQL, MySQL, SQLite).

**Configuration (`config`):**
-   `connectionType` (required, string): Type of database ("postgres", "mysql", "sqlite").
-   `connectionString` (required, string): The database connection string. **Note:** This is sensitive. Consider security implications.
-   `allowedTables` (optional, array of strings): List of table names the tool is permitted to access. If undefined, access might be restricted by default.

**Input:**
An object specifying the database operation and its parameters.
-   `operation` (required, string): The operation to perform ("query", "select", "insert", "update", "delete").
-   For `query`:
    -   `query` (required, string): The SQL query string.
    -   `params` (optional, array): Parameters for the query.
-   For `select`:
    -   `tableName` (required, string): Name of the table.
    -   `columns` (optional, array of strings): Columns to select. Default: `["*"]`.
    -   `conditions` (optional, object): Key-value pairs for WHERE clauses (e.g., `{"id": 1, "status": "active"}`). Joined by AND.
-   For `insert`:
    -   `tableName` (required, string): Name of the table.
    -   `values` (required, object): Key-value pairs of columns and values to insert.
-   For `update`:
    -   `tableName` (required, string): Name of the table.
    -   `values` (required, object): Key-value pairs of columns and new values.
    -   `conditions` (required, object): Key-value pairs for WHERE clauses.
-   For `delete`:
    -   `tableName` (required, string): Name of the table.
    -   `conditions` (required, object): Key-value pairs for WHERE clauses. At least one condition is required.

**Example Input (`select`):**
```json
{
  "operation": "select",
  "tableName": "users",
  "columns": ["id", "username", "email"],
  "conditions": { "isActive": true }
}
```

**Output:**
```json
{
  "success": true,
  "result": {
    "rowCount": 10, // Number of rows affected or returned
    "rows": [ /* array of row objects */ ]
  }
}
// Or on failure:
{
  "success": false,
  "error": "Error message (e.g., Database operation failed: permission denied for table users)."
}
```

---

### 5. File System Tool (`file_system`)

**Purpose:**
Allows agents to read, write, and manage files within a sandboxed directory.

**Configuration (`config`):**
-   `baseDirectory` (optional, string): The root directory for file operations. If not set, defaults to the `AGENT_FILE_SANDBOX_DIR` environment variable. **Crucial for security.**

**Input:**
An object specifying the file system operation.
-   `operation` (required, string): "read", "write", "append", "delete", "list", "exists", "mkdir", "rmdir", "move", "copy".
-   `path` (required for most operations, string): Relative path within the sandbox.
-   `content` (required for "write", "append", string): Content to write/append.
-   `recursive` (optional for "rmdir", boolean): Whether to remove directories recursively.
-   `source` (required for "move", "copy", string): Relative source path.
-   `destination` (required for "move", "copy", string): Relative destination path.

**Example Input (`read`):**
```json
{
  "operation": "read",
  "path": "documents/report.txt"
}
```
**Example Input (`list`):**
```json
{
  "operation": "list",
  "path": "documents/" // Optional, defaults to baseDirectory
}
```

**Output (varies by operation):**
-   `read`: `{ "success": true, "result": { "content": "...", "path": "..." } }`
-   `write`: `{ "success": true, "result": { "path": "...", "bytesWritten": 123 } }`
-   `list`: `{ "success": true, "result": { "path": "/", "files": [ { "name": "...", "path": "...", "isDirectory": false, "size": 123, ... } ] } }`
-   `exists`: `{ "success": true, "result": { "path": "...", "exists": true, "isDirectory": false, ... } }`
```json
// Generic failure structure
{
  "success": false,
  "error": "Error message (e.g., File not found: documents/report.txt)."
}
```

---

### 6. Email Tool (`email`)

**Purpose:**
Sends emails via a configured email service.

**Configuration (`config`):**
-   `credentialId` (optional, number): ID of the credential (e.g., API key for SendGrid) to use.
-   `provider` (optional, string): Email provider type (e.g., "sendgrid", "smtp", "custom_api").
-   `apiKey` (optional, string): API Key for the email service. **Prefer `credentialId`.**
-   `apiUrl` (optional, string): API URL if `provider` is "custom_api".
-   `fromEmail` (optional, string): Default "from" email address.

**Input:**
```json
{
  "to": "recipient@example.com",
  "subject": "Hello from Agent",
  "body": "This is the email content."
}
```

**Output:**
```json
{
  "success": true,
  "result": { /* Response from email service API */ } // or "Email sent successfully."
}
// Or on failure:
{
  "success": false,
  "error": "Error message."
}
```

---

### 7. SMS Tool (`sms`)

**Purpose:**
Sends SMS messages via a configured SMS service.

**Configuration (`config`):**
-   `credentialId` (optional, number): ID of the credential (e.g., Twilio Auth Token) to use.
-   `provider` (optional, string): SMS provider type (e.g., "twilio", "custom_api").
-   `accountSid` (optional, string): Account SID for the SMS service. **Prefer `credentialId`.**
-   `apiKey` (optional, string): API Key/Auth Token for the SMS service. **Prefer `credentialId`.**
-   `apiUrl` (optional, string): API URL if `provider` is "custom_api".
-   `fromNumber` (optional, string): Default "from" phone number.

**Input:**
```json
{
  "to": "+12345678900", // E.164 format
  "message": "Hello from your AI agent!"
}
```

**Output:**
```json
{
  "success": true,
  "result": { /* Response from SMS service API */ } // or "SMS sent successfully."
}
// Or on failure:
{
  "success": false,
  "error": "Error message."
}
```

---

### 8. Search Tool (`search`)

**Purpose:**
Performs web searches using a configured search engine API.

**Configuration (`config`):**
-   `credentialId` (optional, number): ID of the credential for the search API.
-   `provider` (optional, string): Search provider type (e.g., "google", "bing", "custom_api").
-   `apiKey` (optional, string): API Key for the search service. **Prefer `credentialId`.**
-   `searchEngineId` (optional, string): Specific Search Engine ID (e.g., for Google Custom Search).
-   `searchEngineUrl` (optional, string): API URL if `provider` is "custom_api". Default: `"https://api.example-search.com/search"`.

**Input:**
A string representing the search query.
```json
"latest AI research papers"
```
Alternatively, an object:
```json
{
  "query": "latest AI research papers"
}
```

**Output:**
```json
{
  "success": true,
  "result": { /* Search results from the API, structure depends on the provider */ }
}
// Or on failure:
{
  "success": false,
  "error": "Error message."
}
```

---

### 9. Custom Tool (`custom`)

**Purpose:**
A generic tool type for functionalities not covered by other specific types. Often involves executing custom scripts or logic.

**Configuration (`config`):**
-   `scriptPath` (optional, string): Path to a custom script to execute (e.g., a Python or Node.js script).
-   `runtime` (optional, string): Runtime environment for the script (e.g., "nodejs", "python").
-   `parameters` (optional, object): Custom static parameters needed by the tool's logic.

**Input:**
Depends on the custom tool's implementation. Typically an object.

```json
{
  "custom_param1": "value1",
  "data_to_process": { ... }
}
```

**Output:**
Depends on the custom tool's implementation.
```json
{
  "success": true,
  "result": { /* Output from the custom tool */ }
}
// Or on failure:
{
  "success": false,
  "error": "Error message from custom tool execution."
}
```
**Note:** The execution logic for "custom" tools in `AgentToolsService` currently involves evaluating a string of code defined in `tool.config.codeToRun`. This is highly flexible but carries security risks if not managed carefully. The `scriptPath` and `runtime` approach mentioned in the config schema would be a more secure way to handle custom code execution.
