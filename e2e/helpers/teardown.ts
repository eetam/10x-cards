/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";

export async function cleanupTestData() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  // Use service role key if available (bypasses RLS, faster and more reliable)
  // Fallback to anon key + auth if service role is not available
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.PUBLIC_SUPABASE_KEY;
  const testUserEmail = process.env.E2E_USERNAME;
  const testUserId = process.env.E2E_USERNAME_ID;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials not found in environment");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    let userId: string | undefined = testUserId;

    // If using anon key, we need to authenticate first
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_KEY) {
      if (!testUserEmail || !process.env.E2E_PASSWORD) {
        console.error("Test user credentials not found in environment (required for anon key cleanup)");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: process.env.E2E_PASSWORD,
      });

      if (signInError) {
        console.error("Error signing in for teardown:", signInError);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Error getting user for teardown:", userError);
        return;
      }

      userId = user.id;
    }

    if (!userId) {
      console.error("User ID not available for teardown");
      return;
    }

    console.log(`Starting teardown for user: ${userId}`);

    // First, check how many records exist before deletion
    const { count: flashcardsBeforeCount } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: generationsBeforeCount } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    console.log(
      `Found ${flashcardsBeforeCount || 0} flashcards and ${generationsBeforeCount || 0} generations to delete`
    );

    // Delete flashcards (will cascade to related data)
    const { error: flashcardsError } = await supabase.from("flashcards").delete().eq("user_id", userId);

    if (flashcardsError) {
      console.error("Error deleting flashcards:", flashcardsError);
    } else {
      console.log(`Deleted ${flashcardsBeforeCount || 0} flashcards`);
    }

    // Delete generations
    const { error: generationsError } = await supabase.from("generations").delete().eq("user_id", userId);

    if (generationsError) {
      console.error("Error deleting generations:", generationsError);
    } else {
      console.log(`Deleted ${generationsBeforeCount || 0} generations`);
    }

    // Sign out if we signed in
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_KEY) {
      await supabase.auth.signOut();
    }

    console.log("Teardown completed successfully");
  } catch (error) {
    // Don't throw - just log and continue with tests
    // Network errors shouldn't block test execution
    console.error("Unexpected error during teardown (continuing anyway):", error);
  }
}
