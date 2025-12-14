import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Generation,
  GenerationInsert,
  GenerationErrorLogInsert,
  FlashcardProposal,
  GenerateFlashcardsCommand,
} from "../../types";
import { TextUtils } from "../utils/text.utils";
import { createOpenRouterClient } from "./openrouter.client";

/**
 * Configuration for AI models
 */
const AI_MODELS = {
  "openai/gpt-4o-mini": {
    name: "GPT-4o Mini",
    maxTokens: 4000,
    temperature: 0.7,
  },
  "openai/gpt-4o": {
    name: "GPT-4o",
    maxTokens: 4000,
    temperature: 0.7,
  },
  "anthropic/claude-3-haiku": {
    name: "Claude 3 Haiku",
    maxTokens: 4000,
    temperature: 0.7,
  },
} as const;

type AIModel = keyof typeof AI_MODELS;

/**
 * Service for handling flashcard generation operations
 */
export class GenerationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new generation record in the database
   */
  async createGeneration(
    userId: string,
    sourceText: string,
    model: string
  ): Promise<{ generationId: string; error: Error | null }> {
    try {
      const sourceTextHash = TextUtils.generateTextHash(sourceText);
      const sanitizedText = TextUtils.sanitizeText(sourceText);

      const generationData: GenerationInsert = {
        user_id: userId,
        model,
        source_text_hash: sourceTextHash,
        source_text_length: sanitizedText.length,
        generated_count: 0,
      };

      const { data, error } = await this.supabase.from("generations").insert(generationData).select("id").single();

      if (error) {
        return { generationId: "", error: new Error(`Database error: ${error.message}`) };
      }

      return { generationId: data.id, error: null };
    } catch (error) {
      return {
        generationId: "",
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get generation by ID
   * RLS automatically filters by user_id, so we only need to check by id
   */
  async getGenerationById(
    generationId: string,
    userId: string
  ): Promise<{ generation: Generation | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from("generations")
        .select("*")
        .eq("id", generationId)
        .eq("user_id", userId)
        .single();

      if (error) {
        // If no rows found, return null generation (not an error)
        if (error.code === "PGRST116") {
          return { generation: null, error: null };
        }
        return { generation: null, error: new Error(`Database error: ${error.message}`) };
      }

      return { generation: data as Generation, error: null };
    } catch (error) {
      return {
        generation: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * List generations for a user with pagination and sorting
   * RLS automatically filters by user_id
   */
  async listGenerations(
    userId: string,
    options: {
      page: number;
      limit: number;
      sort: "createdAt" | "model";
      order: "asc" | "desc";
    }
  ): Promise<{
    data: Pick<
      Generation,
      "id" | "model" | "generated_count" | "accepted_unedited_count" | "accepted_edited_count" | "created_at"
    >[];
    total: number;
    error: Error | null;
  }> {
    try {
      // Map sort field from API format (camelCase) to database format (snake_case)
      const sortFieldMap: Record<"createdAt" | "model", string> = {
        createdAt: "created_at",
        model: "model",
      };
      const sortField = sortFieldMap[options.sort];

      // Build query with count
      const query = this.supabase
        .from("generations")
        .select("id,model,generated_count,accepted_unedited_count,accepted_edited_count,created_at", {
          count: "exact",
        })
        .eq("user_id", userId)
        .order(sortField, { ascending: options.order === "asc" })
        .range((options.page - 1) * options.limit, options.page * options.limit - 1);

      const { data, count, error } = await query;

      if (error) {
        return {
          data: [],
          total: 0,
          error: new Error(`Database error: ${error.message}`),
        };
      }

      return {
        data: data || [],
        total: count || 0,
        error: null,
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Convert PostgreSQL interval to ISO 8601 duration format
   * PostgreSQL interval format: "HH:MM:SS.microseconds" or "HH:MM:SS"
   * ISO 8601 duration format: "PT{n}S" where n is total seconds
   */
  convertIntervalToISO8601(interval: unknown | null): string | null {
    if (!interval) {
      return null;
    }

    // If already in ISO 8601 format, return as is
    if (typeof interval === "string" && interval.startsWith("PT")) {
      return interval;
    }

    // Parse PostgreSQL interval format: "HH:MM:SS.microseconds" or "HH:MM:SS"
    if (typeof interval !== "string") {
      return null;
    }

    const parts = interval.split(":");
    if (parts.length !== 3) {
      return null;
    }

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      return null;
    }

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    // Format as ISO 8601 duration: PT{n}S
    return `PT${totalSeconds}S`;
  }

  /**
   * Update generation record with results
   */
  async updateGenerationResults(
    generationId: string,
    generatedCount: number,
    duration: number
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from("generations")
        .update({
          generated_count: generatedCount,
          generation_duration: `PT${duration}S`, // ISO 8601 duration format
        })
        .eq("id", generationId);

      if (error) {
        return { error: new Error(`Database error: ${error.message}`) };
      }

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Increment accepted flashcard count for a generation
   * Updates either accepted_unedited_count or accepted_edited_count based on source
   */
  async incrementAcceptedCount(
    generationId: string,
    source: "ai-full" | "ai-edited"
  ): Promise<{ error: Error | null }> {
    try {
      // Determine which field to increment
      const fieldToUpdate = source === "ai-full" ? "accepted_unedited_count" : "accepted_edited_count";

      // Fetch current value, increment, and update
      // Select both fields to avoid TypeScript union type issues
      const { data: generation, error: fetchError } = await this.supabase
        .from("generations")
        .select("accepted_unedited_count, accepted_edited_count")
        .eq("id", generationId)
        .single();

      if (fetchError) {
        return { error: new Error(`Database error: ${fetchError.message}`) };
      }

      // Type-safe access to the field value
      const currentCount =
        fieldToUpdate === "accepted_unedited_count"
          ? (generation?.accepted_unedited_count ?? 0)
          : (generation?.accepted_edited_count ?? 0);
      const newCount = currentCount + 1;

      const updateData =
        fieldToUpdate === "accepted_unedited_count"
          ? { accepted_unedited_count: newCount }
          : { accepted_edited_count: newCount };

      const { error: updateError } = await this.supabase.from("generations").update(updateData).eq("id", generationId);

      if (updateError) {
        return { error: new Error(`Database error: ${updateError.message}`) };
      }

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Log generation error
   * Uses service role client to bypass RLS for reliable error logging
   */
  async logGenerationError(
    userId: string,
    model: string,
    sourceText: string,
    errorCode: string,
    errorMessage: string
  ): Promise<void> {
    try {
      const sourceTextHash = TextUtils.generateTextHash(sourceText);
      const sanitizedText = TextUtils.sanitizeText(sourceText);

      const errorLog: GenerationErrorLogInsert = {
        user_id: userId,
        model,
        source_text_hash: sourceTextHash,
        source_text_length: sanitizedText.length,
        error_code: errorCode,
        error_message: errorMessage,
      };

      // Use service role client to bypass RLS for error logging
      // This ensures errors are always logged even if RLS blocks the regular client
      const { getServerSupabaseClient } = await import("../../db/supabase.server");
      const serviceRoleClient = getServerSupabaseClient();

      const { error } = await serviceRoleClient.from("generation_error_logs").insert(errorLog);

      if (error) {
        // Log to console as fallback if database insert fails
        console.error("[GenerationService] Failed to log error to database:", error.message);
        console.error("[GenerationService] Error details:", {
          userId,
          model,
          errorCode,
          errorMessage: errorMessage.substring(0, 200), // Truncate long messages
        });
      }
    } catch (error) {
      // Error logging failed - log to console as fallback
      console.error("[GenerationService] Error logging failed:", error instanceof Error ? error.message : "Unknown error");
      console.error("[GenerationService] Error details:", {
        userId,
        model,
        errorCode,
        errorMessage: errorMessage.substring(0, 200),
      });
    }
  }

  /**
   * Generate flashcards using AI service
   */
  async generateFlashcards(
    command: GenerateFlashcardsCommand
  ): Promise<{ proposals: FlashcardProposal[]; error: Error | null }> {
    const startTime = Date.now();

    try {
      // Validate model
      if (!(command.model in AI_MODELS)) {
        const error = new Error(`Unsupported model: ${command.model}`);
        await this.logGenerationError(
          command.userId,
          command.model,
          command.sourceText,
          "UNSUPPORTED_MODEL",
          error.message
        );
        return {
          proposals: [],
          error,
        };
      }

      // Prepare prompt for AI
      const prompt = this.createFlashcardPrompt(command.sourceText);
      const modelConfig = AI_MODELS[command.model as AIModel];

      // Call AI service (OpenRouter API)
      const aiResponse = await this.callOpenRouterAPI(prompt, command.model, modelConfig);

      if (!aiResponse) {
        const error = new Error("Failed to get response from AI service");
        await this.logGenerationError(
          command.userId,
          command.model,
          command.sourceText,
          "AI_SERVICE_ERROR",
          error.message
        );
        return {
          proposals: [],
          error,
        };
      }

      // Parse AI response
      const proposals = TextUtils.parseFlashcardProposals(aiResponse);

      if (proposals.length === 0) {
        const error = new Error("No valid flashcard proposals generated");
        await this.logGenerationError(command.userId, command.model, command.sourceText, "NO_PROPOSALS", error.message);
        return {
          proposals: [],
          error,
        };
      }

      // Update generation record
      const duration = Math.round((Date.now() - startTime) / 1000);
      await this.updateGenerationResults(command.generationId, proposals.length, duration);

      return { proposals, error: null };
    } catch (error) {
      // Log error
      await this.logGenerationError(
        command.userId,
        command.model,
        command.sourceText,
        "GENERATION_ERROR",
        error instanceof Error ? error.message : "Unknown error"
      );

      return {
        proposals: [],
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Create optimized prompt for flashcard generation
   */
  private createFlashcardPrompt(sourceText: string): string {
    return `You are an expert educator creating flashcards from educational content. 

TASK: Generate 5-10 high-quality flashcards from the provided text.

REQUIREMENTS:
- Each flashcard should test understanding, not just memorization
- Front side: Clear, concise question or prompt (max 200 characters)
- Back side: Accurate, complete answer (max 500 characters)
- Confidence score: Rate your confidence in the accuracy (0.0-1.0)

FORMAT: Return ONLY a JSON array of objects with this structure:
[
  {
    "front": "Question or prompt",
    "back": "Answer or explanation", 
    "confidence": 0.95
  }
]

SOURCE TEXT:
${sourceText}

Generate flashcards that cover the most important concepts and test deep understanding.`;
  }

  /**
   * Call OpenRouter API (real implementation)
   */
  private async callOpenRouterAPI(
    prompt: string,
    model: string,
    config: (typeof AI_MODELS)[AIModel]
  ): Promise<string | null> {
    try {
      const client = createOpenRouterClient();

      const response = await client.createChatCompletion({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert educator creating flashcards from educational content. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
      });

      return response;
    } catch (error) {
      // OpenRouter API error - handled by error response

      // Log the error for debugging
      if (error instanceof Error) {
        throw new Error(`AI service error: ${error.message}`);
      }

      throw new Error("AI service error: Unknown error occurred");
    }
  }
}
