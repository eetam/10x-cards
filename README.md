# 10xCards

An AI-powered flashcard generation application that streamlines the creation of educational flashcards using spaced repetition methodology. Transform any text into effective learning materials in seconds.

## Table of Contents

- [Description](#description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Description

10xCards is a web application designed to solve the time-consuming problem of manual flashcard creation. By leveraging AI technology, it automates the generation of high-quality flashcards from any text input, allowing users to focus on learning rather than preparation.

### Key Features

- **AI-Powered Generation**: Paste text (1,000-10,000 characters) and let AI create flashcards automatically
- **Smart Review System**: Uses FSRS (Free Spaced Repetition Scheduler) algorithm - simplified implementation for optimal learning
- **Flexible Management**: Accept, edit, or reject AI-generated suggestions
- **Manual Creation**: Create custom flashcards manually when needed
- **User Account Management**: Secure authentication with email/password
- **Learning Sessions**: Dedicated interface for daily review sessions

### Success Metrics

- **MS-01**: 75% of AI-generated flashcards accepted by users (directly or after editing)
- **MS-02**: 75% of all new flashcards created using AI assistance

## Tech Stack

### Frontend

- **[Astro 5](https://astro.build/)** - Fast, content-focused web framework with minimal JavaScript
- **[React 19](https://react.dev/)** - Interactive UI components
- **[TypeScript 5](https://www.typescriptlang.org/)** - Static type checking and enhanced IDE support
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com/)** - Accessible and customizable component library

### Backend

- **[Supabase](https://supabase.com/)** - Complete backend solution providing:
  - PostgreSQL database
  - Backend-as-a-Service SDK
  - Built-in user authentication
  - Open-source and self-hostable

### AI Integration

- **[OpenRouter.ai](https://openrouter.ai/)** - Unified API for multiple AI models:
  - Access to OpenAI, Anthropic, Google, and other providers
  - Cost optimization through model selection
  - Built-in spending limits

### CI/CD & Hosting

- **GitHub Actions** - Automated CI/CD pipelines
- **Cloudflare Pages** - Production hosting via Cloudflare Workers/Pages

## Getting Started Locally

### Prerequisites

- **Node.js**: Version 22.14.0 (use [nvm](https://github.com/nvm-sh/nvm) to manage Node versions)
- **npm**: Comes bundled with Node.js

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/10x-cards.git
   cd 10x-cards
   ```

2. **Use the correct Node.js version**

   ```bash
   nvm use
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Server-side Supabase credentials (for API routes and middleware)
   SUPABASE_URL=http://127.0.0.1:54321
   SUPABASE_KEY=your-supabase-service-role-key

   # Public Supabase credentials (for client-side auth session persistence)
   # REQUIRED for authentication to work - allows Supabase client to persist sessions
   PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   PUBLIC_SUPABASE_KEY=your-supabase-anon-key

   # OpenRouter.ai Configuration
   OPENROUTER_API_KEY=your_openrouter_api_key

   # Optional: Use mock responses instead of real API calls (for development)
   OPENROUTER_USE_MOCK=true

   # Optional: Service role key (bypasses RLS, used for admin operations)
   # Only needed if you use DEFAULT_USER_ID or need to bypass RLS
   # SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Optional: Default user ID for development (bypasses auth)
   # DEFAULT_USER_ID=your-test-user-uuid
   ```

   **Finding your Supabase keys:**

   If you're running Supabase locally with Docker:

   ```bash
   # Check your Supabase logs or Studio
   # Default local keys (if using standard Supabase local setup):
   # - anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeJeaUCuOmfHB4wWQiDxOTWnhgOFRFXGCBA
   # - service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
   ```

   If using Supabase Cloud, find your keys at: https://app.supabase.com/project/YOUR_PROJECT/settings/api

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to `http://localhost:4321` to see the application running.

## Available Scripts

| Script                   | Description                                  |
| ------------------------ | -------------------------------------------- |
| `npm run dev`            | Start the development server with hot reload |
| `npm run build`          | Build the production-ready application       |
| `npm run preview`        | Preview the production build locally         |
| `npm run lint`           | Run ESLint to check code quality             |
| `npm run lint:fix`       | Automatically fix ESLint errors              |
| `npm run format`         | Format code using Prettier                   |
| `npm run astro`          | Run Astro CLI commands                       |
| `npm run test`           | Run unit tests with Vitest (watch mode)      |
| `npm run test:run`       | Run unit tests once                          |
| `npm run test:ui`        | Run unit tests with UI                       |
| `npm run test:e2e`       | Run E2E tests with Playwright                |
| `npm run test:e2e:ui`    | Run E2E tests with Playwright UI             |
| `npm run test:e2e:debug` | Run E2E tests in debug mode                  |

### Development Workflow

The project includes pre-commit hooks via Husky and lint-staged to ensure code quality:

- TypeScript/TSX/Astro files are automatically linted
- JSON/CSS/Markdown files are automatically formatted

### Testing

The project includes both unit tests (Vitest) and E2E tests (Playwright):

- **Unit Tests**: Located in `src/` with `*.test.ts` or `*.spec.ts` files
- **E2E Tests**: Located in `e2e/` directory, see [e2e/README.md](e2e/README.md) for setup instructions

## Project Scope

### MVP Features (In Scope)

#### User Account Management

- ✅ Registration via email/password
- ✅ User login/logout
- ✅ Password change functionality
- ✅ Account deletion

#### AI-Powered Flashcard Generation

- ✅ Text input (1,000-10,000 characters)
- ✅ AI analysis and flashcard proposal generation
- ✅ Review interface with Accept/Edit/Reject options
- ✅ Automatic language detection
- ✅ Bulk save of accepted flashcards

#### Manual Flashcard Management

- ✅ Create flashcards manually
- ✅ View all flashcards (paginated, 25 per page)
- ✅ Edit existing flashcards
- ✅ Delete flashcards with confirmation

#### Spaced Repetition Learning

- ✅ FSRS algorithm integration (simplified version for MVP)
- ✅ Daily review sessions
- ✅ Flashcard rating system
- ✅ Session summary

### Out of Scope (Post-MVP)

- ❌ Custom spaced repetition algorithm
- ❌ File imports (PDF, DOCX, etc.)
- ❌ Flashcard set sharing
- ❌ Third-party platform integrations
- ❌ Mobile applications
- ❌ Multiple deck support

## Project Status

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Version](https://img.shields.io/badge/version-0.0.1-blue)

**Current Phase**: MVP Development

This project is actively under development. The core features outlined in the PRD are being implemented incrementally.

### Roadmap

- [x] User authentication system
- [x] AI flashcard generation
- [x] Manual flashcard CRUD operations
- [x] FSRS integration
- [x] Learning session interface
- [x] E2E testing setup
- [x] Unit testing setup
- [x] Production deployment

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for learners everywhere**
