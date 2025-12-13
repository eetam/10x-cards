import { createClient } from "@supabase/supabase-js";

/**
 * Teardown helper for cleaning up test data after E2E tests
 * Removes flashcards and generations created during test runs
 */

/**
 * Clean up test data from Supabase
 * Should be called in global teardown or after test suite
 */
export async function cleanupTestData() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;
  const testUserEmail = process.env.E2E_USERNAME;
  const testUserPassword = process.env.E2E_PASSWORD;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials not found in environment");
    return;
  }

  if (!testUserEmail || !testUserPassword) {
    console.error("Test user credentials not found in environment");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Sign in as test user to authenticate for RLS
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    });

    if (signInError) {
      console.error("Error signing in for teardown:", signInError);
      throw signInError;
    }

    // Get test user ID
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error getting user for teardown:", userError);
      return;
    }

    console.log(`Starting teardown for user: ${user.id}`);

    // Delete flashcards (will cascade to related data)
    const { error: flashcardsError, count: flashcardsCount } = await supabase
      .from("flashcards")
      .delete()
      .eq("user_id", user.id);

    if (flashcardsError) {
      console.error("Error deleting flashcards:", flashcardsError);
    } else {
      console.log(`Deleted ${flashcardsCount || 0} flashcards`);
    }

    // Delete generations
    const { error: generationsError, count: generationsCount } = await supabase
      .from("generations")
      .delete()
      .eq("user_id", user.id);

    if (generationsError) {
      console.error("Error deleting generations:", generationsError);
    } else {
      console.log(`Deleted ${generationsCount || 0} generations`);
    }

    // Sign out
    await supabase.auth.signOut();

    console.log("Teardown completed successfully");
  } catch (error) {
    console.error("Unexpected error during teardown:", error);
  }
}
