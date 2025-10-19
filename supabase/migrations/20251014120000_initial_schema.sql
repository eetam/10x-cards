-- =====================================================================
-- Migration: Initial Schema for 10xCards
-- =====================================================================
-- Purpose: Create core tables for flashcard application with AI generation
-- Tables affected: generations, flashcards, generation_error_logs
-- Dependencies: Supabase Auth (auth.users table)
-- Notes: 
--   - All tables use RLS for user data isolation
--   - Integrates with Supabase Auth via auth.uid()
--   - Implements FSRS algorithm fields in flashcards table
--   - Uses hash instead of full source text for privacy
-- =====================================================================

-- =====================================================================
-- TABLE: generations
-- =====================================================================
-- Purpose: Store metadata for each AI flashcard generation session
-- Relationships:
--   - Belongs to auth.users via user_id (CASCADE on delete)
--   - Has many flashcards (SET NULL on delete)
-- =====================================================================

create table generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model text not null,
  generated_count integer not null default 0 check (generated_count >= 0),
  accepted_unedited_count integer null check (accepted_unedited_count is null or accepted_unedited_count >= 0),
  accepted_edited_count integer null check (accepted_edited_count is null or accepted_edited_count >= 0),
  source_text_hash text not null,
  source_text_length integer not null check (source_text_length >= 1000 and source_text_length <= 10000),
  generation_duration interval null,
  created_at timestamp with time zone not null default now()
);

-- Enable Row Level Security for generations table
-- This ensures users can only access their own generation records
alter table generations enable row level security;

-- =====================================================================
-- RLS POLICIES: generations
-- =====================================================================
-- Strategy: Users can only access their own generation sessions
-- Uses auth.uid() to identify the currently authenticated user
-- =====================================================================

-- Policy: Allow authenticated users to view their own generation sessions
-- Rationale: Users need to see their generation history and metrics
-- Note: Uses (select auth.uid()) for optimal performance - evaluated once per query
create policy "Users can view their own generations"
  on generations
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: Allow authenticated users to create generation sessions for themselves
-- Rationale: Users initiate AI generation, creating new session records
-- Note: Uses (select auth.uid()) for optimal performance - evaluated once per query
create policy "Users can insert their own generations"
  on generations
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Policy: Allow authenticated users to update their own generation sessions
-- Rationale: Sessions are updated with metrics after generation completes
-- Note: Uses (select auth.uid()) for optimal performance - evaluated once per query
create policy "Users can update their own generations"
  on generations
  for update
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: Allow authenticated users to delete their own generation sessions
-- Rationale: Users may want to clean up their generation history
-- Note: Uses (select auth.uid()) for optimal performance - evaluated once per query
create policy "Users can delete their own generations"
  on generations
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- =====================================================================
-- INDEXES: generations
-- =====================================================================
-- Optimizations for common query patterns
-- =====================================================================

-- Optimize queries fetching generation sessions for specific user
-- Used in: generation history, user analytics
create index idx_generations_user_id on generations(user_id);

-- Optimize queries sorting sessions by creation date (most recent first)
-- Used in: generation history pagination, recent activity feeds
create index idx_generations_created_at on generations(created_at desc);

-- Optimize deduplication checks based on source text hash
-- Used in: preventing duplicate generations from same source text
create index idx_generations_source_text_hash on generations(source_text_hash);

-- Optimize AI model analytics queries
-- Used in: model performance comparison, cost analysis
create index idx_generations_model on generations(model);

-- Optimize analytics queries for generation duration (partial index)
-- Only indexes records where duration is not null (completed generations)
-- Used in: performance monitoring, SLA tracking, model comparison
create index idx_generations_duration on generations(generation_duration) 
  where generation_duration is not null;

-- =====================================================================
-- TABLE: flashcards
-- =====================================================================
-- Purpose: Store all flashcards (AI-generated and manual)
-- Relationships:
--   - Belongs to auth.users via user_id (CASCADE on delete)
--   - Optionally belongs to generations via generation_id (SET NULL on delete)
-- FSRS Algorithm: Implements Free Spaced Repetition Scheduler fields
-- =====================================================================

create table flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid null references generations(id) on delete set null,
  front varchar(200) not null,
  back varchar(500) not null,
  source varchar(10) not null check (source in ('ai-full', 'ai-edited', 'manual')),
  
  -- FSRS algorithm fields
  state smallint not null default 0,
  due timestamp with time zone not null default now(),
  stability real not null default 0,
  difficulty real not null default 0,
  lapses integer not null default 0,
  review_history jsonb not null default '[]',
  
  -- Timestamps
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  -- Ensure no duplicate flashcards for the same user
  -- Uniqueness based on content (front + back) per user
  unique (user_id, front, back)
);

-- Enable Row Level Security for flashcards table
-- This ensures users can only access their own flashcards
alter table flashcards enable row level security;

-- =====================================================================
-- RLS POLICIES: flashcards
-- =====================================================================
-- Strategy: Users have full CRUD access to their own flashcards only
-- Uses auth.uid() to identify the currently authenticated user
-- =====================================================================

-- Policy: Allow authenticated users to view their own flashcards
-- Rationale: Users need to see their flashcard collection and study materials
-- Note: Uses (select auth.uid()) for optimal performance - evaluated once per query
create policy "Users can view their own flashcards"
  on flashcards
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: Allow authenticated users to create flashcards for themselves
-- Rationale: Users can create manual flashcards or save AI-generated ones
-- Note: Uses (select auth.uid()) for optimal performance - evaluated once per query
create policy "Users can insert their own flashcards"
  on flashcards
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Policy: Allow authenticated users to update their own flashcards
-- Rationale: Users can edit content, update FSRS parameters during reviews
-- Note: Uses (select auth.uid()) for optimal performance - evaluated once per query
create policy "Users can update their own flashcards"
  on flashcards
  for update
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: Allow authenticated users to delete their own flashcards
-- Rationale: Users can remove flashcards from their collection
-- Note: Uses (select auth.uid()) for optimal performance - evaluated once per query
create policy "Users can delete their own flashcards"
  on flashcards
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- =====================================================================
-- INDEXES: flashcards
-- =====================================================================
-- Optimizations for common query patterns and FSRS algorithm
-- =====================================================================

-- Optimize queries fetching flashcards for specific user
-- Used in: flashcard list, collection browsing
create index idx_flashcards_user_id on flashcards(user_id);

-- Optimize queries fetching flashcards from specific generation session
-- Used in: reviewing AI-generated proposals, generation analytics
create index idx_flashcards_generation_id on flashcards(generation_id);

-- Optimize queries searching for flashcards due for review
-- Used in: study session preparation, due date sorting
create index idx_flashcards_due on flashcards(due);

-- Composite index for the most common use case: finding due flashcards for user
-- Used in: daily study session preparation (FR-016)
-- This is a critical performance optimization for the main app workflow
-- Note: Cannot use partial index with now() as it's not IMMUTABLE
-- The index covers all flashcards, query will filter by due <= now() at runtime
create index idx_flashcards_user_due on flashcards(user_id, due);

-- =====================================================================
-- TABLE: generation_error_logs
-- =====================================================================
-- Purpose: Log errors that occur during AI flashcard generation
-- Relationships:
--   - Belongs to auth.users via user_id (CASCADE on delete)
-- Note: No update or delete policies - logs are append-only for audit
-- =====================================================================

create table generation_error_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model text not null,
  source_text_hash text not null,
  source_text_length integer not null check (source_text_length >= 1000 and source_text_length <= 10000),
  error_code text null,
  error_message text null,
  created_at timestamp with time zone not null default now()
);

-- Enable Row Level Security for generation_error_logs table
-- This ensures users can only view their own error logs
alter table generation_error_logs enable row level security;

-- =====================================================================
-- RLS POLICIES: generation_error_logs
-- =====================================================================
-- Strategy: Users can view and create error logs for themselves
-- No update/delete - error logs are append-only for audit purposes
-- Uses auth.uid() to identify the currently authenticated user
-- =====================================================================

-- Policy: Allow authenticated users to view their own error logs
-- Rationale: Users can troubleshoot failed generation attempts
-- Note: Uses (select auth.uid()) for optimal performance - evaluated once per query
create policy "Users can view their own error logs"
  on generation_error_logs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: Allow authenticated users to create error logs for themselves
-- Rationale: Application logs errors during generation failures
-- Note: Uses (select auth.uid()) for optimal performance - evaluated once per query
create policy "Users can insert their own error logs"
  on generation_error_logs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- =====================================================================
-- INDEXES: generation_error_logs
-- =====================================================================
-- Optimizations for error analysis and monitoring
-- =====================================================================

-- Optimize queries fetching error logs for specific user
-- Used in: user error history, troubleshooting
create index idx_generation_error_logs_user_id on generation_error_logs(user_id);

-- Optimize queries sorting error logs by occurrence time (most recent first)
-- Used in: recent errors display, monitoring dashboards
create index idx_generation_error_logs_created_at on generation_error_logs(created_at desc);

-- Optimize AI model error analytics
-- Used in: model reliability comparison, identifying problematic models
create index idx_generation_error_logs_model on generation_error_logs(model);

-- Optimize error correlation with source text
-- Used in: identifying problematic source texts, deduplication
create index idx_generation_error_logs_source_hash on generation_error_logs(source_text_hash);

-- Optimize error grouping by error code (partial index)
-- Only indexes records where error_code is not null
-- Used in: error type analysis, grouping by error category
create index idx_generation_error_logs_error_code on generation_error_logs(error_code) 
  where error_code is not null;

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================

