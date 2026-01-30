import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createServer, type SpamDetectionServer } from "../src/index.js";
import * as cborg from "cborg";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { signBufferEd25519, getPublicKeyFromPrivateKey, getPlebbitAddressFromPublicKey } from "../src/plebbit-js-signer.js";
import { resetPlebbitLoaderForTest, setPlebbitLoaderForTest } from "../src/subplebbit-resolver.js";
import { determineChallengeTier, DEFAULT_CHALLENGE_TIER_CONFIG } from "../src/risk-score/challenge-tier.js";

// Cloudflare Turnstile test keys
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

const baseTimestamp = Math.floor(Date.now() / 1000);

// Signed property names for comment publications
const CommentSignedPropertyNames = [
    "timestamp",
    "flair",
    "subplebbitAddress",
    "author",
    "protocolVersion",
    "content",
    "spoiler",
    "nsfw",
    "link",
    "title",
    "linkWidth",
    "linkHeight",
    "linkHtmlTagName",
    "parentCid",
    "postCid"
];

const baseSubplebbitAuthor = {
    postScore: 0,
    replyScore: 0,
    firstCommentTimestamp: baseTimestamp - 86400,
    lastCommentCid: "QmYwAPJzv5CZsnAzt8auVZRn9p6nxfZmZ75W6rS4ju4Khu"
};

// Signers
const testPrivateKey = Buffer.alloc(32, 7).toString("base64");
const authorPrivateKey = Buffer.alloc(32, 9).toString("base64");

let testPublicKey = "";
let authorPublicKey = "";
let authorPlebbitAddress = "";

let testSigner = {
    privateKey: testPrivateKey,
    publicKey: "",
    type: "ed25519"
};
let authorSigner = {
    privateKey: authorPrivateKey,
    publicKey: "",
    type: "ed25519"
};

// Helper to create a properly signed publication signature
const signPublication = async (
    publication: Record<string, unknown>,
    signer: { privateKey: string; publicKey: string },
    signedPropertyNames: string[]
) => {
    const propsToSign: Record<string, unknown> = {};
    for (const key of signedPropertyNames) {
        if (publication[key] !== undefined && publication[key] !== null) {
            propsToSign[key] = publication[key];
        }
    }

    const encoded = cborg.encode(propsToSign);
    const signatureBytes = await signBufferEd25519(encoded, signer.privateKey);

    return {
        type: "ed25519",
        signature: uint8ArrayToString(signatureBytes, "base64"),
        publicKey: signer.publicKey,
        signedPropertyNames: Object.keys(propsToSign)
    };
};

const createRequestSignature = async (propsToSign: Record<string, unknown>, signer = testSigner) => {
    const encoded = cborg.encode(propsToSign);
    const signatureBuffer = await signBufferEd25519(encoded, signer.privateKey);
    return {
        signature: signatureBuffer,
        publicKey: uint8ArrayFromString(signer.publicKey, "base64"),
        type: signer.type,
        signedPropertyNames: Object.keys(propsToSign)
    };
};

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
    omitSubplebbitAuthor = false
}: {
    commentOverrides?: Record<string, unknown>;
    authorOverrides?: Record<string, unknown>;
    subplebbitOverrides?: Record<string, unknown>;
    omitSubplebbitAuthor?: boolean;
} = {}) => {
    // Build author WITHOUT subplebbit for signing (matches production flow)
    const authorForSigning: Record<string, unknown> = {
        address: authorPlebbitAddress,
        ...authorOverrides
    };

    const commentWithoutSignature: Record<string, unknown> = {
        author: authorForSigning,
        subplebbitAddress: "test-sub.eth",
        timestamp: baseTimestamp,
        protocolVersion: "1",
        content: "Hello world",
        ...commentOverrides
    };

    const publicationSignature = await signPublication(commentWithoutSignature, authorSigner, CommentSignedPropertyNames);

    // After signing, add author.subplebbit (matches production flow where
    // the subplebbit adds this field after the author signs)
    let finalAuthor: Record<string, unknown> = { ...authorForSigning };
    if (!omitSubplebbitAuthor) {
        finalAuthor.subplebbit = {
            ...baseSubplebbitAuthor,
            ...subplebbitOverrides
        };
    }

    const comment = {
        ...commentWithoutSignature,
        author: finalAuthor,
        signature: publicationSignature
    };

    const challengeRequest = { comment };
    const timestamp = Math.floor(Date.now() / 1000);
    const propsToSign = { challengeRequest, timestamp };
    const signature = await createRequestSignature(propsToSign, testSigner);

    return {
        ...propsToSign,
        signature
    };
};

describe("determineChallengeTier", () => {
    it("should return auto_accept for scores below autoAcceptThreshold", () => {
        expect(determineChallengeTier(0)).toBe("auto_accept");
        expect(determineChallengeTier(0.1)).toBe("auto_accept");
        expect(determineChallengeTier(0.19)).toBe("auto_accept");
    });

    it("should return captcha_only for scores between autoAcceptThreshold and captchaOnlyThreshold", () => {
        expect(determineChallengeTier(0.2)).toBe("captcha_only");
        expect(determineChallengeTier(0.3)).toBe("captcha_only");
        expect(determineChallengeTier(0.39)).toBe("captcha_only");
    });

    it("should return captcha_and_oauth for scores between captchaOnlyThreshold and autoRejectThreshold", () => {
        expect(determineChallengeTier(0.4)).toBe("captcha_and_oauth");
        expect(determineChallengeTier(0.5)).toBe("captcha_and_oauth");
        expect(determineChallengeTier(0.79)).toBe("captcha_and_oauth");
    });

    it("should return auto_reject for scores at or above autoRejectThreshold", () => {
        expect(determineChallengeTier(0.8)).toBe("auto_reject");
        expect(determineChallengeTier(0.9)).toBe("auto_reject");
        expect(determineChallengeTier(1.0)).toBe("auto_reject");
    });

    it("should use custom thresholds when provided", () => {
        const customConfig = {
            autoAcceptThreshold: 0.1,
            captchaOnlyThreshold: 0.3,
            autoRejectThreshold: 0.6
        };

        expect(determineChallengeTier(0.05, customConfig)).toBe("auto_accept");
        expect(determineChallengeTier(0.15, customConfig)).toBe("captcha_only");
        expect(determineChallengeTier(0.4, customConfig)).toBe("captcha_and_oauth");
        expect(determineChallengeTier(0.7, customConfig)).toBe("auto_reject");
    });

    it("should throw error for invalid threshold configuration", () => {
        expect(() => determineChallengeTier(0.5, { autoAcceptThreshold: 0.5, captchaOnlyThreshold: 0.3 })).toThrow(
            "autoAcceptThreshold must be less than captchaOnlyThreshold"
        );

        expect(() => determineChallengeTier(0.5, { captchaOnlyThreshold: 0.9, autoRejectThreshold: 0.7 })).toThrow(
            "captchaOnlyThreshold must be less than autoRejectThreshold"
        );
    });

    it("should handle boundary values correctly", () => {
        // At exactly autoAcceptThreshold, should be captcha_only
        expect(determineChallengeTier(0.2)).toBe("captcha_only");
        // At exactly captchaOnlyThreshold, should be captcha_and_oauth
        expect(determineChallengeTier(0.4)).toBe("captcha_and_oauth");
        // At exactly autoRejectThreshold, should be auto_reject
        expect(determineChallengeTier(0.8)).toBe("auto_reject");
    });
});

describe("Challenge Tier Integration", () => {
    let server: SpamDetectionServer;

    beforeEach(async () => {
        testPublicKey = await getPublicKeyFromPrivateKey(testPrivateKey);
        authorPublicKey = await getPublicKeyFromPrivateKey(authorPrivateKey);
        authorPlebbitAddress = await getPlebbitAddressFromPublicKey(authorPublicKey);
        testSigner = { privateKey: testPrivateKey, publicKey: testPublicKey, type: "ed25519" };
        authorSigner = { privateKey: authorPrivateKey, publicKey: authorPublicKey, type: "ed25519" };

        const getSubplebbit = vi.fn().mockResolvedValue({ signature: { publicKey: testSigner.publicKey } });
        setPlebbitLoaderForTest(async () => ({
            getSubplebbit,
            destroy: vi.fn().mockResolvedValue(undefined)
        }));
    });

    afterEach(async () => {
        if (server) {
            await server.stop();
        }
        resetPlebbitLoaderForTest();
    });

    describe("Session creation with challenge tier", () => {
        it("should store challengeTier in session and allow retrieving authorPublicKey from publication", async () => {
            server = await createServer({
                port: 0,
                logging: false,
                databasePath: ":memory:",
                baseUrl: "http://localhost:3000",
                turnstileSiteKey: TURNSTILE_TEST_SITE_KEY,
                turnstileSecretKey: TURNSTILE_TEST_SECRET_KEY
            });
            await server.fastify.ready();

            const payload = await createEvaluatePayload();
            const response = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload);

            expect(response.statusCode).toBe(200);
            const { sessionId } = response.json();

            const session = server.db.getChallengeSessionBySessionId(sessionId);
            expect(session).toBeDefined();
            // Author public key is retrieved from publication tables, not stored in session
            const authorPubKey = server.db.getAuthorPublicKeyBySessionId(sessionId);
            expect(authorPubKey).toBe(authorSigner.publicKey);
            // Challenge tier should be set based on risk score
            expect(["captcha_only", "captcha_and_oauth", null]).toContain(session?.challengeTier);
        });
    });

    describe("Iframe route with challenge tiers", () => {
        it("should serve turnstile iframe for captcha_only tier", async () => {
            server = await createServer({
                port: 0,
                logging: false,
                databasePath: ":memory:",
                baseUrl: "http://localhost:3000",
                turnstileSiteKey: TURNSTILE_TEST_SITE_KEY,
                turnstileSecretKey: TURNSTILE_TEST_SECRET_KEY,
                // Set thresholds so most scores result in captcha_only
                autoAcceptThreshold: 0,
                captchaOnlyThreshold: 0.99,
                autoRejectThreshold: 1.0
            });
            await server.fastify.ready();

            const payload = await createEvaluatePayload();
            const evalResponse = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload);
            const { sessionId, riskScore } = evalResponse.json();

            // Verify session has captcha_only tier
            const session = server.db.getChallengeSessionBySessionId(sessionId);
            expect(session?.challengeTier).toBe("captcha_only");

            const iframeResponse = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/iframe/${sessionId}`
            });

            expect(iframeResponse.statusCode).toBe(200);
            expect(iframeResponse.body).toContain("cf-turnstile");
            expect(iframeResponse.body).toContain("Verify you are human");
        });

        it("should return 403 for auto_reject tier", async () => {
            server = await createServer({
                port: 0,
                logging: false,
                databasePath: ":memory:",
                baseUrl: "http://localhost:3000",
                turnstileSiteKey: TURNSTILE_TEST_SITE_KEY,
                turnstileSecretKey: TURNSTILE_TEST_SECRET_KEY,
                // Set thresholds so all non-zero scores result in auto_reject
                // Any score >= 0 will be auto_reject since autoRejectThreshold is 0
                autoAcceptThreshold: 0,
                captchaOnlyThreshold: 0.001,
                autoRejectThreshold: 0.002
            });
            await server.fastify.ready();

            // Use an author profile that should result in moderate/high risk score
            const payload = await createEvaluatePayload({
                omitSubplebbitAuthor: true // New author = higher risk
            });
            const evalResponse = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload);
            const { sessionId, riskScore } = evalResponse.json();

            // Verify the risk score is above auto_reject threshold
            expect(riskScore).toBeGreaterThanOrEqual(0.002);

            // Verify session was marked as failed
            const session = server.db.getChallengeSessionBySessionId(sessionId);
            expect(session?.status).toBe("failed");

            const iframeResponse = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/iframe/${sessionId}`
            });

            expect(iframeResponse.statusCode).toBe(403);
            expect(iframeResponse.body).toContain("rejected");
        });

        it("should mark session as completed for auto_accept tier", async () => {
            server = await createServer({
                port: 0,
                logging: false,
                databasePath: ":memory:",
                baseUrl: "http://localhost:3000",
                turnstileSiteKey: TURNSTILE_TEST_SITE_KEY,
                // Set thresholds so all scores (0.0 - 1.0) result in auto_accept
                // autoAcceptThreshold > 1.0 means everything is auto_accept
                autoAcceptThreshold: 1.1,
                captchaOnlyThreshold: 1.2,
                autoRejectThreshold: 1.3
            });
            await server.fastify.ready();

            const payload = await createEvaluatePayload();
            const evalResponse = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload);
            const { sessionId } = evalResponse.json();

            // Session should be marked as completed immediately
            const session = server.db.getChallengeSessionBySessionId(sessionId);
            expect(session?.status).toBe("completed");
        });
    });

    describe("Complete route with partial completion", () => {
        it("should mark captcha as completed for captcha_and_oauth tier", async () => {
            server = await createServer({
                port: 0,
                logging: false,
                databasePath: ":memory:",
                baseUrl: "http://localhost:3000",
                turnstileSiteKey: TURNSTILE_TEST_SITE_KEY,
                turnstileSecretKey: TURNSTILE_TEST_SECRET_KEY,
                oauth: {
                    github: { clientId: "test", clientSecret: "test" }
                },
                // Set thresholds so all non-zero scores result in captcha_and_oauth
                // Score must be >= autoAcceptThreshold and >= captchaOnlyThreshold but < autoRejectThreshold
                autoAcceptThreshold: 0,
                captchaOnlyThreshold: 0.001,
                autoRejectThreshold: 1.0
            });
            await server.fastify.ready();

            const payload = await createEvaluatePayload();
            const evalResponse = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload);
            const { sessionId, riskScore } = evalResponse.json();

            // Verify risk score should be in captcha_and_oauth range
            expect(riskScore).toBeGreaterThanOrEqual(0.001);
            expect(riskScore).toBeLessThan(1.0);

            // Verify session has captcha_and_oauth tier
            let session = server.db.getChallengeSessionBySessionId(sessionId);
            expect(session?.challengeTier).toBe("captcha_and_oauth");
            expect(session?.captchaCompleted).toBe(0);

            // Access iframe first (required before complete)
            await server.fastify.inject({
                method: "GET",
                url: `/api/v1/iframe/${sessionId}`
            });

            // Complete CAPTCHA
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
            expect(completeBody.captchaCompleted).toBe(true);
            expect(completeBody.oauthRequired).toBe(true);

            // Session should NOT be completed yet
            session = server.db.getChallengeSessionBySessionId(sessionId);
            expect(session?.status).toBe("pending");
            expect(session?.captchaCompleted).toBe(1);
        });

        it("should complete session for captcha_only tier after CAPTCHA", async () => {
            server = await createServer({
                port: 0,
                logging: false,
                databasePath: ":memory:",
                baseUrl: "http://localhost:3000",
                turnstileSiteKey: TURNSTILE_TEST_SITE_KEY,
                turnstileSecretKey: TURNSTILE_TEST_SECRET_KEY,
                // Set thresholds so scores result in captcha_only
                autoAcceptThreshold: 0,
                captchaOnlyThreshold: 0.99,
                autoRejectThreshold: 1.0
            });
            await server.fastify.ready();

            const payload = await createEvaluatePayload();
            const evalResponse = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload);
            const { sessionId } = evalResponse.json();

            // Verify session has captcha_only tier
            let session = server.db.getChallengeSessionBySessionId(sessionId);
            expect(session?.challengeTier).toBe("captcha_only");

            // Access iframe first
            await server.fastify.inject({
                method: "GET",
                url: `/api/v1/iframe/${sessionId}`
            });

            // Complete CAPTCHA
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
            expect(completeBody.oauthRequired).toBeUndefined();

            // Session should be completed
            session = server.db.getChallengeSessionBySessionId(sessionId);
            expect(session?.status).toBe("completed");
        });
    });
});

describe("Database OAuth Provider Methods", () => {
    let server: SpamDetectionServer;

    beforeEach(async () => {
        testPublicKey = await getPublicKeyFromPrivateKey(testPrivateKey);
        authorPublicKey = await getPublicKeyFromPrivateKey(authorPrivateKey);
        authorPlebbitAddress = await getPlebbitAddressFromPublicKey(authorPublicKey);
        testSigner = { privateKey: testPrivateKey, publicKey: testPublicKey, type: "ed25519" };
        authorSigner = { privateKey: authorPrivateKey, publicKey: authorPublicKey, type: "ed25519" };

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
        if (server) {
            await server.stop();
        }
        resetPlebbitLoaderForTest();
    });

    it("should extract provider names from OAuth identities", async () => {
        // Create a session and link it to a publication
        const payload = await createEvaluatePayload();
        const response = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload);
        const { sessionId } = response.json();

        // Mark session as completed with OAuth identity
        server.db.updateChallengeSessionStatus(sessionId, "completed", Date.now(), "github:12345");

        // Get providers for the author
        const providers = server.db.getAuthorOAuthProviders(authorSigner.publicKey);
        expect(providers).toContain("github");
    });

    it("should return empty array for author with no OAuth history", async () => {
        const providers = server.db.getAuthorOAuthProviders("unknown-public-key");
        expect(providers).toEqual([]);
    });

    it("should return multiple providers when author has used several", async () => {
        // Create first session with github
        const payload1 = await createEvaluatePayload({ commentOverrides: { content: "test1" } });
        const response1 = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload1);
        const { sessionId: sessionId1 } = response1.json();
        server.db.updateChallengeSessionStatus(sessionId1, "completed", Date.now(), "github:12345");

        // Create second session with google
        const payload2 = await createEvaluatePayload({ commentOverrides: { content: "test2" } });
        const response2 = await injectCbor(server.fastify, "POST", "/api/v1/evaluate", payload2);
        const { sessionId: sessionId2 } = response2.json();
        server.db.updateChallengeSessionStatus(sessionId2, "completed", Date.now(), "google:67890");

        // Get providers for the author
        const providers = server.db.getAuthorOAuthProviders(authorSigner.publicKey);
        expect(providers).toContain("github");
        expect(providers).toContain("google");
        expect(providers).toHaveLength(2);
    });
});
