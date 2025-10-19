import { describe, it, expect } from "vitest";
import { ResponseUtils } from "../response.utils";

describe("ResponseUtils", () => {
  describe("createErrorResponse", () => {
    it("should create error response with all fields", () => {
      const response = ResponseUtils.createErrorResponse("Test error message", "TEST_ERROR", 400, "testField");

      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      return response.json().then((data) => {
        expect(data).toEqual({
          error: {
            message: "Test error message",
            code: "TEST_ERROR",
            field: "testField",
          },
          success: false,
        });
      });
    });

    it("should create error response without field", () => {
      const response = ResponseUtils.createErrorResponse("Test error message", "TEST_ERROR", 500);

      expect(response.status).toBe(500);

      return response.json().then((data) => {
        expect(data.error.field).toBeUndefined();
      });
    });
  });

  describe("createSuccessResponse", () => {
    it("should create success response with default status", () => {
      const testData = { id: "123", name: "Test" };
      const response = ResponseUtils.createSuccessResponse(testData);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      return response.json().then((data) => {
        expect(data).toEqual({
          data: testData,
          success: true,
        });
      });
    });

    it("should create success response with custom status", () => {
      const testData = { id: "123" };
      const response = ResponseUtils.createSuccessResponse(testData, 201);

      expect(response.status).toBe(201);

      return response.json().then((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toEqual(testData);
      });
    });
  });

  describe("createValidationErrorResponse", () => {
    it("should create validation error response", () => {
      const response = ResponseUtils.createValidationErrorResponse("Invalid input", "sourceText");

      expect(response.status).toBe(400);

      return response.json().then((data) => {
        expect(data.error).toEqual({
          message: "Invalid input",
          code: "VALIDATION_ERROR",
          field: "sourceText",
        });
        expect(data.success).toBe(false);
      });
    });
  });

  describe("createAuthErrorResponse", () => {
    it("should create auth error response with default message", () => {
      const response = ResponseUtils.createAuthErrorResponse();

      expect(response.status).toBe(401);

      return response.json().then((data) => {
        expect(data.error).toEqual({
          message: "Authentication required",
          code: "UNAUTHORIZED",
        });
        expect(data.success).toBe(false);
      });
    });

    it("should create auth error response with custom message", () => {
      const response = ResponseUtils.createAuthErrorResponse("Token expired");

      expect(response.status).toBe(401);

      return response.json().then((data) => {
        expect(data.error.message).toBe("Token expired");
        expect(data.error.code).toBe("UNAUTHORIZED");
      });
    });
  });

  describe("createInternalErrorResponse", () => {
    it("should create internal error response with default message", () => {
      const response = ResponseUtils.createInternalErrorResponse();

      expect(response.status).toBe(500);

      return response.json().then((data) => {
        expect(data.error).toEqual({
          message: "Internal server error",
          code: "INTERNAL_ERROR",
        });
        expect(data.success).toBe(false);
      });
    });

    it("should create internal error response with custom message", () => {
      const response = ResponseUtils.createInternalErrorResponse("Database connection failed");

      expect(response.status).toBe(500);

      return response.json().then((data) => {
        expect(data.error.message).toBe("Database connection failed");
        expect(data.error.code).toBe("INTERNAL_ERROR");
      });
    });
  });
});
