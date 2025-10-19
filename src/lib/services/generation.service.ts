import type { SupabaseClient } from "@supabase/supabase-js";
import type {
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
   * Log generation error
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

      await this.supabase.from("generation_error_logs").insert(errorLog);
    } catch (error) {
      // Log error silently in production, could be replaced with proper logging service
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to log generation error:", error);
      }
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
        return {
          proposals: [],
          error: new Error(`Unsupported model: ${command.model}`),
        };
      }

      // Prepare prompt for AI
      const prompt = this.createFlashcardPrompt(command.sourceText);
      const modelConfig = AI_MODELS[command.model as AIModel];

      // Call AI service (OpenRouter API)
      const aiResponse = await this.callOpenRouterAPI(prompt, command.model, modelConfig);

      if (!aiResponse) {
        return {
          proposals: [],
          error: new Error("Failed to get response from AI service"),
        };
      }

      // Parse AI response
      const proposals = TextUtils.parseFlashcardProposals(aiResponse);

      if (proposals.length === 0) {
        return {
          proposals: [],
          error: new Error("No valid flashcard proposals generated"),
        };
      }

      // Update generation record
      const duration = Math.round((Date.now() - startTime) / 1000);
      await this.updateGenerationResults(command.generationId, proposals.length, duration);

      return { proposals, error: null };
    } catch (error) {
      // Log error
      await this.logGenerationError(
        "", // userId will be filled by caller
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
      // Log error silently in production, could be replaced with proper logging service
      if (process.env.NODE_ENV === "development") {
        console.error("OpenRouter API error:", error);
      }

      // Log the error for debugging
      if (error instanceof Error) {
        throw new Error(`AI service error: ${error.message}`);
      }

      throw new Error("AI service error: Unknown error occurred");
    }
  }
}
