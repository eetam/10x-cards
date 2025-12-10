globalThis.process ??= {}; globalThis.process.env ??= {};
import { createHash } from 'crypto';
import { E as EnvConfig } from './auth.utils_D1pWbdx5.mjs';

const TextUtils = {
  /**
   * Generate SHA-256 hash of source text for deduplication
   */
  generateTextHash(text) {
    return createHash("sha256").update(text.trim()).digest("hex");
  },
  /**
   * Sanitize source text by removing potentially harmful characters
   */
  sanitizeText(text) {
    return text.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\s+/g, " ").substring(0, 1e4);
  },
  /**
   * Validate flashcard proposal structure
   */
  validateFlashcardProposal(proposal) {
    if (typeof proposal !== "object" || proposal === null) {
      return false;
    }
    const p = proposal;
    return typeof p.front === "string" && p.front.length > 0 && p.front.length <= 200 && typeof p.back === "string" && p.back.length > 0 && p.back.length <= 500 && typeof p.confidence === "number" && p.confidence >= 0 && p.confidence <= 1;
  },
  /**
   * Parse AI response and extract flashcard proposals
   */
  parseFlashcardProposals(aiResponse) {
    try {
      const parsed = JSON.parse(aiResponse);
      if (Array.isArray(parsed)) {
        return parsed.filter(this.validateFlashcardProposal);
      }
      if (typeof parsed === "object") {
        const proposals = parsed.proposals || parsed.flashcards || parsed.cards || parsed.data;
        if (Array.isArray(proposals)) {
          return proposals.filter(this.validateFlashcardProposal);
        }
      }
      return [];
    } catch {
      return this.extractProposalsFromText(aiResponse);
    }
  },
  /**
   * Extract flashcard proposals from unstructured text
   */
  extractProposalsFromText(text) {
    const proposals = [];
    const patterns = [
      /Q:\s*(.+?)\s*A:\s*(.+?)(?=\n|$)/gi,
      /Front:\s*(.+?)\s*Back:\s*(.+?)(?=\n|$)/gi,
      /Question:\s*(.+?)\s*Answer:\s*(.+?)(?=\n|$)/gi
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const front = match[1].trim();
        const back = match[2].trim();
        if (front.length > 0 && front.length <= 200 && back.length > 0 && back.length <= 500) {
          proposals.push({
            front,
            back,
            confidence: 0.8
            // Default confidence for extracted proposals
          });
        }
      }
    }
    return proposals;
  }
};

class OpenRouterClient {
  config;
  constructor(config) {
    this.config = config;
  }
  /**
   * Generate mock flashcard response based on source text
   */
  generateMockResponse(sourceText) {
    const words = sourceText.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((word) => word.length > 4).slice(0, 20);
    const flashcards = [];
    const numCards = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < numCards; i++) {
      const concept = words[i % words.length] || `concept${i + 1}`;
      const capitalizedConcept = concept.charAt(0).toUpperCase() + concept.slice(1);
      const frontTemplates = [
        `What is ${capitalizedConcept}?`,
        `Define ${capitalizedConcept}`,
        `Explain ${capitalizedConcept}`,
        `What does ${capitalizedConcept} mean?`,
        `Describe ${capitalizedConcept}`
      ];
      const backTemplates = [
        `${capitalizedConcept} is a fundamental concept in this field that plays an important role in understanding the subject matter.`,
        `${capitalizedConcept} refers to a key principle that helps explain various phenomena and processes.`,
        `${capitalizedConcept} is an essential element that contributes to the overall understanding of the topic.`,
        `${capitalizedConcept} represents a core concept that is crucial for mastering this subject area.`
      ];
      const front = frontTemplates[i % frontTemplates.length];
      const back = backTemplates[i % backTemplates.length];
      const confidence = 0.7 + Math.random() * 0.3;
      flashcards.push({
        front,
        back,
        confidence: Math.round(confidence * 100) / 100
      });
    }
    return JSON.stringify(flashcards);
  }
  /**
   * Create a chat completion request
   */
  async createChatCompletion(request) {
    if (this.config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 1e3 + Math.random() * 2e3));
      const userMessage = request.messages.find((msg) => msg.role === "user");
      const sourceText = userMessage?.content || "Sample text for flashcard generation";
      return this.generateMockResponse(sourceText);
    }
    const url = `${this.config.baseUrl}/chat/completions`;
    const requestBody = {
      model: request.model,
      messages: request.messages,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
      top_p: request.top_p,
      frequency_penalty: request.frequency_penalty,
      presence_penalty: request.presence_penalty
    };
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://10x-cards.app",
          // Required by OpenRouter
          "X-Title": "10x Cards"
          // Optional but recommended
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter API error: ${errorData.error.message}`);
      }
      const data = await response.json();
      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response choices returned from OpenRouter API");
      }
      return data.choices[0].message.content;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("OpenRouter API request timed out");
        }
        throw error;
      }
      throw new Error("Unknown error occurred while calling OpenRouter API");
    }
  }
  /**
   * Test API connection
   */
  async testConnection() {
    if (this.config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return true;
    }
    try {
      await this.createChatCompletion({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: "Hello, this is a test message."
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      });
      return true;
    } catch {
      return false;
    }
  }
}
function createOpenRouterClient() {
  const config = EnvConfig.getOpenRouterConfig();
  if (!config.useMock && !config.apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required when not using mock mode");
  }
  return new OpenRouterClient(config);
}

const AI_MODELS = {
  "openai/gpt-4o-mini": {
    name: "GPT-4o Mini",
    maxTokens: 4e3,
    temperature: 0.7
  },
  "openai/gpt-4o": {
    name: "GPT-4o",
    maxTokens: 4e3,
    temperature: 0.7
  },
  "anthropic/claude-3-haiku": {
    name: "Claude 3 Haiku",
    maxTokens: 4e3,
    temperature: 0.7
  }
};
class GenerationService {
  constructor(supabase) {
    this.supabase = supabase;
  }
  /**
   * Create a new generation record in the database
   */
  async createGeneration(userId, sourceText, model) {
    try {
      const sourceTextHash = TextUtils.generateTextHash(sourceText);
      const sanitizedText = TextUtils.sanitizeText(sourceText);
      const generationData = {
        user_id: userId,
        model,
        source_text_hash: sourceTextHash,
        source_text_length: sanitizedText.length,
        generated_count: 0
      };
      const { data, error } = await this.supabase.from("generations").insert(generationData).select("id").single();
      if (error) {
        return { generationId: "", error: new Error(`Database error: ${error.message}`) };
      }
      return { generationId: data.id, error: null };
    } catch (error) {
      return {
        generationId: "",
        error: error instanceof Error ? error : new Error("Unknown error")
      };
    }
  }
  /**
   * Get generation by ID
   * RLS automatically filters by user_id, so we only need to check by id
   */
  async getGenerationById(generationId, userId) {
    try {
      const { data, error } = await this.supabase.from("generations").select("*").eq("id", generationId).eq("user_id", userId).single();
      if (error) {
        if (error.code === "PGRST116") {
          return { generation: null, error: null };
        }
        return { generation: null, error: new Error(`Database error: ${error.message}`) };
      }
      return { generation: data, error: null };
    } catch (error) {
      return {
        generation: null,
        error: error instanceof Error ? error : new Error("Unknown error")
      };
    }
  }
  /**
   * List generations for a user with pagination and sorting
   * RLS automatically filters by user_id
   */
  async listGenerations(userId, options) {
    try {
      const sortFieldMap = {
        createdAt: "created_at",
        model: "model"
      };
      const sortField = sortFieldMap[options.sort];
      const query = this.supabase.from("generations").select("id,model,generated_count,accepted_unedited_count,accepted_edited_count,created_at", {
        count: "exact"
      }).eq("user_id", userId).order(sortField, { ascending: options.order === "asc" }).range((options.page - 1) * options.limit, options.page * options.limit - 1);
      const { data, count, error } = await query;
      if (error) {
        return {
          data: [],
          total: 0,
          error: new Error(`Database error: ${error.message}`)
        };
      }
      return {
        data: data || [],
        total: count || 0,
        error: null
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        error: error instanceof Error ? error : new Error("Unknown error")
      };
    }
  }
  /**
   * Convert PostgreSQL interval to ISO 8601 duration format
   * PostgreSQL interval format: "HH:MM:SS.microseconds" or "HH:MM:SS"
   * ISO 8601 duration format: "PT{n}S" where n is total seconds
   */
  convertIntervalToISO8601(interval) {
    if (!interval) {
      return null;
    }
    if (typeof interval === "string" && interval.startsWith("PT")) {
      return interval;
    }
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
    return `PT${totalSeconds}S`;
  }
  /**
   * Update generation record with results
   */
  async updateGenerationResults(generationId, generatedCount, duration) {
    try {
      const { error } = await this.supabase.from("generations").update({
        generated_count: generatedCount,
        generation_duration: `PT${duration}S`
        // ISO 8601 duration format
      }).eq("id", generationId);
      if (error) {
        return { error: new Error(`Database error: ${error.message}`) };
      }
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error("Unknown error")
      };
    }
  }
  /**
   * Increment accepted flashcard count for a generation
   * Updates either accepted_unedited_count or accepted_edited_count based on source
   */
  async incrementAcceptedCount(generationId, source) {
    try {
      const fieldToUpdate = source === "ai-full" ? "accepted_unedited_count" : "accepted_edited_count";
      const { data: generation, error: fetchError } = await this.supabase.from("generations").select("accepted_unedited_count, accepted_edited_count").eq("id", generationId).single();
      if (fetchError) {
        return { error: new Error(`Database error: ${fetchError.message}`) };
      }
      const currentCount = fieldToUpdate === "accepted_unedited_count" ? generation?.accepted_unedited_count ?? 0 : generation?.accepted_edited_count ?? 0;
      const newCount = currentCount + 1;
      const updateData = fieldToUpdate === "accepted_unedited_count" ? { accepted_unedited_count: newCount } : { accepted_edited_count: newCount };
      const { error: updateError } = await this.supabase.from("generations").update(updateData).eq("id", generationId);
      if (updateError) {
        return { error: new Error(`Database error: ${updateError.message}`) };
      }
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error("Unknown error")
      };
    }
  }
  /**
   * Log generation error
   */
  async logGenerationError(userId, model, sourceText, errorCode, errorMessage) {
    try {
      const sourceTextHash = TextUtils.generateTextHash(sourceText);
      const sanitizedText = TextUtils.sanitizeText(sourceText);
      const errorLog = {
        user_id: userId,
        model,
        source_text_hash: sourceTextHash,
        source_text_length: sanitizedText.length,
        error_code: errorCode,
        error_message: errorMessage
      };
      await this.supabase.from("generation_error_logs").insert(errorLog);
    } catch {
    }
  }
  /**
   * Generate flashcards using AI service
   */
  async generateFlashcards(command) {
    const startTime = Date.now();
    try {
      if (!(command.model in AI_MODELS)) {
        return {
          proposals: [],
          error: new Error(`Unsupported model: ${command.model}`)
        };
      }
      const prompt = this.createFlashcardPrompt(command.sourceText);
      const modelConfig = AI_MODELS[command.model];
      const aiResponse = await this.callOpenRouterAPI(prompt, command.model, modelConfig);
      if (!aiResponse) {
        return {
          proposals: [],
          error: new Error("Failed to get response from AI service")
        };
      }
      const proposals = TextUtils.parseFlashcardProposals(aiResponse);
      if (proposals.length === 0) {
        return {
          proposals: [],
          error: new Error("No valid flashcard proposals generated")
        };
      }
      const duration = Math.round((Date.now() - startTime) / 1e3);
      await this.updateGenerationResults(command.generationId, proposals.length, duration);
      return { proposals, error: null };
    } catch (error) {
      await this.logGenerationError(
        command.userId,
        command.model,
        command.sourceText,
        "GENERATION_ERROR",
        error instanceof Error ? error.message : "Unknown error"
      );
      return {
        proposals: [],
        error: error instanceof Error ? error : new Error("Unknown error")
      };
    }
  }
  /**
   * Create optimized prompt for flashcard generation
   */
  createFlashcardPrompt(sourceText) {
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
  async callOpenRouterAPI(prompt, model, config) {
    try {
      const client = createOpenRouterClient();
      const response = await client.createChatCompletion({
        model,
        messages: [
          {
            role: "system",
            content: "You are an expert educator creating flashcards from educational content. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`AI service error: ${error.message}`);
      }
      throw new Error("AI service error: Unknown error occurred");
    }
  }
}

export { GenerationService as G, TextUtils as T };
