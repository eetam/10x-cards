import { apiClient } from "./client";
import { API_ENDPOINTS } from "./endpoints";

export interface AuthSessionResponse {
  user: {
    id: string;
    email?: string;
  } | null;
  isAuthenticated: boolean;
}

/**
 * Get current authentication session
 * @returns Auth session response with user info and authentication status
 */
export async function getAuthSession(): Promise<AuthSessionResponse> {
  return apiClient.get<AuthSessionResponse>(API_ENDPOINTS.authSession);
}
