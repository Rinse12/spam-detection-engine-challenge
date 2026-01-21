import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { createServer, type SpamDetectionServer } from "../src/index.js";
import * as cborg from "cborg";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { signBufferEd25519, getPublicKeyFromPrivateKey } from "../src/plebbit-js-signer.js";
import { resetPlebbitLoaderForTest, setPlebbitLoaderForTest } from "../src/subplebbit-resolver.js";

// Cloudflare Turnstile test keys - work on any domain including localhost
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA"; // Always passes

const baseTimestamp = Math.floor(Date.now() / 1000);
let signatureCounter = 0;
const createUniqueSignature = () => ({
    type: "ed25519",
    signature: `sig-${Date.now()}-${signatureCounter++}`,
    publicKey: "pk",
    signedPropertyNames: ["author"]
});
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

// Create CBOR request signature with Uint8Array values
const createRequestSignature = async (propsToSign: Record<string, unknown>, signer = testSigner) => {
    const encoded = cborg.encode(propsToSign);
    const signatureBuffer = await signBufferEd25519(encoded, signer.privateKey);
    return {
        signature: signatureBuffer, // Uint8Array, not base64
        publicKey: uint8ArrayFromString(signer.publicKey, "base64"), // Uint8Array
        type: signer.type,
        signedPropertyNames: Object.keys(propsToSign)
    };
};

// Helper to send CBOR-encoded request
const injectCbor = async (fastify: SpamDetectionServer["fastify"], method: "POST" | "GET", url: string, payload?: unknown) => {
    const options: Parameters<typeof fastify.inject>[0] = {
        method,
        url,
        headers: {
            "content-type": "application/cbor",
            accept: "application/json"
        }
    };
    if (payload !== undefined) {
        options.body = Buffer.from(cborg.encode(payload));
    }
    return fastify.inject(options);
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
        signature: createUniqueSignature(),
        content: "Hello world",
        ...commentOverrides
    };

    if (omitSubplebbitAddress) {
        delete (comment as Record<string, unknown>).subplebbitAddress;
    }

    const challengeRequest = { comment };
    const timestamp = Math.floor(Date.now() / 1000);
    const propsToSign = { challengeRequest, timestamp };
    const signature = await createRequestSignature(propsToSign, signer);

    return {
        ...propsToSign,
        signature
    };
};

const createVerifyPayload = async ({ sessionId, signer = testSigner }: { sessionId: string; signer?: typeof testSigner }) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const propsToSign = { sessionId, timestamp };
    const signature = await createRequestSignature(propsToSign, signer);

    return { ...propsToSign, signature };
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
            baseUrl: "http://localhost:3000",
            turnstileSiteKey: TURNSTILE_TEST_SITE_KEY
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
            const response = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", validRequest);

            expect(response.statusCode).toBe(200);
            const body = response.json();

            expect(body.riskScore).toBeDefined();
            expect(body.riskScore).toBeGreaterThanOrEqual(0);
            expect(body.riskScore).toBeLessThanOrEqual(1);
            expect(body.sessionId).toBeDefined();
            expect(body.challengeUrl).toBeDefined();
            expect(body.challengeUrl).toContain("/api/v1/iframe/");
            expect(body.challengeExpiresAt).toBeDefined();
        });

        it("should create challenge session in database", async () => {
            const validRequest = await createEvaluatePayload();
            const response = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", validRequest);

            const body = response.json();
            const session = server.db.getChallengeSessionBySessionId(body.sessionId);

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

            const response = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", establishedAuthorRequest);

            const body = response.json();
            expect(body.riskScore).toBeLessThan(0.5); // Should be below neutral
        });

        it("should return higher risk score for new author", async () => {
            // First get the established author's score (100 days old with positive karma)
            const establishedRequest = await createEvaluatePayload({
                authorOverrides: { address: "12D3KooWEstablished2" },
                subplebbitOverrides: {
                    firstCommentTimestamp: baseTimestamp - 100 * 86400, // 100 days ago
                    postScore: 50,
                    replyScore: 20
                }
            });
            const establishedResponse = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", establishedRequest);
            const establishedBody = establishedResponse.json();

            // Then get the new author's score (very new user with minimal history)
            const newAuthorRequest = await createEvaluatePayload({
                authorOverrides: { address: "12D3KooWNewAccount" },
                subplebbitOverrides: {
                    firstCommentTimestamp: baseTimestamp - 60, // Just 1 minute ago (very new)
                    postScore: -5, // Negative karma
                    replyScore: 0
                }
            });

            const response = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", newAuthorRequest);

            const body = response.json();
            // New author should have higher risk than established author
            expect(body.riskScore).toBeGreaterThan(establishedBody.riskScore);
        });

        it("should accept new author without subplebbit data", async () => {
            // author.subplebbit is optional - new authors who haven't published
            // in this subplebbit before won't have this field
            const payload = await createEvaluatePayload({
                omitSubplebbitAuthor: true
            });
            const response = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload);

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body.riskScore).toBeDefined();
            expect(body.riskScore).toBeGreaterThanOrEqual(0);
            expect(body.riskScore).toBeLessThanOrEqual(1);
            expect(body.sessionId).toBeDefined();
        });

        it("should return 400 for invalid request body", async () => {
            const response = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", { invalid: "data" });

            expect(response.statusCode).toBe(400);
        });

        it("should return 401 for invalid request signature", async () => {
            const payload = await createEvaluatePayload();
            // Tamper with signature by creating a new invalid one
            payload.signature.signature = new Uint8Array(64); // All zeros - invalid signature

            const response = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload);

            expect(response.statusCode).toBe(401);
        });

        it("should return 400 for invalid subplebbit author data", async () => {
            const payload = await createEvaluatePayload({
                subplebbitOverrides: { lastCommentCid: "not-a-cid" }
            });
            const response = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload);

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 for missing author address", async () => {
            const payload = await createEvaluatePayload({
                omitAuthorAddress: true
            });

            const response = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload);

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 for missing subplebbit address", async () => {
            const payload = await createEvaluatePayload({
                omitSubplebbitAddress: true
            });

            const response = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload);

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 for IPNS-addressed subplebbit", async () => {
            // IPNS addresses are free to create, making them vulnerable to sybil attacks
            // Only domain-addressed subplebbits are supported
            const payload = await createEvaluatePayload({
                commentOverrides: { subplebbitAddress: "12D3KooWIPNSSubplebbit" }
            });

            const response = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload);

            expect(response.statusCode).toBe(400);
            const body = response.json();
            expect(body.error).toContain("Only domain-addressed subplebbits are supported");
        });

        it("should return 409 Conflict when same publication is submitted twice (replay attack prevention)", async () => {
            const uniqueSignature = "replay-attack-test-sig-" + Date.now();
            const payload1 = await createEvaluatePayload({
                commentOverrides: {
                    signature: {
                        ...baseSignature,
                        signature: uniqueSignature
                    }
                }
            });

            // First submission should succeed
            const firstResponse = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload1);
            expect(firstResponse.statusCode).toBe(200);
            const firstBody = firstResponse.json();
            expect(firstBody.sessionId).toBeDefined();

            // Create a new payload with same publication signature but fresh request timestamp/signature
            const payload2 = await createEvaluatePayload({
                commentOverrides: {
                    signature: {
                        ...baseSignature,
                        signature: uniqueSignature
                    }
                }
            });

            // Second submission with same publication signature should fail with 409
            const secondResponse = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload2);
            expect(secondResponse.statusCode).toBe(409);
            const secondBody = secondResponse.json();
            expect(secondBody.error).toContain("Publication already submitted");
        });

        it("should not inflate velocity when replay attack is attempted", async () => {
            const uniqueSignature = "velocity-replay-test-sig-" + Date.now();
            const authorPublicKey = baseSignature.publicKey;

            // Submit the same publication multiple times (with fresh request signatures each time)
            for (let i = 0; i < 3; i++) {
                const payload = await createEvaluatePayload({
                    commentOverrides: {
                        signature: {
                            ...baseSignature,
                            signature: uniqueSignature
                        }
                    }
                });
                await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload);
            }

            // Check that velocity only counts 1 (not 3)
            const stats = server.db.getAuthorVelocityStats(authorPublicKey, "post");
            expect(stats.lastHour).toBe(1);
            expect(stats.last24Hours).toBe(1);
        });

        it("should verify signature correctly when challengeRequest has extra fields (like full ChallengeRequestMessage from plebbit-js)", async () => {
            // This replicates the real structure sent by plebbit-js challenge package
            // The challengeRequest includes extra fields like type, encrypted, challengeRequestId, etc.
            // that are not part of DecryptedChallengeRequestSchema but ARE signed
            const comment = {
                title: "Test Post",
                author: {
                    address: "12D3KooWTestAddress",
                    subplebbit: baseSubplebbitAuthor
                },
                content: "This is a test comment to see the challenge response.",
                signature: {
                    type: "ed25519",
                    publicKey: "lc91opIDUjPDf2b2Rs9IYE+DL569Og98CHNkTH5Qnkg",
                    signature: "EHZ/TySXr4GiuJMpHbIrA4qno8e0pIkcldKyQEob39Hr1zKaExm2hMbO7JRQGyljSUlvIELKdAK1f/aq0IhLDg",
                    signedPropertyNames: ["content", "title", "author", "subplebbitAddress", "protocolVersion", "timestamp"]
                },
                timestamp: baseTimestamp,
                protocolVersion: "1.0.0",
                subplebbitAddress: "test-sub.eth"
            };

            // Full ChallengeRequestMessage structure (as sent by plebbit-js)
            // This includes fields that are NOT in DecryptedChallengeRequestSchema
            const challengeRequest = {
                type: "CHALLENGEREQUEST",
                comment,
                encrypted: {
                    iv: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
                    tag: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
                    type: "ed25519-aes-gcm",
                    ciphertext: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
                },
                signature: {
                    type: "ed25519",
                    publicKey: new Uint8Array(32),
                    signature: new Uint8Array(64),
                    signedPropertyNames: [
                        "challengeRequestId",
                        "protocolVersion",
                        "userAgent",
                        "timestamp",
                        "type",
                        "encrypted",
                        "acceptedChallengeTypes"
                    ]
                },
                timestamp: baseTimestamp,
                userAgent: "/plebbit-js:0.0.7/",
                protocolVersion: "1.0.0",
                challengeRequestId: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
                acceptedChallengeTypes: []
            };

            const timestamp = Math.floor(Date.now() / 1000);
            const propsToSign = { challengeRequest, timestamp };
            const signature = await createRequestSignature(propsToSign, testSigner);

            const payload = {
                ...propsToSign,
                signature
            };

            const response = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload);

            // This should return 200, but currently returns 401 because Zod strips
            // the extra fields (type, encrypted, signature, challengeRequestId, etc.)
            // before signature verification
            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body.riskScore).toBeDefined();
            expect(body.sessionId).toBeDefined();
        });
    });

    describe("POST /api/v1/challenge/verify", () => {
        let sessionId: string;

        beforeEach(async () => {
            // Create a challenge session first
            const evaluatePayload = await createEvaluatePayload({
                authorOverrides: { address: "12D3KooWVerifyTest" },
                commentOverrides: { subplebbitAddress: "verify-sub.eth" }
            });
            const evalResponse = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", evaluatePayload);

            const evalBody = evalResponse.json();
            sessionId = evalBody.sessionId;
        });

        it("should return success when challenge is completed", async () => {
            // Mark the challenge as completed (simulating /complete was called)
            server.db.updateChallengeSessionStatus(sessionId, "completed", Math.floor(Date.now() / 1000));

            const payload = await createVerifyPayload({ sessionId });
            const response = await injectCbor(server.fastify, "POST", "/api/v1/challenge/verify", payload);

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body.success).toBe(true);
            expect(body.challengeType).toBe("turnstile");
        });

        it("should return 400 when challenge is still pending", async () => {
            // Session is created as "pending" by default
            const payload = await createVerifyPayload({ sessionId });
            const response = await injectCbor(server.fastify, "POST", "/api/v1/challenge/verify", payload);

            expect(response.statusCode).toBe(400);
            const body = response.json();
            expect(body.success).toBe(false);
            expect(body.error).toContain("not yet completed");
        });

        it("should return 404 for non-existent challenge", async () => {
            const payload = await createVerifyPayload({
                sessionId: "non-existent-challenge-id"
            });
            const response = await injectCbor(server.fastify, "POST", "/api/v1/challenge/verify", payload);

            expect(response.statusCode).toBe(404);
            const body = response.json();
            expect(body.success).toBe(false);
            expect(body.error).toContain("not found");
        });

        it("should return 401 for mismatched signer", async () => {
            // Mark as completed first
            server.db.updateChallengeSessionStatus(sessionId, "completed", Math.floor(Date.now() / 1000));

            const payload = await createVerifyPayload({
                sessionId,
                signer: alternateSigner
            });
            const response = await injectCbor(server.fastify, "POST", "/api/v1/challenge/verify", payload);

            expect(response.statusCode).toBe(401);
            const body = response.json();
            expect(body.success).toBe(false);
            expect(body.error).toContain("signature");
        });

        it("should return 400 for failed challenge", async () => {
            // Mark challenge as failed
            server.db.updateChallengeSessionStatus(sessionId, "failed", Math.floor(Date.now() / 1000));

            const payload = await createVerifyPayload({ sessionId });
            const response = await injectCbor(server.fastify, "POST", "/api/v1/challenge/verify", payload);

            expect(response.statusCode).toBe(400);
            const body = response.json();
            expect(body.success).toBe(false);
            expect(body.error).toContain("failed");
        });
    });

    describe("GET /api/v1/iframe/:sessionId", () => {
        let sessionId: string;

        beforeEach(async () => {
            // Create a challenge session first
            const evaluatePayload = await createEvaluatePayload({
                authorOverrides: { address: "12D3KooWIframeTest" },
                commentOverrides: { subplebbitAddress: "iframe-sub.eth" }
            });
            const evalResponse = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", evaluatePayload);

            const evalBody = evalResponse.json();
            sessionId = evalBody.sessionId;
        });

        it("should serve iframe HTML for valid challenge", async () => {
            const response = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/iframe/${sessionId}`
            });

            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toContain("text/html");
            expect(response.body).toContain("<!DOCTYPE html>");
            expect(response.body).toContain("Verify you are human");
            expect(response.body).toContain("cf-turnstile");
            expect(response.body).toContain(sessionId);
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
            server.db.updateChallengeSessionStatus(sessionId, "completed", Math.floor(Date.now() / 1000));

            const response = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/iframe/${sessionId}`
            });

            expect(response.statusCode).toBe(409);
        });

        it("should return 409 on second iframe access", async () => {
            // First access should succeed
            const firstResponse = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/iframe/${sessionId}`
            });
            expect(firstResponse.statusCode).toBe(200);

            // Second access should return 409
            const secondResponse = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/iframe/${sessionId}`
            });
            expect(secondResponse.statusCode).toBe(409);
            expect(secondResponse.body).toContain("Challenge already accessed and pending completion");
        });
    });
});

// Cloudflare Turnstile additional test keys
const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA"; // Always passes validation
const TURNSTILE_FAIL_SECRET_KEY = "2x0000000000000000000000000000000AA"; // Always fails validation

describe("Turnstile E2E Flow", () => {
    let server: SpamDetectionServer;

    beforeEach(async () => {
        const getSubplebbit = vi.fn().mockResolvedValue({ signature: { publicKey: testSigner.publicKey } });
        setPlebbitLoaderForTest(async () => ({
            getSubplebbit,
            destroy: vi.fn().mockResolvedValue(undefined)
        }));
        server = await createServer({
            port: 0,
            logging: false,
            databasePath: ":memory:",
            baseUrl: "http://localhost:3000",
            turnstileSiteKey: TURNSTILE_TEST_SITE_KEY,
            turnstileSecretKey: TURNSTILE_TEST_SECRET_KEY
        });
        await server.fastify.ready();
    });

    afterEach(async () => {
        await server.stop();
        resetPlebbitLoaderForTest();
    });

    it("should complete full Turnstile flow with Cloudflare test keys", async () => {
        // Step 1: Create challenge session via /evaluate
        const evaluatePayload = await createEvaluatePayload({
            authorOverrides: { address: "12D3KooWTurnstileE2E" }
        });
        const evalResponse = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", evaluatePayload);

        expect(evalResponse.statusCode).toBe(200);
        const evalBody = evalResponse.json();
        const sessionId = evalBody.sessionId;
        expect(sessionId).toBeDefined();

        // Step 2: Get iframe and verify it contains the test site key
        const iframeResponse = await server.fastify.inject({
            method: "GET",
            url: `/api/v1/iframe/${sessionId}`
        });

        expect(iframeResponse.statusCode).toBe(200);
        expect(iframeResponse.body).toContain(`data-sitekey="${TURNSTILE_TEST_SITE_KEY}"`);

        // Step 3: Complete challenge with dummy token
        // Cloudflare test secret key accepts any token when paired with test site key
        const completeResponse = await server.fastify.inject({
            method: "POST",
            url: "/api/v1/challenge/complete",
            payload: {
                sessionId,
                challengeResponse: "XXXX.DUMMY.TOKEN.XXXX",
                challengeType: "turnstile"
            }
        });

        expect(completeResponse.statusCode).toBe(200);
        const completeBody = completeResponse.json();
        expect(completeBody.success).toBe(true);
        // No token returned - completion is tracked server-side

        // Step 4: Verify the challenge is completed (server checks DB status)
        const verifyPayload = await createVerifyPayload({ sessionId });
        const verifyResponse = await injectCbor(server.fastify, "POST", "/api/v1/challenge/verify", verifyPayload);

        expect(verifyResponse.statusCode).toBe(200);
        const verifyBody = verifyResponse.json();
        expect(verifyBody.success).toBe(true);
        expect(verifyBody.challengeType).toBe("turnstile");

        // Verify session is marked as completed
        const session = server.db.getChallengeSessionBySessionId(sessionId);
        expect(session?.status).toBe("completed");
    });

    it("should serve iframe with correct Turnstile site key", async () => {
        const evaluatePayload = await createEvaluatePayload({
            authorOverrides: { address: "12D3KooWSiteKeyTest" }
        });
        const evalResponse = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", evaluatePayload);

        const { sessionId } = evalResponse.json();

        const iframeResponse = await server.fastify.inject({
            method: "GET",
            url: `/api/v1/iframe/${sessionId}`
        });

        expect(iframeResponse.statusCode).toBe(200);
        expect(iframeResponse.headers["content-type"]).toContain("text/html");
        expect(iframeResponse.body).toContain("cf-turnstile");
        expect(iframeResponse.body).toContain(`data-sitekey="${TURNSTILE_TEST_SITE_KEY}"`);
        expect(iframeResponse.body).toContain("onTurnstileSuccess");
        expect(iframeResponse.body).toContain("onTurnstileError");
    });
});

describe("Turnstile Failure Scenarios", () => {
    let server: SpamDetectionServer;

    beforeEach(async () => {
        const getSubplebbit = vi.fn().mockResolvedValue({ signature: { publicKey: testSigner.publicKey } });
        setPlebbitLoaderForTest(async () => ({
            getSubplebbit,
            destroy: vi.fn().mockResolvedValue(undefined)
        }));
        // Use the always-failing secret key
        server = await createServer({
            port: 0,
            logging: false,
            databasePath: ":memory:",
            baseUrl: "http://localhost:3000",
            turnstileSiteKey: TURNSTILE_TEST_SITE_KEY,
            turnstileSecretKey: TURNSTILE_FAIL_SECRET_KEY
        });
        await server.fastify.ready();
    });

    afterEach(async () => {
        await server.stop();
        resetPlebbitLoaderForTest();
    });

    it("should return 401 when Turnstile verification fails", async () => {
        // Create challenge
        const evaluatePayload = await createEvaluatePayload({
            authorOverrides: { address: "12D3KooWFailTest" }
        });
        const evalResponse = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", evaluatePayload);

        const { sessionId } = evalResponse.json();

        // Try to complete with failing secret key
        const completeResponse = await server.fastify.inject({
            method: "POST",
            url: "/api/v1/challenge/complete",
            payload: {
                sessionId,
                challengeResponse: "XXXX.DUMMY.TOKEN.XXXX",
                challengeType: "turnstile"
            }
        });

        expect(completeResponse.statusCode).toBe(401);
        const body = completeResponse.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain("Turnstile verification failed");
    });
});
