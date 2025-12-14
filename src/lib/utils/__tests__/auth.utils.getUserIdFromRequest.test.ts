import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthUtils } from "../auth.utils";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Request } from "astro";

// Mock Supabase client
const createMockSupabase = () => {
  return {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
  } as unknown as SupabaseClient;
};

// Mock Request
const createMockRequest = (authHeader: string | null = null): Request => {
  const headers = new Headers();
  if (authHeader) {
    headers.set("authorization", authHeader);
  }

  return {
    headers,
  } as unknown as Request;
};

describe("AuthUtils.getUserIdFromRequest", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    vi.clearAllMocks();
  });

  it("should extract userId from Bearer token when token is valid", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = createMockRequest("Bearer valid-token");
    const result = await AuthUtils.getUserIdFromRequest(request, mockSupabase);

    expect(result.userId).toBe("user-123");
    expect(result.error).toBeNull();
    expect(mockSupabase.auth.getUser).toHaveBeenCalledWith("valid-token");
  });

  it("should return error when Bearer token is invalid", async () => {
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid token" },
    });

    const request = createMockRequest("Bearer invalid-token");
    const result = await AuthUtils.getUserIdFromRequest(request, mockSupabase);

    expect(result.userId).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe("UNAUTHORIZED");
  });

  it("should extract userId from session cookies when no Bearer token", async () => {
    const mockSession = {
      user: { id: "user-456", email: "test@example.com" },
      access_token: "session-token",
    };

    vi.mocked(mockSupabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const request = createMockRequest(null);
    const result = await AuthUtils.getUserIdFromRequest(request, mockSupabase);

    expect(result.userId).toBe("user-456");
    expect(result.error).toBeNull();
    expect(mockSupabase.auth.getSession).toHaveBeenCalled();
  });

  it("should return error when no token and no session", async () => {
    vi.mocked(mockSupabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const request = createMockRequest(null);
    const result = await AuthUtils.getUserIdFromRequest(request, mockSupabase);

    expect(result.userId).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe("UNAUTHORIZED");
    expect(result.error?.message).toBe("Authentication required");
  });

  it("should prioritize Bearer token over session cookies", async () => {
    const mockUser = { id: "user-from-token", email: "token@example.com" };
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = createMockRequest("Bearer token-priority");
    const result = await AuthUtils.getUserIdFromRequest(request, mockSupabase);

    expect(result.userId).toBe("user-from-token");
    expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    expect(mockSupabase.auth.getSession).not.toHaveBeenCalled();
  });

  it("should handle session with null user", async () => {
    vi.mocked(mockSupabase.auth.getSession).mockResolvedValue({
      data: { session: { user: null, access_token: "token" } },
      error: null,
    });

    const request = createMockRequest(null);
    const result = await AuthUtils.getUserIdFromRequest(request, mockSupabase);

    expect(result.userId).toBeNull();
    expect(result.error).toBeDefined();
  });

  it("should handle exceptions during token verification", async () => {
    vi.mocked(mockSupabase.auth.getUser).mockRejectedValue(new Error("Network error"));

    const request = createMockRequest("Bearer token");
    const result = await AuthUtils.getUserIdFromRequest(request, mockSupabase);

    expect(result.userId).toBeNull();
    expect(result.error).toBeDefined();
  });

  it("should handle exceptions during session retrieval", async () => {
    // Mock getSession to return error (not throw)
    vi.mocked(mockSupabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: { message: "Session error" },
    });

    const request = createMockRequest(null);
    const result = await AuthUtils.getUserIdFromRequest(request, mockSupabase);

    expect(result.userId).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe("UNAUTHORIZED");
  });
});
