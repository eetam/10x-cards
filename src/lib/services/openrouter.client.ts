import { EnvConfig } from "../config/env.config";

/**
 * OpenRouter API configuration
 */
interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
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
   * Create a chat completion request
   */
  async createChatCompletion(request: Omit<OpenRouterRequest, "model"> & { model: string }): Promise<string> {
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

  if (!config.apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  return new OpenRouterClient(config);
}
