# Mirxa AI Platform API Documentation

## Overview

The Mirxa AI Platform provides a comprehensive RESTful API that allows developers to integrate and interact with the platform programmatically. This documentation covers the endpoints, authentication methods, and example requests/responses.

## Base URL

All API endpoints are relative to the base URL:

```
https://api.mirxa.ai/v1
```

## Authentication

### Session-based Authentication

For web applications using the API, session-based authentication is used. You must first authenticate via the `/auth/login` endpoint to establish a session.

### API Key Authentication

For programmatic access, use API key authentication. Include your API key in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

To generate an API key, navigate to your account settings in the web interface.

## Rate Limits

- Free tier: 100 requests per hour
- Basic tier: 1,000 requests per hour
- Professional tier: 10,000 requests per hour
- Enterprise tier: Custom limits

When a rate limit is exceeded, the API returns a `429 Too Many Requests` response.

## Common Response Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource was created successfully
- `400 Bad Request`: Invalid request or parameters
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Endpoints

### Authentication

#### Login

```
POST /auth/login
```

Authenticates a user and establishes a session.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**

```json
{
  "user": {
    "id": 123,
    "username": "johndoe",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "user"
  }
}
```

#### Logout

```
POST /auth/logout
```

Ends the current session.

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### User Management

#### Get Current User

```
GET /user
```

Returns information about the currently authenticated user.

**Response:**

```json
{
  "id": 123,
  "username": "johndoe",
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "user",
  "createdAt": "2023-10-15T12:00:00Z"
}
```

#### Update User

```
PATCH /user
```

Updates the current user's information.

**Request Body:**

```json
{
  "fullName": "John M. Doe",
  "username": "john_doe"
}
```

**Response:**

```json
{
  "id": 123,
  "username": "john_doe",
  "email": "user@example.com",
  "fullName": "John M. Doe",
  "role": "user",
  "updatedAt": "2023-10-16T10:30:00Z"
}
```

### Agent Management

#### List Agents

```
GET /agents
```

Returns a list of agents available to the current user.

**Query Parameters:**

- `limit` (optional): Number of results per page (default: 10)
- `offset` (optional): Pagination offset (default: 0)
- `type` (optional): Filter by agent type

**Response:**

```json
{
  "agents": [
    {
      "id": 1,
      "name": "Document Assistant",
      "type": "document",
      "description": "Helps analyze and summarize documents",
      "isActive": true,
      "createdAt": "2023-09-10T08:12:00Z"
    },
    {
      "id": 2,
      "name": "Code Helper",
      "type": "code",
      "description": "Assists with programming tasks",
      "isActive": true,
      "createdAt": "2023-09-15T14:30:00Z"
    }
  ],
  "total": 5,
  "limit": 10,
  "offset": 0
}
```

#### Get Agent

```
GET /agents/:id
```

Returns details about a specific agent.

**Response:**

```json
{
  "id": 1,
  "name": "Document Assistant",
  "type": "document",
  "description": "Helps analyze and summarize documents",
  "isActive": true,
  "config": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 4000
  },
  "tools": ["file_reader", "summarizer", "translator"],
  "createdAt": "2023-09-10T08:12:00Z",
  "updatedAt": "2023-10-05T11:45:00Z"
}
```

#### Create Agent

```
POST /agents
```

Creates a new agent.

**Request Body:**

```json
{
  "name": "Data Analyst",
  "type": "data",
  "description": "Analyzes spreadsheets and data files",
  "config": {
    "model": "gpt-4",
    "temperature": 0.2,
    "maxTokens": 8000
  },
  "tools": ["chart_generator", "csv_processor", "data_analyzer"]
}
```

**Response:**

```json
{
  "id": 3,
  "name": "Data Analyst",
  "type": "data",
  "description": "Analyzes spreadsheets and data files",
  "isActive": true,
  "config": {
    "model": "gpt-4",
    "temperature": 0.2,
    "maxTokens": 8000
  },
  "tools": ["chart_generator", "csv_processor", "data_analyzer"],
  "createdAt": "2023-10-16T15:20:00Z",
  "updatedAt": "2023-10-16T15:20:00Z"
}
```

#### Update Agent

```
PATCH /agents/:id
```

Updates an existing agent.

**Request Body:**

```json
{
  "name": "Advanced Data Analyst",
  "config": {
    "temperature": 0.3
  }
}
```

**Response:**

```json
{
  "id": 3,
  "name": "Advanced Data Analyst",
  "type": "data",
  "description": "Analyzes spreadsheets and data files",
  "isActive": true,
  "config": {
    "model": "gpt-4",
    "temperature": 0.3,
    "maxTokens": 8000
  },
  "tools": ["chart_generator", "csv_processor", "data_analyzer"],
  "createdAt": "2023-10-16T15:20:00Z",
  "updatedAt": "2023-10-16T16:05:00Z"
}
```

#### Delete Agent

```
DELETE /agents/:id
```

Deletes an agent.

**Response:**

```json
{
  "success": true,
  "message": "Agent deleted successfully"
}
```

### Task Management

#### List Tasks

```
GET /tasks
```

Returns a list of tasks.

**Query Parameters:**

- `limit` (optional): Number of results per page (default: 10)
- `offset` (optional): Pagination offset (default: 0)
- `agentId` (optional): Filter by agent ID
- `status` (optional): Filter by status (pending, running, completed, failed)

**Response:**

```json
{
  "tasks": [
    {
      "id": 101,
      "title": "Document Analysis",
      "status": "completed",
      "agentId": 1,
      "createdAt": "2023-10-15T09:30:00Z",
      "completedAt": "2023-10-15T09:35:12Z"
    },
    {
      "id": 102,
      "title": "Code Review",
      "status": "running",
      "agentId": 2,
      "createdAt": "2023-10-16T14:20:00Z",
      "completedAt": null
    }
  ],
  "total": 12,
  "limit": 10,
  "offset": 0
}
```

#### Get Task

```
GET /tasks/:id
```

Returns details about a specific task.

**Response:**

```json
{
  "id": 101,
  "title": "Document Analysis",
  "description": "Analyze and summarize the quarterly report",
  "status": "completed",
  "result": {
    "summary": "The quarterly report shows a 15% increase in revenue...",
    "keyPoints": [
      "Revenue increased by 15%",
      "New product line contributed to 30% of growth",
      "Operating costs decreased by 5%"
    ]
  },
  "agentId": 1,
  "userId": 123,
  "createdAt": "2023-10-15T09:30:00Z",
  "completedAt": "2023-10-15T09:35:12Z",
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "Please analyze this quarterly report",
      "timestamp": "2023-10-15T09:30:00Z"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "I'll analyze this report for you...",
      "timestamp": "2023-10-15T09:31:20Z"
    }
  ]
}
```

#### Create Task

```
POST /tasks
```

Creates a new task.

**Request Body:**

```json
{
  "title": "Code Optimization",
  "description": "Optimize the authentication middleware",
  "agentId": 2,
  "content": "Please review and optimize this authentication middleware code..."
}
```

**Response:**

```json
{
  "id": 103,
  "title": "Code Optimization",
  "description": "Optimize the authentication middleware",
  "status": "pending",
  "result": null,
  "agentId": 2,
  "userId": 123,
  "createdAt": "2023-10-16T16:45:00Z",
  "completedAt": null
}
```

#### Add Message to Task

```
POST /tasks/:id/messages
```

Adds a message to an existing task.

**Request Body:**

```json
{
  "content": "Could you also check for security vulnerabilities?"
}
```

**Response:**

```json
{
  "id": 3,
  "role": "user",
  "content": "Could you also check for security vulnerabilities?",
  "taskId": 103,
  "timestamp": "2023-10-16T16:50:00Z"
}
```

### File Management

#### List Files

```
GET /files
```

Returns a list of files.

**Query Parameters:**

- `limit` (optional): Number of results per page (default: 10)
- `offset` (optional): Pagination offset (default: 0)
- `type` (optional): Filter by file type
- `isTemplate` (optional): Filter templates only (true/false)

**Response:**

```json
{
  "files": [
    {
      "id": 201,
      "name": "quarterly_report.pdf",
      "type": "pdf",
      "size": 1024567,
      "contentType": "application/pdf",
      "isTemplate": false,
      "createdAt": "2023-10-14T12:30:00Z"
    },
    {
      "id": 202,
      "name": "auth_middleware.js",
      "type": "javascript",
      "size": 5423,
      "contentType": "text/javascript",
      "isTemplate": false,
      "createdAt": "2023-10-15T10:15:00Z"
    }
  ],
  "total": 8,
  "limit": 10,
  "offset": 0
}
```

#### Upload File

```
POST /files
```

Uploads a new file. Use multipart/form-data for this request.

**Form Fields:**

- `file`: The file to upload
- `name` (optional): Custom name for the file
- `description` (optional): File description
- `isTemplate` (optional): Whether this is a template file (true/false)
- `templateType` (optional): Type of template if isTemplate is true
- `templateCategory` (optional): Category of template if isTemplate is true

**Response:**

```json
{
  "id": 203,
  "name": "customer_data.csv",
  "type": "csv",
  "size": 45678,
  "contentType": "text/csv",
  "description": "Customer data for analysis",
  "isTemplate": false,
  "createdAt": "2023-10-16T17:00:00Z"
}
```

#### Get File

```
GET /files/:id
```

Returns metadata about a specific file.

**Response:**

```json
{
  "id": 203,
  "name": "customer_data.csv",
  "type": "csv",
  "path": "/files/203/customer_data.csv",
  "size": 45678,
  "contentType": "text/csv",
  "description": "Customer data for analysis",
  "isTemplate": false,
  "templateType": null,
  "templateCategory": null,
  "createdAt": "2023-10-16T17:00:00Z",
  "updatedAt": "2023-10-16T17:00:00Z"
}
```

#### Download File

```
GET /files/:id/content
```

Downloads the content of a file.

**Response:**

Binary file content with appropriate Content-Type header.

#### Delete File

```
DELETE /files/:id
```

Deletes a file.

**Response:**

```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### Credential Management

#### List Credentials

```
GET /credentials
```

Returns a list of the user's saved credentials.

**Response:**

```json
{
  "credentials": [
    {
      "id": 301,
      "name": "OpenAI API Key",
      "type": "api_key",
      "service": "openai",
      "createdAt": "2023-09-01T10:00:00Z"
    },
    {
      "id": 302,
      "name": "GitHub Access Token",
      "type": "oauth_token",
      "service": "github",
      "createdAt": "2023-09-15T11:30:00Z"
    }
  ]
}
```

#### Create Credential

```
POST /credentials
```

Saves a new credential.

**Request Body:**

```json
{
  "name": "Stripe API Key",
  "type": "api_key",
  "service": "stripe",
  "value": "sk_test_1234567890abcdefghijklmn",
  "metadata": {
    "environment": "test"
  }
}
```

**Response:**

```json
{
  "id": 303,
  "name": "Stripe API Key",
  "type": "api_key",
  "service": "stripe",
  "createdAt": "2023-10-16T17:15:00Z"
}
```

#### Delete Credential

```
DELETE /credentials/:id
```

Deletes a saved credential.

**Response:**

```json
{
  "success": true,
  "message": "Credential deleted successfully"
}
```

### Subscription Management

#### Get Current Subscription

```
GET /subscription
```

Returns information about the user's current subscription plan.

**Response:**

```json
{
  "plan": "professional",
  "status": "active",
  "features": {
    "agents": 50,
    "tasks": 1000,
    "storage": 50,
    "apiCalls": 10000
  },
  "usage": {
    "agents": 12,
    "tasks": 325,
    "storage": 15.4,
    "apiCalls": 2145
  },
  "billingCycle": {
    "start": "2023-10-01T00:00:00Z",
    "end": "2023-10-31T23:59:59Z",
    "nextBilling": "2023-11-01T00:00:00Z"
  }
}
```

## Webhook Support

Mirxa AI Platform supports webhooks for real-time notifications of events. To configure webhooks, visit the Developer Settings section in your account.

Available webhook events include:

- `task.created`
- `task.completed`
- `task.failed`
- `agent.created`
- `agent.updated`
- `agent.deleted`
- `file.uploaded`
- `file.deleted`

## Error Responses

All API error responses follow this format:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid input parameters",
    "details": {
      "name": "Name is required",
      "type": "Type must be one of: document, code, data"
    }
  }
}
```

## SDKs and Client Libraries

- JavaScript/TypeScript: [mirxa-js](https://github.com/mirxa/mirxa-js)
- Python: [mirxa-python](https://github.com/mirxa/mirxa-python)
- Java: [mirxa-java](https://github.com/mirxa/mirxa-java)

## Further Help

If you need additional assistance or have questions about the API, please contact our support team at api-support@mirxa.ai or visit the [Developer Forum](https://community.mirxa.ai/developers).