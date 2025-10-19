# API Documentation: Generate Flashcards

## Overview

The Generate Flashcards API endpoint allows users to create AI-generated flashcards from source text using various AI models through OpenRouter.

## Endpoint

```
POST /api/generations
```

## Authentication

This endpoint requires authentication via Bearer token in the Authorization header.

```
Authorization: Bearer <your-jwt-token>
```

## Request

### Headers

| Header          | Required | Description                     |
| --------------- | -------- | ------------------------------- |
| `Authorization` | Yes      | Bearer token for authentication |
| `Content-Type`  | Yes      | Must be `application/json`      |

### Request Body

```json
{
  "sourceText": "string (1000-10000 characters)",
  "model": "string (optional)"
}
```

#### Parameters

| Parameter    | Type   | Required | Description                                                         |
| ------------ | ------ | -------- | ------------------------------------------------------------------- |
| `sourceText` | string | Yes      | The source text to generate flashcards from (1000-10000 characters) |
| `model`      | string | No       | AI model to use (defaults to "openai/gpt-4o-mini")                  |

#### Supported AI Models

- `openai/gpt-4o-mini` (default)
- `openai/gpt-4o`
- `anthropic/claude-3-haiku`

### Example Request

```bash
curl -X POST "https://api.10x-cards.app/api/generations" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceText": "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. It adds static type definitions to JavaScript, which helps catch errors during development and provides better IDE support.",
    "model": "openai/gpt-4o-mini"
  }'
```

## Response

### Success Response (201 Created)

```json
{
  "data": {
    "generationId": "uuid",
    "proposals": [
      {
        "front": "What is TypeScript?",
        "back": "TypeScript is a strongly typed programming language that builds on JavaScript",
        "confidence": 0.95
      },
      {
        "front": "What are the benefits of TypeScript?",
        "back": "TypeScript provides static type definitions, better tooling, error catching during development, and improved IDE support",
        "confidence": 0.9
      }
    ],
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "duration": 0
  },
  "success": true
}
```

#### Response Fields

| Field                    | Type   | Description                                     |
| ------------------------ | ------ | ----------------------------------------------- |
| `generationId`           | string | Unique identifier for the generation session    |
| `proposals`              | array  | Array of generated flashcard proposals          |
| `proposals[].front`      | string | Front side of the flashcard (question/prompt)   |
| `proposals[].back`       | string | Back side of the flashcard (answer/explanation) |
| `proposals[].confidence` | number | AI confidence score (0-1)                       |
| `generatedAt`            | string | ISO 8601 timestamp of generation                |
| `duration`               | number | Generation duration in milliseconds             |

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "error": {
    "message": "Source text must be at least 1000 characters",
    "code": "VALIDATION_ERROR",
    "field": "sourceText"
  },
  "success": false
}
```

#### 401 Unauthorized - Authentication Error

```json
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  },
  "success": false
}
```

#### 403 Forbidden - Permission Error

```json
{
  "error": {
    "message": "User account not verified",
    "code": "ACCOUNT_NOT_VERIFIED"
  },
  "success": false
}
```

#### 429 Too Many Requests - Rate Limit Exceeded

```json
{
  "error": {
    "message": "Rate limit exceeded. Maximum 10 generations per hour.",
    "code": "RATE_LIMIT_EXCEEDED"
  },
  "success": false
}
```

**Headers:**

```
Retry-After: 3600
```

#### 500 Internal Server Error

```json
{
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR"
  },
  "success": false
}
```

## Rate Limits

| Limit                  | Value | Window    |
| ---------------------- | ----- | --------- |
| Generations per hour   | 10    | 1 hour    |
| Generations per day    | 50    | 24 hours  |
| Concurrent generations | 3     | 5 minutes |

## Error Codes

| Code                        | Description                        |
| --------------------------- | ---------------------------------- |
| `VALIDATION_ERROR`          | Request validation failed          |
| `UNAUTHORIZED`              | Authentication required or invalid |
| `ACCOUNT_NOT_VERIFIED`      | User account not verified          |
| `PERMISSION_DENIED`         | User lacks required permissions    |
| `RATE_LIMIT_EXCEEDED`       | Rate limit exceeded                |
| `CONCURRENT_LIMIT_EXCEEDED` | Too many concurrent generations    |
| `INTERNAL_ERROR`            | Internal server error              |

## Examples

### JavaScript/TypeScript

```typescript
const response = await fetch("/api/generations", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    sourceText: "Your source text here...",
    model: "openai/gpt-4o-mini",
  }),
});

const data = await response.json();

if (data.success) {
  console.log("Generated flashcards:", data.data.proposals);
} else {
  console.error("Error:", data.error.message);
}
```

### Python

```python
import requests

response = requests.post(
    'https://api.10x-cards.app/api/generations',
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    },
    json={
        'sourceText': 'Your source text here...',
        'model': 'openai/gpt-4o-mini'
    }
)

data = response.json()

if data['success']:
    print('Generated flashcards:', data['data']['proposals'])
else:
    print('Error:', data['error']['message'])
```

## Best Practices

1. **Text Quality**: Provide clear, well-structured source text for better flashcard generation
2. **Text Length**: Use texts between 1000-10000 characters for optimal results
3. **Rate Limiting**: Implement exponential backoff when hitting rate limits
4. **Error Handling**: Always check the `success` field before processing the response
5. **Model Selection**: Use `openai/gpt-4o-mini` for cost-effective generation, `openai/gpt-4o` for higher quality

## Support

For API support and questions, please contact support@10x-cards.app or visit our documentation at https://docs.10x-cards.app.
