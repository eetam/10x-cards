import { EnvConfig } from "../config/env.config";

/**
 * OpenRouter API configuration
 */
interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  useMock: boolean;
}

/**
 * OpenRouter API request/response types
 */
interface OpenRouterRequest {
  model: string;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  max_tokens: number;
  temperature: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenRouterError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * OpenRouter API client
 */
export class OpenRouterClient {
  private config: OpenRouterConfig;

  constructor(config: OpenRouterConfig) {
    this.config = config;
  }

  /**
   * Generate mock flashcard response based on source text
   */
  private generateMockResponse(sourceText: string): string {
    // Extract key concepts from source text (simple keyword extraction)
    const words = sourceText
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .slice(0, 20); // Take first 20 meaningful words

    // Generate flashcards based on extracted concepts
    const flashcards = [];

    // Generate 3-5 flashcards
    const numCards = Math.floor(Math.random() * 3) + 3; // 3-5 cards

    for (let i = 0; i < numCards; i++) {
      const concept = words[i % words.length] || `concept${i + 1}`;
      const capitalizedConcept = concept.charAt(0).toUpperCase() + concept.slice(1);

      const frontTemplates = [
        `What is ${capitalizedConcept}?`,
        `Define ${capitalizedConcept}`,
        `Explain ${capitalizedConcept}`,
        `What does ${capitalizedConcept} mean?`,
        `Describe ${capitalizedConcept}`,
      ];

      const backTemplates = [
        `${capitalizedConcept} is a fundamental concept in this field that plays an important role in understanding the subject matter.`,
        `${capitalizedConcept} refers to a key principle that helps explain various phenomena and processes.`,
        `${capitalizedConcept} is an essential element that contributes to the overall understanding of the topic.`,
        `${capitalizedConcept} represents a core concept that is crucial for mastering this subject area.`,
      ];

      const front = frontTemplates[i % frontTemplates.length];
      const back = backTemplates[i % backTemplates.length];
      const confidence = 0.7 + Math.random() * 0.3; // 0.7-1.0

      flashcards.push({
        front,
        back,
        confidence: Math.round(confidence * 100) / 100,
      });
    }

    return JSON.stringify(flashcards);
  }

  /**
   * Create a chat completion request
   */
  async createChatCompletion(request: Omit<OpenRouterRequest, "model"> & { model: string }): Promise<string> {
    // Use mock response if enabled
    if (this.config.useMock) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Extract source text from the user message (assuming it's the last message)
      const userMessage = request.messages.find((msg) => msg.role === "user");
      const sourceText = userMessage?.content || "Sample text for flashcard generation";

      return this.generateMockResponse(sourceText);
    }

    const url = `${this.config.baseUrl}/chat/completions`;

    const requestBody: OpenRouterRequest = {
      model: request.model,
      messages: request.messages,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
      top_p: request.top_p,
      frequency_penalty: request.frequency_penalty,
      presence_penalty: request.presence_penalty,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://10x-cards.app", // Required by OpenRouter
          "X-Title": "10x Cards", // Optional but recommended
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: OpenRouterError = await response.json();
        throw new Error(`OpenRouter API error: ${errorData.error.message}`);
      }

      const data: OpenRouterResponse = await response.json();

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
  async testConnection(): Promise<boolean> {
    if (this.config.useMock) {
      // Simulate connection test delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      return true; // Mock always succeeds
    }

    try {
      await this.createChatCompletion({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: "Hello, this is a test message.",
          },
        ],
        max_tokens: 10,
        temperature: 0.1,
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Factory function to create OpenRouter client from environment variables
 */
export function createOpenRouterClient(): OpenRouterClient {
  const config = EnvConfig.getOpenRouterConfig();

  // Only require API key if not using mock
  if (!config.useMock && !config.apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required when not using mock mode");
  }

  return new OpenRouterClient(config);
}
