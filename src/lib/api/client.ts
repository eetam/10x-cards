import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { ApiResponse } from "../../types";

/**
 * API client error class
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * Get Supabase client for browser (optional)
 * Used to retrieve JWT tokens for API requests
 * Requires PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY
 */
function getSupabaseClient() {
  if (typeof window === "undefined") {
    return null;
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * Get authorization token from Supabase session
 * Returns null if Supabase client is not available (API will handle DEFAULT_USER_ID on server)
 */
async function getAuthToken(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) {
    // If Supabase client is not available, return null
    // API endpoints will handle DEFAULT_USER_ID on server-side
    return null;
  }

  const {
    data: { session },
  } = await client.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Central API client with automatic JWT token injection
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    // In Astro, we can use relative URLs for API routes
    this.baseUrl = "";
  }

  /**
   * Make a request with automatic token injection
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await getAuthToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        if (!response.ok) {
          throw new ApiClientError(`Request failed with status ${response.status}`, response.status);
        }
        return {} as T;
      }

      const data: ApiResponse<T> = await response.json();

      if (!response.ok || !data.success) {
        const error = data.success === false ? data.error : null;
        throw new ApiClientError(
          error?.message ?? `Request failed with status ${response.status}`,
          response.status,
          error?.code
        );
      }

      return data.data;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof Error) {
        // Network errors
        if (error.message === "Failed to fetch" || error.name === "TypeError") {
          throw new ApiClientError("Network error. Please check your connection.", 0, "NETWORK_ERROR");
        }
        throw new ApiClientError(error.message, 0, "UNKNOWN_ERROR");
      }

      throw new ApiClientError("An unknown error occurred", 0, "UNKNOWN_ERROR");
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
