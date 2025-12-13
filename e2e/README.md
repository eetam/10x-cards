# E2E Tests - 10xCards

End-to-end tests using Playwright to verify user flows and business requirements from the PRD.

## Setup

### 1. Create Test Database

Create a new Supabase project for E2E tests at https://supabase.com/dashboard/projects

⚠️ **Important**: Keep your database password safe - you'll need it for migrations.

### 2. Configure Environment

Copy `.env.test.example` to `.env.test` and fill in your values:

```bash
cp .env.test.example .env.test
```

Update `.env.test` with:
- `SUPABASE_URL`: Your test project URL (from Supabase Dashboard → Connect)
- `PUBLIC_SUPABASE_KEY`: Your anon/public key
- `E2E_USERNAME`: Test user email (create manually in Supabase Dashboard → Authentication → Users)
- `E2E_PASSWORD`: Test user password
- `OPENROUTER_USE_MOCK=true`: Use mock AI responses for faster, deterministic tests

### 3. Create Test User

In Supabase Dashboard:
1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Create user with:
   - Email: (use this in `E2E_USERNAME`)
   - Password: (use this in `E2E_PASSWORD`)
4. Copy the user ID to `.env.test` as `E2E_USERNAME_ID`

### 4. Migrate Database Schema

Link your test project and apply migrations:

```bash
# Link to test database
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run in debug mode
```bash
npm run test:e2e:debug
```

## Test Structure

```
e2e/
├── pages/                  # Page Object Models (POMs)
│   ├── auth.page.ts
│   ├── generation.page.ts
│   └── proposals-review.page.ts
├── fixtures/               # Reusable test fixtures
│   └── auth.fixture.ts
├── helpers/                # Test helpers and utilities
│   ├── test-data.ts       # Sample texts for testing
│   └── teardown.ts        # Cleanup utilities
├── flashcard-generation.spec.ts  # Main test suite
└── global-teardown.ts     # Runs after all tests
```

## Test Coverage

### US-005: Generating Flashcard Proposals
- ✅ Generate proposals from valid source text (1000-10000 chars)
- ✅ Redirect to generation review page
- ✅ Display generated proposals

### US-006: Reviewing and Accepting Proposals
- ✅ Accept flashcard proposals
- ✅ Reject flashcard proposals
- ✅ Mixed acceptance and rejection
- ✅ Save all accepted proposals
- ✅ Redirect to flashcards page

## Data Cleanup

Test data is automatically cleaned up after each test run using global teardown:

1. Authenticates as test user
2. Deletes all flashcards created during tests
3. Deletes all generations created during tests

This ensures each test run starts with a clean state.

## Best Practices

1. **Use Page Object Models** - All page interactions should go through POMs
2. **Use Test IDs** - Components have `data-testid` attributes for stable selectors
3. **Mock AI When Possible** - Set `OPENROUTER_USE_MOCK=true` for faster tests
4. **Sequential Execution** - Tests run sequentially to avoid race conditions with shared test user
5. **Clean Up After Tests** - Global teardown removes test data automatically

## Troubleshooting

### Authentication Fails
- Verify `E2E_USERNAME` and `E2E_PASSWORD` in `.env.test`
- Check test user exists in Supabase Dashboard
- Ensure test user is confirmed (check email verification)

### Tests Timeout
- Increase timeout in `playwright.config.ts`
- Check if dev server is running (`npm run dev:e2e`)
- Verify network connectivity to Supabase

### RLS Errors
- Ensure migrations were applied: `supabase db push`
- Verify test user is authenticated in teardown
- Check RLS policies allow test user operations

## Adding New Tests

1. Add `data-testid` to new components
2. Create/update Page Object Model
3. Write test in `*.spec.ts` file
4. Use fixtures for authenticated sessions
5. Run tests and verify cleanup works

Example:

```typescript
import { test, expect, setupAuthenticatedSession } from "./fixtures/auth.fixture";

test.describe("New Feature", () => {
  test.beforeEach(async ({ authPage }) => {
    await setupAuthenticatedSession(authPage);
  });

  test("should do something", async ({ page }) => {
    // Your test here
  });
});
```
