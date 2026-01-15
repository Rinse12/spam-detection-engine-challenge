import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { createServer, type SpamDetectionServer } from "../src/index.js";
import * as cborg from "cborg";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { signBufferEd25519, getPublicKeyFromPrivateKey } from "../src/plebbit-js-signer.js";
import { resetPlebbitLoaderForTest, setPlebbitLoaderForTest } from "../src/subplebbit-resolver.js";
import { signChallengeToken, createTokenPayload } from "../src/crypto/jwt.js";

const baseTimestamp = Math.floor(Date.now() / 1000);
const baseSignature = {
    type: "ed25519",
    signature: "sig",
    publicKey: "pk",
    signedPropertyNames: ["author"]
};
const baseSubplebbitAuthor = {
    postScore: 0,
    replyScore: 0,
    firstCommentTimestamp: baseTimestamp - 86400,
    lastCommentCid: "QmYwAPJzv5CZsnAzt8auVZRn9p6nxfZmZ75W6rS4ju4Khu"
};
const cborgEncodeOptions = {
    typeEncoders: {
        undefined: () => {
            throw new Error("Signed payload cannot include undefined values (cborg)");
        }
    }
};
const testPrivateKey = Buffer.alloc(32, 7).toString("base64");
const alternatePrivateKey = Buffer.alloc(32, 3).toString("base64");
let testPublicKey = "";
let alternatePublicKey = "";
let testSigner = {
    privateKey: testPrivateKey,
    publicKey: "",
    type: "ed25519"
};
let alternateSigner = {
    privateKey: alternatePrivateKey,
    publicKey: "",
    type: "ed25519"
};

beforeAll(async () => {
    testPublicKey = await getPublicKeyFromPrivateKey(testPrivateKey);
    alternatePublicKey = await getPublicKeyFromPrivateKey(alternatePrivateKey);
    testSigner = {
        privateKey: testPrivateKey,
        publicKey: testPublicKey,
        type: "ed25519"
    };
    alternateSigner = {
        privateKey: alternatePrivateKey,
        publicKey: alternatePublicKey,
        type: "ed25519"
    };
});

const buildSignedPayload = (payload: Record<string, unknown>, signedPropertyNames: string[]) => {
    const propsToSign: Record<string, unknown> = {};
    for (const propertyName of signedPropertyNames) {
        propsToSign[propertyName] = payload[propertyName];
    }
    return propsToSign;
};

const createRequestSignature = async (payload: Record<string, unknown>, signedPropertyNames: string[], signer = testSigner) => {
    const propsToSign = buildSignedPayload(payload, signedPropertyNames);
    const encoded = cborg.encode(propsToSign, cborgEncodeOptions);
    const signatureBuffer = await signBufferEd25519(encoded, signer.privateKey);
    return {
        signature: uint8ArrayToString(signatureBuffer, "base64"),
        publicKey: signer.publicKey,
        type: signer.type,
        signedPropertyNames
    };
};

const createEvaluatePayload = async ({
    commentOverrides = {},
    authorOverrides = {},
    subplebbitOverrides = {},
    omitSubplebbitAuthor = false,
    omitAuthorAddress = false,
    omitSubplebbitAddress = false,
    signer = testSigner
}: {
    commentOverrides?: Record<string, unknown>;
    authorOverrides?: Record<string, unknown>;
    subplebbitOverrides?: Record<string, unknown>;
    omitSubplebbitAuthor?: boolean;
    omitAuthorAddress?: boolean;
    omitSubplebbitAddress?: boolean;
    signer?: typeof testSigner;
} = {}) => {
    const author: Record<string, unknown> = {
        address: "12D3KooWTestAddress",
        ...authorOverrides
    };

    if (!omitSubplebbitAuthor) {
        author.subplebbit = {
            ...baseSubplebbitAuthor,
            ...subplebbitOverrides
        };
    }

    if (omitAuthorAddress) {
        delete author.address;
    }

    const comment = {
        author,
        subplebbitAddress: "test-sub.eth",
        timestamp: baseTimestamp,
        protocolVersion: "1",
        signature: baseSignature,
        content: "Hello world",
        ...commentOverrides
    };

    if (omitSubplebbitAddress) {
        delete (comment as Record<string, unknown>).subplebbitAddress;
    }

    const challengeRequest = { comment };
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await createRequestSignature({ challengeRequest, timestamp }, ["challengeRequest", "timestamp"], signer);

    return {
        challengeRequest,
        timestamp,
        signature
    };
};

const createVerifyPayload = async ({
    challengeId,
    token,
    signer = testSigner
}: {
    challengeId: string;
    token: string;
    signer?: typeof testSigner;
}) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await createRequestSignature({ challengeId, token, timestamp }, ["challengeId", "token", "timestamp"], signer);

    return { challengeId, token, timestamp, signature };
};

describe("API Routes", () => {
    let server: SpamDetectionServer;

    beforeEach(async () => {
        const getSubplebbit = vi.fn().mockResolvedValue({ signature: { publicKey: testSigner.publicKey } });
        setPlebbitLoaderForTest(async () => ({
            getSubplebbit,
            destroy: vi.fn().mockResolvedValue(undefined)
        }));
        server = await createServer({
            port: 0, // Random available port
            logging: false,
            databasePath: ":memory:",
            baseUrl: "http://localhost:3000"
        });
        await server.fastify.ready();
    });

    afterEach(async () => {
        await server.stop();
        resetPlebbitLoaderForTest();
    });

    describe("GET /health", () => {
        it("should return health status", async () => {
            const response = await server.fastify.inject({
                method: "GET",
                url: "/health"
            });

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body.status).toBe("ok");
            expect(body.timestamp).toBeDefined();
        });
    });

    describe("POST /api/v1/evaluate", () => {
        it("should return evaluation response for valid request", async () => {
            const validRequest = await createEvaluatePayload();
            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/evaluate",
                payload: validRequest
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
            const validRequest = await createEvaluatePayload();
            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/evaluate",
                payload: validRequest
            });

            const body = response.json();
            const session = server.db.getChallengeSessionByChallengeId(body.challengeId);

            expect(session).toBeDefined();
            expect(session?.subplebbitPublicKey).toBe(testSigner.publicKey);
            expect(session?.status).toBe("pending");
        });

        it("should return lower risk score for established author", async () => {
            const establishedAuthorRequest = await createEvaluatePayload({
                authorOverrides: { address: "12D3KooWEstablished" },
                subplebbitOverrides: {
                    firstCommentTimestamp: baseTimestamp - 400 * 86400, // 400 days ago
                    postScore: 150,
                    replyScore: 50
                }
            });

            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/evaluate",
                payload: establishedAuthorRequest
            });

            const body = response.json();
            expect(body.riskScore).toBeLessThan(0.5); // Should be below neutral
        });

        it("should return higher risk score for new author", async () => {
            const newAuthorRequest = await createEvaluatePayload({
                authorOverrides: { address: "12D3KooWNewAccount" },
                subplebbitOverrides: { firstCommentTimestamp: baseTimestamp - 3600 }
            });

            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/evaluate",
                payload: newAuthorRequest
            });

            const body = response.json();
            expect(body.riskScore).toBeGreaterThan(0.5); // Should be above neutral
        });

        it("should return 400 for missing subplebbit author data", async () => {
            const payload = await createEvaluatePayload({
                omitSubplebbitAuthor: true
            });
            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/evaluate",
                payload
            });

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 for invalid request body", async () => {
            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/evaluate",
                payload: { invalid: "data" }
            });

            expect(response.statusCode).toBe(400);
        });

        it("should return 401 for invalid request signature", async () => {
            const payload = await createEvaluatePayload();
            payload.signature.signature = "invalid-signature";

            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/evaluate",
                payload
            });

            expect(response.statusCode).toBe(401);
        });

        it("should return 400 for invalid subplebbit author data", async () => {
            const payload = await createEvaluatePayload({
                subplebbitOverrides: { lastCommentCid: "not-a-cid" }
            });
            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/evaluate",
                payload
            });

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 for missing author address", async () => {
            const payload = await createEvaluatePayload({
                omitAuthorAddress: true
            });

            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/evaluate",
                payload
            });

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 for missing subplebbit address", async () => {
            const payload = await createEvaluatePayload({
                omitSubplebbitAddress: true
            });

            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/evaluate",
                payload
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe("POST /api/v1/challenge/verify", () => {
        let challengeId: string;

        beforeEach(async () => {
            // Create a challenge session first
            const evaluatePayload = await createEvaluatePayload({
                authorOverrides: { address: "12D3KooWVerifyTest" },
                commentOverrides: { subplebbitAddress: "verify-sub.eth" }
            });
            const evalResponse = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/evaluate",
                payload: evaluatePayload
            });

            const evalBody = evalResponse.json();
            challengeId = evalBody.challengeId;
        });

        it("should verify valid token", async () => {
            // Generate a valid JWT using the server's key manager
            const privateKey = await server.keyManager.getPrivateKey();
            const tokenPayload = createTokenPayload(challengeId);
            const validToken = await signChallengeToken(tokenPayload, privateKey);

            const payload = await createVerifyPayload({
                challengeId,
                token: validToken
            });
            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/challenge/verify",
                payload
            });

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body.success).toBe(true);
            expect(body.challengeType).toBe("turnstile");
        });

        it("should mark session as completed after verification", async () => {
            // Generate a valid JWT using the server's key manager
            const privateKey = await server.keyManager.getPrivateKey();
            const tokenPayload = createTokenPayload(challengeId);
            const validToken = await signChallengeToken(tokenPayload, privateKey);

            const payload = await createVerifyPayload({
                challengeId,
                token: validToken
            });
            await server.fastify.inject({
                method: "POST",
                url: "/api/v1/challenge/verify",
                payload
            });

            const session = server.db.getChallengeSessionByChallengeId(challengeId);
            expect(session?.status).toBe("completed");
            expect(session?.completedAt).toBeDefined();
        });

        it("should return 404 for non-existent challenge", async () => {
            const payload = await createVerifyPayload({
                challengeId: "non-existent-challenge-id",
                token: "some-token-12345"
            });
            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/challenge/verify",
                payload
            });

            expect(response.statusCode).toBe(404);
            const body = response.json();
            expect(body.success).toBe(false);
            expect(body.error).toContain("not found");
        });

        it("should return 409 for already completed challenge", async () => {
            // Generate a valid JWT using the server's key manager
            const privateKey = await server.keyManager.getPrivateKey();
            const tokenPayload = createTokenPayload(challengeId);
            const validToken = await signChallengeToken(tokenPayload, privateKey);

            const firstPayload = await createVerifyPayload({
                challengeId,
                token: validToken
            });
            // Complete the challenge first
            await server.fastify.inject({
                method: "POST",
                url: "/api/v1/challenge/verify",
                payload: firstPayload
            });

            // Try to verify again
            const secondPayload = await createVerifyPayload({
                challengeId,
                token: validToken
            });
            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/challenge/verify",
                payload: secondPayload
            });

            expect(response.statusCode).toBe(409);
            const body = response.json();
            expect(body.success).toBe(false);
            expect(body.error).toContain("already completed");
        });

        it("should return 401 for mismatched signer", async () => {
            const payload = await createVerifyPayload({
                challengeId,
                token: "valid-token-placeholder-12345",
                signer: alternateSigner
            });
            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/challenge/verify",
                payload
            });

            expect(response.statusCode).toBe(401);
            const body = response.json();
            expect(body.success).toBe(false);
            expect(body.error).toContain("signature");
        });

        it("should return 401 for invalid token", async () => {
            const payload = await createVerifyPayload({
                challengeId,
                token: "not-a-valid-jwt-token" // Invalid JWT format
            });
            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/challenge/verify",
                payload
            });

            expect(response.statusCode).toBe(401);
            const body = response.json();
            expect(body.success).toBe(false);
            // JWT library throws "Invalid Compact JWS" for malformed tokens
            expect(body.error).toBeDefined();
        });

        it("should return 400 for missing fields", async () => {
            const response = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/challenge/verify",
                payload: {
                    challengeId
                    // Missing token
                }
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe("GET /api/v1/iframe/:challengeId", () => {
        let challengeId: string;

        beforeEach(async () => {
            // Create a challenge session first
            const evaluatePayload = await createEvaluatePayload({
                authorOverrides: { address: "12D3KooWIframeTest" },
                commentOverrides: { subplebbitAddress: "iframe-sub.eth" }
            });
            const evalResponse = await server.fastify.inject({
                method: "POST",
                url: "/api/v1/evaluate",
                payload: evaluatePayload
            });

            const evalBody = evalResponse.json();
            challengeId = evalBody.challengeId;
        });

        it("should serve iframe HTML for valid challenge", async () => {
            const response = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/iframe/${challengeId}`
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
                url: "/api/v1/iframe/non-existent-challenge-id"
            });

            expect(response.statusCode).toBe(404);
        });

        it("should return 409 for already completed challenge", async () => {
            // Complete the challenge first
            server.db.updateChallengeSessionStatus(challengeId, "completed", Math.floor(Date.now() / 1000));

            const response = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/iframe/${challengeId}`
            });

            expect(response.statusCode).toBe(409);
        });
    });
});
