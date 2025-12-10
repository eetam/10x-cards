-- =====================================================================
-- Migration: Fix FSRS defaults and add default test user
-- =====================================================================

-- Fix FSRS default values
ALTER TABLE "public"."flashcards"
  ALTER COLUMN "difficulty" SET DEFAULT 0.3,
  ALTER COLUMN "stability" SET DEFAULT 1.0;

-- Update existing flashcards with incorrect values (if any)
UPDATE flashcards
SET
  stability = 1.0,
  difficulty = 0.3
WHERE
  stability = 0
  AND difficulty = 0;

-- =====================================================================
-- Create default test user for local development
-- =====================================================================
-- This user ID matches DEFAULT_USER_ID in .env file
-- Only needed for local development with Supabase

DO $$
BEGIN
  -- Check if user already exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = '5a3e0f7e-ac4f-498d-b625-aa6dc1ac36be'
  ) THEN
    -- Insert default test user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      '5a3e0f7e-ac4f-498d-b625-aa6dc1ac36be',
      'authenticated',
      'authenticated',
      'test@example.com',
      '$2a$10$abcdefghijklmnopqrstuv', -- dummy hash
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;
