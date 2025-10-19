import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthUtils } from "../auth.utils";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    admin: {
      getUserById: vi.fn(),
    },
  },
} as unknown as SupabaseClient;

describe("AuthUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractBearerToken", () => {
    it("should extract token from valid Bearer header", () => {
      const token = AuthUtils.extractBearerToken("Bearer abc123");
      expect(token).toBe("abc123");
    });

    it("should return null for invalid header", () => {
      expect(AuthUtils.extractBearerToken("Invalid header")).toBeNull();
      expect(AuthUtils.extractBearerToken("Basic abc123")).toBeNull();
      expect(AuthUtils.extractBearerToken(null)).toBeNull();
      expect(AuthUtils.extractBearerToken("")).toBeNull();
    });

    it("should handle token with spaces", () => {
      const token = AuthUtils.extractBearerToken("Bearer token with spaces");
      expect(token).toBe("token with spaces");
    });
  });

  describe("verifyToken", () => {
    it("should return user for valid token", async () => {
      const mockUser = { id: "user123", email: "test@example.com" };
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await AuthUtils.verifyToken(mockSupabase, "valid-token");

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith("valid-token");
    });

    it("should return error for invalid token", async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid token" },
      });

      const result = await AuthUtils.verifyToken(mockSupabase, "invalid-token");

      expect(result.user).toBeNull();
      expect(result.error).toEqual({
        message: "Invalid or expired token",
        code: "UNAUTHORIZED",
      });
    });

    it("should return error when no user is returned", async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await AuthUtils.verifyToken(mockSupabase, "token");

      expect(result.user).toBeNull();
      expect(result.error).toEqual({
        message: "Invalid or expired token",
        code: "UNAUTHORIZED",
      });
    });

    it("should handle exceptions", async () => {
      vi.mocked(mockSupabase.auth.getUser).mockRejectedValue(new Error("Network error"));

      const result = await AuthUtils.verifyToken(mockSupabase, "token");

      expect(result.user).toBeNull();
      expect(result.error).toEqual({
        message: "Authentication verification failed",
        code: "AUTH_ERROR",
      });
    });
  });

  describe("checkGenerationPermission", () => {
    it("should allow verified user", async () => {
      const mockUser = {
        id: "user123",
        email_confirmed_at: "2023-01-01T00:00:00Z",
      };
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await AuthUtils.checkGenerationPermission(mockSupabase, "user123");

      expect(result.allowed).toBe(true);
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.admin.getUserById).toHaveBeenCalledWith("user123");
    });

    it("should deny unverified user", async () => {
      const mockUser = {
        id: "user123",
        email_confirmed_at: null,
      };
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await AuthUtils.checkGenerationPermission(mockSupabase, "user123");

      expect(result.allowed).toBe(false);
      expect(result.error).toEqual({
        message: "User account not verified",
        code: "ACCOUNT_NOT_VERIFIED",
      });
    });

    it("should deny when user not found", async () => {
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: { message: "User not found" },
      });

      const result = await AuthUtils.checkGenerationPermission(mockSupabase, "user123");

      expect(result.allowed).toBe(false);
      expect(result.error).toEqual({
        message: "User account not verified",
        code: "ACCOUNT_NOT_VERIFIED",
      });
    });

    it("should handle exceptions", async () => {
      vi.mocked(mockSupabase.auth.admin.getUserById).mockRejectedValue(new Error("Database error"));

      const result = await AuthUtils.checkGenerationPermission(mockSupabase, "user123");

      expect(result.allowed).toBe(false);
      expect(result.error).toEqual({
        message: "Permission check failed",
        code: "PERMISSION_ERROR",
      });
    });
  });
});
