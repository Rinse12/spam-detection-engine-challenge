import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServer, type SpamDetectionServer } from "../src/index.js";

describe("API Routes", () => {
  let server: SpamDetectionServer;

  beforeEach(async () => {
    server = createServer({
      port: 0, // Random available port
      logging: false,
      databasePath: ":memory:",
      baseUrl: "http://localhost:3000",
    });
    await server.fastify.ready();
  });

  afterEach(async () => {
    await server.stop();
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await server.fastify.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.status).toBe("ok");
      expect(body.timestamp).toBeDefined();
    });
  });

  describe("POST /api/v1/evaluate", () => {
    const validRequest = {
      challengeRequestId: "req-123",
      publication: {
        author: {
          address: "12D3KooWTestAddress",
        },
        subplebbitAddress: "test-sub.eth",
        timestamp: Math.floor(Date.now() / 1000),
        signature: { type: "ed25519" },
      },
    };

    it("should return evaluation response for valid request", async () => {
      const response = await server.fastify.inject({
        method: "POST",
        url: "/api/v1/evaluate",
        payload: validRequest,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      expect(body.riskScore).toBeDefined();
      expect(body.riskScore).toBeGreaterThanOrEqual(0);
      expect(body.riskScore).toBeLessThanOrEqual(1);
      expect(body.challengeId).toBeDefined();
      expect(body.challengeUrl).toBeDefined();
      expect(body.challengeUrl).toContain("/api/v1/iframe/");
      expect(body.challengeExpiresAt).toBeDefined();
    });

    it("should create challenge session in database", async () => {
      const response = await server.fastify.inject({
        method: "POST",
        url: "/api/v1/evaluate",
        payload: validRequest,
      });

      const body = response.json();
      const session = server.db.getChallengeSessionByChallengeId(
        body.challengeId
      );

      expect(session).toBeDefined();
      expect(session?.author).toBe("12D3KooWTestAddress");
      expect(session?.subplebbitAddress).toBe("test-sub.eth");
      expect(session?.status).toBe("pending");
    });

    it("should return lower risk score for established author", async () => {
      const establishedAuthorRequest = {
        ...validRequest,
        publication: {
          ...validRequest.publication,
          author: {
            address: "12D3KooWEstablished",
            firstCommentTimestamp: Math.floor(Date.now() / 1000) - 400 * 86400, // 400 days ago
            postScore: 150,
            replyScore: 50,
          },
        },
      };

      const response = await server.fastify.inject({
        method: "POST",
        url: "/api/v1/evaluate",
        payload: establishedAuthorRequest,
      });

      const body = response.json();
      expect(body.riskScore).toBeLessThan(0.5); // Should be below neutral
    });

    it("should return higher risk score for new author", async () => {
      const newAuthorRequest = {
        ...validRequest,
        publication: {
          ...validRequest.publication,
          author: {
            address: "12D3KooWNewAccount",
            // No firstCommentTimestamp, no karma
          },
        },
      };

      const response = await server.fastify.inject({
        method: "POST",
        url: "/api/v1/evaluate",
        payload: newAuthorRequest,
      });

      const body = response.json();
      expect(body.riskScore).toBeGreaterThan(0.5); // Should be above neutral
    });

    it("should return 500 for invalid request body", async () => {
      const response = await server.fastify.inject({
        method: "POST",
        url: "/api/v1/evaluate",
        payload: { invalid: "data" },
      });

      // Zod validation errors are caught by error handler and return 500
      // The error message still contains validation details
      expect(response.statusCode).toBe(500);
    });
  });

  describe("POST /api/v1/challenge/verify", () => {
    let challengeId: string;

    beforeEach(async () => {
      // Create a challenge session first
      const evalResponse = await server.fastify.inject({
        method: "POST",
        url: "/api/v1/evaluate",
        payload: {
          challengeRequestId: "req-verify-test",
          publication: {
            author: { address: "12D3KooWVerifyTest" },
            subplebbitAddress: "verify-sub.eth",
            timestamp: Math.floor(Date.now() / 1000),
            signature: { type: "ed25519" },
          },
        },
      });

      const evalBody = evalResponse.json();
      challengeId = evalBody.challengeId;
    });

    it("should verify valid token", async () => {
      const response = await server.fastify.inject({
        method: "POST",
        url: "/api/v1/challenge/verify",
        payload: {
          challengeId,
          token: "valid-token-placeholder-12345",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.challengeType).toBe("turnstile");
    });

    it("should mark session as completed after verification", async () => {
      await server.fastify.inject({
        method: "POST",
        url: "/api/v1/challenge/verify",
        payload: {
          challengeId,
          token: "valid-token-placeholder-12345",
        },
      });

      const session = server.db.getChallengeSessionByChallengeId(challengeId);
      expect(session?.status).toBe("completed");
      expect(session?.completedAt).toBeDefined();
    });

    it("should return 404 for non-existent challenge", async () => {
      const response = await server.fastify.inject({
        method: "POST",
        url: "/api/v1/challenge/verify",
        payload: {
          challengeId: "non-existent-challenge-id",
          token: "some-token-12345",
        },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("not found");
    });

    it("should return 409 for already completed challenge", async () => {
      // Complete the challenge first
      await server.fastify.inject({
        method: "POST",
        url: "/api/v1/challenge/verify",
        payload: {
          challengeId,
          token: "valid-token-placeholder-12345",
        },
      });

      // Try to verify again
      const response = await server.fastify.inject({
        method: "POST",
        url: "/api/v1/challenge/verify",
        payload: {
          challengeId,
          token: "another-token-12345",
        },
      });

      expect(response.statusCode).toBe(409);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("already completed");
    });

    it("should return 401 for invalid token", async () => {
      const response = await server.fastify.inject({
        method: "POST",
        url: "/api/v1/challenge/verify",
        payload: {
          challengeId,
          token: "short", // Too short to be valid
        },
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("Invalid token");
    });

    it("should return 400 for missing fields", async () => {
      const response = await server.fastify.inject({
        method: "POST",
        url: "/api/v1/challenge/verify",
        payload: {
          challengeId,
          // Missing token
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /api/v1/iframe/:challengeId", () => {
    let challengeId: string;

    beforeEach(async () => {
      // Create a challenge session first
      const evalResponse = await server.fastify.inject({
        method: "POST",
        url: "/api/v1/evaluate",
        payload: {
          challengeRequestId: "req-iframe-test",
          publication: {
            author: { address: "12D3KooWIframeTest" },
            subplebbitAddress: "iframe-sub.eth",
            timestamp: Math.floor(Date.now() / 1000),
            signature: { type: "ed25519" },
          },
        },
      });

      const evalBody = evalResponse.json();
      challengeId = evalBody.challengeId;
    });

    it("should serve iframe HTML for valid challenge", async () => {
      const response = await server.fastify.inject({
        method: "GET",
        url: `/api/v1/iframe/${challengeId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("text/html");
      expect(response.body).toContain("<!DOCTYPE html>");
      expect(response.body).toContain("Verify you are human");
      expect(response.body).toContain("cf-turnstile");
      expect(response.body).toContain(challengeId);
    });

    it("should return 404 for non-existent challenge", async () => {
      const response = await server.fastify.inject({
        method: "GET",
        url: "/api/v1/iframe/non-existent-challenge-id",
      });

      expect(response.statusCode).toBe(404);
    });

    it("should return 409 for already completed challenge", async () => {
      // Complete the challenge first
      server.db.updateChallengeSessionStatus(
        challengeId,
        "completed",
        Math.floor(Date.now() / 1000)
      );

      const response = await server.fastify.inject({
        method: "GET",
        url: `/api/v1/iframe/${challengeId}`,
      });

      expect(response.statusCode).toBe(409);
    });
  });
});
