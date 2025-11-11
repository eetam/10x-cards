# API Documentation: List Flashcards

## Endpoint

```
GET /api/flashcards
```

## Description

Retrieves a paginated list of flashcards for the authenticated user. Supports sorting and filtering by source and state.

## Authentication

All requests require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | `1` | Page number (minimum: 1) |
| `limit` | number | No | `25` | Number of items per page (minimum: 1, maximum: 100) |
| `sort` | string | No | `"createdAt"` | Sort field: `"createdAt"`, `"updatedAt"`, or `"due"` |
| `order` | string | No | `"desc"` | Sort order: `"asc"` or `"desc"` |
| `source` | string | No | - | Filter by source: `"ai-full"`, `"ai-edited"`, or `"manual"` |
| `state` | number | No | - | Filter by FSRS state: `0` (new), `1` (learning), `2` (review), `3` (relearning) |

## Request Example

```typescript
const response = await fetch('/api/flashcards?page=1&limit=25&sort=createdAt&order=desc&source=ai-full', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "front": "Question text",
        "back": "Answer text",
        "source": "ai-full",
        "state": 0,
        "due": "2024-01-01T00:00:00.000Z",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 100,
      "totalPages": 4
    }
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid Query Parameters

```json
{
  "success": false,
  "error": {
    "message": "Invalid query parameters",
    "code": "VALIDATION_ERROR",
    "field": "limit"
  }
}
```

#### 401 Unauthorized - Authentication Required

```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR"
  }
}
```

## Usage Examples

### Basic Usage - First Page

```typescript
async function getFlashcards(token: string) {
  const response = await fetch('/api/flashcards', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch flashcards');
  }
  
  const result = await response.json();
  return result.data;
}
```

### With Pagination

```typescript
async function getFlashcardsPage(token: string, page: number, limit: number = 25) {
  const response = await fetch(`/api/flashcards?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch flashcards');
  }
  
  const result = await response.json();
  return result.data;
}
```

### Filter by Source

```typescript
async function getAIGeneratedFlashcards(token: string) {
  const response = await fetch('/api/flashcards?source=ai-full', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch flashcards');
  }
  
  const result = await response.json();
  return result.data;
}
```

### Filter by State (Due for Review)

```typescript
async function getDueFlashcards(token: string) {
  const response = await fetch('/api/flashcards?state=2&sort=due&order=asc', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch flashcards');
  }
  
  const result = await response.json();
  return result.data;
}
```

### Combined Filters

```typescript
async function getFilteredFlashcards(
  token: string,
  options: {
    page?: number;
    limit?: number;
    sort?: 'createdAt' | 'updatedAt' | 'due';
    order?: 'asc' | 'desc';
    source?: 'ai-full' | 'ai-edited' | 'manual';
    state?: 0 | 1 | 2 | 3;
  }
) {
  const params = new URLSearchParams();
  
  if (options.page) params.set('page', options.page.toString());
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.sort) params.set('sort', options.sort);
  if (options.order) params.set('order', options.order);
  if (options.source) params.set('source', options.source);
  if (options.state !== undefined) params.set('state', options.state.toString());
  
  const response = await fetch(`/api/flashcards?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch flashcards');
  }
  
  const result = await response.json();
  return result.data;
}
```

## React Hook Example

```typescript
import { useState, useEffect } from 'react';

interface UseFlashcardsOptions {
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'updatedAt' | 'due';
  order?: 'asc' | 'desc';
  source?: 'ai-full' | 'ai-edited' | 'manual';
  state?: 0 | 1 | 2 | 3;
}

export function useFlashcards(token: string, options: UseFlashcardsOptions = {}) {
  const [flashcards, setFlashcards] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchFlashcards() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        
        if (options.page) params.set('page', options.page.toString());
        if (options.limit) params.set('limit', options.limit.toString());
        if (options.sort) params.set('sort', options.sort);
        if (options.order) params.set('order', options.order);
        if (options.source) params.set('source', options.source);
        if (options.state !== undefined) params.set('state', options.state.toString());
        
        const response = await fetch(`/api/flashcards?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch flashcards');
        }
        
        const result = await response.json();
        setFlashcards(result.data.data);
        setPagination(result.data.pagination);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFlashcards();
  }, [token, options.page, options.limit, options.sort, options.order, options.source, options.state]);
  
  return { flashcards, pagination, loading, error };
}
```

## Notes

- All date fields (`due`, `created_at`, `updated_at`) are returned in ISO 8601 format with timezone
- The `state` field represents the FSRS state: 0 (new), 1 (learning), 2 (review), 3 (relearning)
- The `source` field indicates how the flashcard was created: `"ai-full"` (directly from AI), `"ai-edited"` (AI proposal edited by user), or `"manual"` (created manually)
- Results are automatically filtered to only include flashcards belonging to the authenticated user (enforced by Row-Level Security)
- The maximum `limit` is 100 to prevent excessive load on the database
- Empty result sets return an empty array with `total: 0`

