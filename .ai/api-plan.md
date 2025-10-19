# REST API Plan

## 1. Resources

- **Users** - Corresponds to `auth.users` table (managed by Supabase Auth)
- **Generations** - Corresponds to `generations` table (AI generation sessions)
- **Flashcards** - Corresponds to `flashcards` table (user's flashcard collection)
- **Generation Error Logs** - Corresponds to `generation_error_logs` table (error tracking)

## 2. Endpoints

### Authentication & User Management

_Note: User management is handled by Supabase Auth API directly_

### Generations

#### Create Generation Session

- **Method:** POST
- **Path:** `/api/generations`
- **Description:** Create a new AI generation session
- **Request Body:**

```json
{
  "sourceText": "string (1000-10000 characters)",
  "model": "string (optional, defaults to configured model)"
}
```

- **Response Body:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "model": "string",
  "sourceTextHash": "string",
  "sourceTextLength": "number",
  "createdAt": "ISO 8601 timestamp"
}
```

- **Success:** 201 Created
- **Errors:** 400 Bad Request (invalid text length), 401 Unauthorized, 500 Internal Server Error

#### Generate Flashcards

- **Method:** POST
- **Path:** `/api/generations/{generationId}/flashcards`
- **Description:** Generate flashcard proposals using AI
- **Path Parameters:**
  - `generationId` (uuid) - ID of the generation session
- **Response Body:**

```json
{
  "generationId": "uuid",
  "proposals": [
    {
      "front": "string",
      "back": "string",
      "confidence": "number (0-1)"
    }
  ],
  "generatedAt": "ISO 8601 timestamp",
  "duration": "number (milliseconds)"
}
```

- **Success:** 200 OK
- **Errors:** 404 Not Found, 401 Unauthorized, 500 Internal Server Error

#### Get Generation Details

- **Method:** GET
- **Path:** `/api/generations/{generationId}`
- **Description:** Retrieve generation session details
- **Path Parameters:**
  - `generationId` (uuid) - ID of the generation session
- **Response Body:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "model": "string",
  "generatedCount": "number",
  "acceptedUneditedCount": "number",
  "acceptedEditedCount": "number",
  "sourceTextLength": "number",
  "generationDuration": "ISO 8601 duration",
  "createdAt": "ISO 8601 timestamp"
}
```

- **Success:** 200 OK
- **Errors:** 404 Not Found, 401 Unauthorized

#### List User Generations

- **Method:** GET
- **Path:** `/api/generations`
- **Description:** List user's generation sessions
- **Query Parameters:**
  - `page` (number, optional) - Page number (default: 1)
  - `limit` (number, optional) - Items per page (default: 25, max: 100)
  - `sort` (string, optional) - Sort field (createdAt, model) (default: createdAt)
  - `order` (string, optional) - Sort order (asc, desc) (default: desc)
- **Response Body:**

```json
{
  "data": [
    {
      "id": "uuid",
      "model": "string",
      "generatedCount": "number",
      "acceptedUneditedCount": "number",
      "acceptedEditedCount": "number",
      "createdAt": "ISO 8601 timestamp"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

- **Success:** 200 OK
- **Errors:** 401 Unauthorized

### Flashcards

#### Create Flashcard

- **Method:** POST
- **Path:** `/api/flashcards`
- **Description:** Create a new flashcard (manual or from AI proposal)
- **Request Body:**

```json
{
  "front": "string (max 200 characters)",
  "back": "string (max 500 characters)",
  "source": "string (ai-full|ai-edited|manual)",
  "generationId": "uuid (optional, for AI-generated cards)"
}
```

- **Response Body:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "generationId": "uuid",
  "front": "string",
  "back": "string",
  "source": "string",
  "state": "number",
  "due": "ISO 8601 timestamp",
  "stability": "number",
  "difficulty": "number",
  "lapses": "number",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

- **Success:** 201 Created
- **Errors:** 400 Bad Request (validation errors), 401 Unauthorized, 409 Conflict (duplicate card)

#### List Flashcards

- **Method:** GET
- **Path:** `/api/flashcards`
- **Description:** List user's flashcards with pagination
- **Query Parameters:**
  - `page` (number, optional) - Page number (default: 1)
  - `limit` (number, optional) - Items per page (default: 25, max: 100)
  - `sort` (string, optional) - Sort field (createdAt, updatedAt, due) (default: createdAt)
  - `order` (string, optional) - Sort order (asc, desc) (default: desc)
  - `source` (string, optional) - Filter by source (ai-full|ai-edited|manual)
  - `state` (number, optional) - Filter by FSRS state (0-3)
- **Response Body:**

```json
{
  "data": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "source": "string",
      "state": "number",
      "due": "ISO 8601 timestamp",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

- **Success:** 200 OK
- **Errors:** 401 Unauthorized

#### Get Flashcard

- **Method:** GET
- **Path:** `/api/flashcards/{flashcardId}`
- **Description:** Retrieve a specific flashcard
- **Path Parameters:**
  - `flashcardId` (uuid) - ID of the flashcard
- **Response Body:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "generationId": "uuid",
  "front": "string",
  "back": "string",
  "source": "string",
  "state": "number",
  "due": "ISO 8601 timestamp",
  "stability": "number",
  "difficulty": "number",
  "lapses": "number",
  "reviewHistory": "array",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

- **Success:** 200 OK
- **Errors:** 404 Not Found, 401 Unauthorized

#### Update Flashcard

- **Method:** PUT
- **Path:** `/api/flashcards/{flashcardId}`
- **Description:** Update a flashcard's content
- **Path Parameters:**
  - `flashcardId` (uuid) - ID of the flashcard
- **Request Body:**

```json
{
  "front": "string (max 200 characters)",
  "back": "string (max 500 characters)"
}
```

- **Response Body:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "generationId": "uuid",
  "front": "string",
  "back": "string",
  "source": "string",
  "state": "number",
  "due": "ISO 8601 timestamp",
  "stability": "number",
  "difficulty": "number",
  "lapses": "number",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

- **Success:** 200 OK
- **Errors:** 400 Bad Request, 404 Not Found, 401 Unauthorized, 409 Conflict

#### Delete Flashcard

- **Method:** DELETE
- **Path:** `/api/flashcards/{flashcardId}`
- **Description:** Delete a flashcard
- **Path Parameters:**
  - `flashcardId` (uuid) - ID of the flashcard
- **Response Body:**

```json
{
  "message": "Flashcard deleted successfully"
}
```

- **Success:** 200 OK
- **Errors:** 404 Not Found, 401 Unauthorized

### Study Session

#### Get Study Session

- **Method:** GET
- **Path:** `/api/study-session`
- **Description:** Get flashcards due for review today
- **Query Parameters:**
  - `limit` (number, optional) - Maximum cards to return (default: 50, max: 100)
- **Response Body:**

```json
{
  "sessionId": "uuid",
  "cards": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "state": "number",
      "due": "ISO 8601 timestamp",
      "stability": "number",
      "difficulty": "number",
      "lapses": "number"
    }
  ],
  "totalDue": "number",
  "sessionStartedAt": "ISO 8601 timestamp"
}
```

- **Success:** 200 OK
- **Errors:** 401 Unauthorized, 404 Not Found (no cards due)

#### Submit Review

- **Method:** POST
- **Path:** `/api/study-session/review`
- **Description:** Submit review rating for a flashcard
- **Request Body:**

```json
{
  "flashcardId": "uuid",
  "rating": "number (1-4, where 1=Again, 2=Hard, 3=Good, 4=Easy)",
  "responseTime": "number (milliseconds, optional)"
}
```

- **Response Body:**

```json
{
  "flashcardId": "uuid",
  "newState": "number",
  "newDue": "ISO 8601 timestamp",
  "newStability": "number",
  "newDifficulty": "number",
  "newLapses": "number",
  "nextCard": {
    "id": "uuid",
    "front": "string",
    "state": "number",
    "due": "ISO 8601 timestamp"
  }
}
```

- **Success:** 200 OK
- **Errors:** 400 Bad Request, 404 Not Found, 401 Unauthorized

#### Complete Study Session

- **Method:** POST
- **Path:** `/api/study-session/complete`
- **Description:** Mark study session as completed
- **Request Body:**

```json
{
  "sessionId": "uuid",
  "completedAt": "ISO 8601 timestamp"
}
```

- **Response Body:**

```json
{
  "sessionId": "uuid",
  "cardsReviewed": "number",
  "sessionDuration": "number (milliseconds)",
  "completedAt": "ISO 8601 timestamp"
}
```

- **Success:** 200 OK
- **Errors:** 400 Bad Request, 404 Not Found, 401 Unauthorized

### Statistics

#### Get User Statistics

- **Method:** GET
- **Path:** `/api/statistics`
- **Description:** Get user's learning statistics
- **Query Parameters:**
  - `period` (string, optional) - Time period (7d, 30d, 90d, all) (default: 30d)
- **Response Body:**

```json
{
  "totalCards": "number",
  "cardsBySource": {
    "ai-full": "number",
    "ai-edited": "number",
    "manual": "number"
  },
  "cardsByState": {
    "new": "number",
    "learning": "number",
    "review": "number",
    "relearning": "number"
  },
  "dueToday": "number",
  "averageAccuracy": "number",
  "studyStreak": "number",
  "totalStudyTime": "number (minutes)",
  "period": "string"
}
```

- **Success:** 200 OK
- **Errors:** 401 Unauthorized

## 3. Authentication and Authorization

### Authentication Method

- **Supabase Auth JWT tokens** - All API endpoints require valid JWT token in Authorization header
- **Token Format:** `Bearer <jwt_token>`
- **Token Validation:** Server validates JWT signature and expiration
- **User Context:** User ID extracted from JWT token for RLS policies

### Authorization

- **Row-Level Security (RLS)** - All database operations filtered by authenticated user
- **User Isolation** - Users can only access their own data
- **Automatic Filtering** - Database queries automatically filtered by `auth.uid()`

### Token Management

- **Refresh Tokens** - Handled by Supabase Auth
- **Token Expiration** - Standard JWT expiration (configurable)
- **Logout** - Token invalidation handled by Supabase Auth

## 4. Validation and Business Logic

### Input Validation

#### Generation Session

- `sourceText`: Required, 1000-10000 characters, non-empty
- `model`: Optional, must be from allowed models list

#### Flashcard

- `front`: Required, max 200 characters, non-empty
- `back`: Required, max 500 characters, non-empty
- `source`: Required, must be one of: 'ai-full', 'ai-edited', 'manual'
- `generationId`: Optional, must exist if provided

#### Study Session Review

- `flashcardId`: Required, must exist and belong to user
- `rating`: Required, integer 1-4
- `responseTime`: Optional, positive number

### Business Logic Implementation

#### AI Generation Process

1. **Text Validation** - Validate input text length and content
2. **Hash Generation** - Create SHA-256 hash for deduplication
3. **AI API Call** - Send request to OpenRouter.ai with configured model
4. **Proposal Processing** - Parse AI response into structured proposals
5. **Session Tracking** - Record generation metadata and duration
6. **Error Handling** - Log errors to generation_error_logs table

#### Flashcard Management

1. **Duplicate Prevention** - Check for existing cards with same front/back
2. **Source Tracking** - Maintain audit trail of card origin
3. **FSRS Integration** - Initialize FSRS parameters for new cards
4. **Cascade Operations** - Handle generation deletion with SET NULL

#### Study Session Logic

1. **Due Card Selection** - Query cards where due <= now()
2. **FSRS Algorithm** - Apply Free Spaced Repetition Scheduler
3. **State Transitions** - Update card state based on rating
4. **Scheduling** - Calculate next review date using FSRS
5. **History Tracking** - Record review in JSONB review_history

#### Error Handling

1. **Validation Errors** - Return 400 with detailed field errors
2. **Authentication Errors** - Return 401 for invalid/missing tokens
3. **Authorization Errors** - Return 403 for insufficient permissions
4. **Not Found Errors** - Return 404 for missing resources
5. **Server Errors** - Return 500 with generic error message
6. **Rate Limiting** - Return 429 for too many requests

### Data Integrity

- **Foreign Key Constraints** - Enforced at database level
- **Unique Constraints** - Prevent duplicate flashcards per user
- **Check Constraints** - Validate data ranges and formats
- **Cascade Rules** - Maintain referential integrity on deletions
- **Transaction Safety** - Use database transactions for multi-step operations
