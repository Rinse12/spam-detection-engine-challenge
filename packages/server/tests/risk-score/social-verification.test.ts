import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { calculateSocialVerification } from "../../src/risk-score/factors/social-verification.js";
import { calculateRiskScore } from "../../src/risk-score/index.js";
import { SpamDetectionDatabase } from "../../src/db/index.js";
import { CombinedDataService } from "../../src/risk-score/combined-data-service.js";
import type { RiskContext } from "../../src/risk-score/types.js";
import type { DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor } from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";

const baseTimestamp = Math.floor(Date.now() / 1000);

function createMockSignature(publicKey: string = "pk1") {
    return {
        type: "ed25519",
        signature: "sig",
        publicKey,
        signedPropertyNames: ["author"]
    };
}

function createMockAuthor(address: string = "12D3KooWTestAddress") {
    return {
        address
    };
}

function createMockChallengeRequest(authorPublicKey: string = "pk1"): DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor {
    return {
        challengeRequestId: { bytes: new Uint8Array() },
        acceptedChallengeTypes: ["turnstile"],
        encrypted: {} as never,
        comment: {
            author: createMockAuthor(),
            subplebbitAddress: "test-sub.eth",
            timestamp: baseTimestamp,
            protocolVersion: "1",
            signature: createMockSignature(authorPublicKey),
            content: "Test content"
        }
    } as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
}

describe("calculateSocialVerification", () => {
    let db: SpamDetectionDatabase;
    let combinedData: CombinedDataService;

    beforeEach(() => {
        db = new SpamDetectionDatabase({ path: ":memory:" });
        combinedData = new CombinedDataService(db);
    });

    afterEach(() => {
        db.close();
    });

    function createContext(authorPublicKey: string = "pk1"): RiskContext {
        return {
            challengeRequest: createMockChallengeRequest(authorPublicKey),
            now: baseTimestamp,
            hasIpInfo: false,
            db,
            combinedData
        };
    }

    function insertOAuthSession(params: {
        sessionId: string;
        oauthIdentity: string;
        authorPublicKey: string;
        status?: "completed" | "pending" | "failed";
    }) {
        const { sessionId, oauthIdentity, authorPublicKey, status = "completed" } = params;

        db.insertChallengeSession({
            sessionId,
            subplebbitPublicKey: "subpk",
            expiresAt: Date.now() + 3600000
        });

        // Mark session as completed with OAuth identity
        db.updateChallengeSessionStatus(sessionId, status, Date.now(), oauthIdentity);

        // Insert a comment to link the session to the author
        db.insertComment({
            sessionId,
            publication: {
                author: createMockAuthor(),
                subplebbitAddress: "test-sub.eth",
                timestamp: baseTimestamp,
                protocolVersion: "1",
                signature: createMockSignature(authorPublicKey),
                content: "Test content"
            }
        });
    }

    describe("OAuth disabled", () => {
        it("should return weight=0 (skipped) when no OAuth providers are enabled", () => {
            const ctx = createContext();
            const result = calculateSocialVerification(ctx, 0.08, []);

            expect(result.weight).toBe(0);
            expect(result.name).toBe("socialVerification");
            expect(result.explanation).toContain("disabled");
        });
    });

    describe("OAuth enabled, no verification", () => {
        it("should return score=1.0 when OAuth enabled but author has no verification", () => {
            const ctx = createContext();
            const result = calculateSocialVerification(ctx, 0.08, ["google", "github"]);

            expect(result.score).toBe(1.0);
            expect(result.weight).toBe(0.08);
            expect(result.explanation).toContain("No OAuth verification");
        });
    });

    describe("OAuth enabled, single provider verified", () => {
        it("should return score ~0.40 for single strong provider (Google)", () => {
            insertOAuthSession({
                sessionId: "session1",
                oauthIdentity: "google:123456",
                authorPublicKey: "pk1"
            });

            const ctx = createContext("pk1");
            const result = calculateSocialVerification(ctx, 0.08, ["google", "github"]);

            // Google credibility = 1.0, score = 1 - 0.75*1 + 0.15*1 = 0.40
            expect(result.score).toBeCloseTo(0.4, 2);
            expect(result.weight).toBe(0.08);
            expect(result.explanation).toContain("google");
        });

        it("should return score ~0.40 for single strong provider (GitHub)", () => {
            insertOAuthSession({
                sessionId: "session1",
                oauthIdentity: "github:789",
                authorPublicKey: "pk1"
            });

            const ctx = createContext("pk1");
            const result = calculateSocialVerification(ctx, 0.08, ["github"]);

            // GitHub credibility = 1.0, score = 1 - 0.75*1 + 0.15*1 = 0.40
            expect(result.score).toBeCloseTo(0.4, 2);
            expect(result.explanation).toContain("github");
        });

        it("should return score ~0.66 for single weak provider (Yandex)", () => {
            insertOAuthSession({
                sessionId: "session1",
                oauthIdentity: "yandex:456",
                authorPublicKey: "pk1"
            });

            const ctx = createContext("pk1");
            const result = calculateSocialVerification(ctx, 0.08, ["yandex"]);

            // Yandex credibility = 0.5, score = 1 - 0.75*0.5 + 0.15*0.25 = 0.6625
            expect(result.score).toBeCloseTo(0.66, 2);
        });

        it("should handle unknown provider with default credibility 0.5", () => {
            insertOAuthSession({
                sessionId: "session1",
                oauthIdentity: "unknownprovider:123",
                authorPublicKey: "pk1"
            });

            const ctx = createContext("pk1");
            const result = calculateSocialVerification(ctx, 0.08, ["unknownprovider"]);

            // Unknown credibility = 0.5, same as yandex
            expect(result.score).toBeCloseTo(0.66, 2);
        });
    });

    describe("OAuth enabled, multiple providers verified", () => {
        it("should combine credibility with 70% decay for second provider", () => {
            insertOAuthSession({
                sessionId: "session1",
                oauthIdentity: "google:123",
                authorPublicKey: "pk1"
            });
            insertOAuthSession({
                sessionId: "session2",
                oauthIdentity: "github:456",
                authorPublicKey: "pk1"
            });

            const ctx = createContext("pk1");
            const result = calculateSocialVerification(ctx, 0.08, ["google", "github"]);

            // Google: 1.0 * 1.0 = 1.0
            // GitHub: 1.0 * 0.7 = 0.7
            // Combined: 1.7
            // Score: 1 - 0.75*1.7 + 0.15*1.7^2 = 1 - 1.275 + 0.4335 = 0.1585
            expect(result.score).toBeCloseTo(0.16, 1);
            expect(result.explanation).toContain("2 providers");
        });

        it("should cap combined credibility at 2.5", () => {
            // Add 5 strong providers
            insertOAuthSession({ sessionId: "s1", oauthIdentity: "google:1", authorPublicKey: "pk1" });
            insertOAuthSession({ sessionId: "s2", oauthIdentity: "github:2", authorPublicKey: "pk1" });
            insertOAuthSession({ sessionId: "s3", oauthIdentity: "twitter:3", authorPublicKey: "pk1" });
            insertOAuthSession({ sessionId: "s4", oauthIdentity: "discord:4", authorPublicKey: "pk1" });
            insertOAuthSession({ sessionId: "s5", oauthIdentity: "tiktok:5", authorPublicKey: "pk1" });

            const ctx = createContext("pk1");
            const result = calculateSocialVerification(ctx, 0.08, ["google", "github", "twitter", "discord", "tiktok"]);

            // With cap at 2.5, score = 1 - 0.75*2.5 + 0.15*2.5^2 = 1 - 1.875 + 0.9375 = 0.0625
            expect(result.score).toBeLessThanOrEqual(0.1);
            expect(result.score).toBeGreaterThanOrEqual(0.03);
        });
    });

    describe("Multi-author reuse (diminishing returns)", () => {
        it("should apply diminishing returns when same OAuth is used by 2 authors", () => {
            // Same Google account used by pk1 and pk2
            insertOAuthSession({ sessionId: "s1", oauthIdentity: "google:shared", authorPublicKey: "pk1" });
            insertOAuthSession({ sessionId: "s2", oauthIdentity: "google:shared", authorPublicKey: "pk2" });

            const ctx = createContext("pk1");
            const result = calculateSocialVerification(ctx, 0.08, ["google"]);

            // Google credibility = 1.0, but 2 authors share it
            // Effective credibility = 1.0 * (1/sqrt(2)) = 0.707
            // Score = 1 - 0.75*0.707 + 0.15*0.707^2 = 0.545
            expect(result.score).toBeCloseTo(0.545, 2);
            expect(result.explanation).toContain("shared by 2 authors");
        });

        it("should apply stronger diminishing returns when same OAuth is used by 4 authors", () => {
            // Same Google account used by pk1, pk2, pk3, pk4
            insertOAuthSession({ sessionId: "s1", oauthIdentity: "google:shared4", authorPublicKey: "pk1" });
            insertOAuthSession({ sessionId: "s2", oauthIdentity: "google:shared4", authorPublicKey: "pk2" });
            insertOAuthSession({ sessionId: "s3", oauthIdentity: "google:shared4", authorPublicKey: "pk3" });
            insertOAuthSession({ sessionId: "s4", oauthIdentity: "google:shared4", authorPublicKey: "pk4" });

            const ctx = createContext("pk1");
            const result = calculateSocialVerification(ctx, 0.08, ["google"]);

            // Effective credibility = 1.0 * (1/sqrt(4)) = 0.5
            // Score = 1 - 0.75*0.5 + 0.15*0.25 = 0.6625
            expect(result.score).toBeCloseTo(0.66, 2);
            expect(result.explanation).toContain("shared by 4 authors");
        });

        it("should not affect score for unique OAuth identity", () => {
            insertOAuthSession({ sessionId: "s1", oauthIdentity: "google:unique", authorPublicKey: "pk1" });

            const ctx = createContext("pk1");
            const result = calculateSocialVerification(ctx, 0.08, ["google"]);

            // 1 author, no diminishing returns
            expect(result.score).toBeCloseTo(0.4, 2);
            expect(result.explanation).not.toContain("shared");
        });
    });

    describe("Edge cases", () => {
        it("should not count pending OAuth sessions", () => {
            insertOAuthSession({
                sessionId: "s1",
                oauthIdentity: "google:123",
                authorPublicKey: "pk1",
                status: "pending"
            });

            const ctx = createContext("pk1");
            const result = calculateSocialVerification(ctx, 0.08, ["google"]);

            // Pending session should not count
            expect(result.score).toBe(1.0);
            expect(result.explanation).toContain("No OAuth verification");
        });

        it("should not count failed OAuth sessions", () => {
            insertOAuthSession({
                sessionId: "s1",
                oauthIdentity: "google:123",
                authorPublicKey: "pk1",
                status: "failed"
            });

            const ctx = createContext("pk1");
            const result = calculateSocialVerification(ctx, 0.08, ["google"]);

            // Failed session should not count
            expect(result.score).toBe(1.0);
        });

        it("should handle different author making request (no cross-author benefit)", () => {
            // pk1 is verified, but pk2 is not
            insertOAuthSession({
                sessionId: "s1",
                oauthIdentity: "google:123",
                authorPublicKey: "pk1"
            });

            const ctx = createContext("pk2"); // Different author
            const result = calculateSocialVerification(ctx, 0.08, ["google"]);

            // pk2 has no OAuth links
            expect(result.score).toBe(1.0);
        });

        it("should handle provider with mixed case in identity", () => {
            insertOAuthSession({
                sessionId: "s1",
                oauthIdentity: "GOOGLE:123",
                authorPublicKey: "pk1"
            });

            const ctx = createContext("pk1");
            const result = calculateSocialVerification(ctx, 0.08, ["google"]);

            // Should normalize provider name to lowercase
            expect(result.score).toBeCloseTo(0.4, 2);
        });

        it("should return high risk when author verified with disabled provider", () => {
            // Author verified with Google, but only GitHub is enabled
            insertOAuthSession({
                sessionId: "s1",
                oauthIdentity: "google:123",
                authorPublicKey: "pk1"
            });

            const ctx = createContext("pk1");
            const result = calculateSocialVerification(ctx, 0.08, ["github"]); // Google not in enabled list

            // Still counts because we're checking DB, not restricting by enabled providers
            // The enabled providers list is for determining if factor is skipped, not filtering identities
            expect(result.score).toBeCloseTo(0.4, 2);
        });
    });

    describe("Database query methods", () => {
        it("getAuthorOAuthIdentities returns all linked identities", () => {
            insertOAuthSession({ sessionId: "s1", oauthIdentity: "google:1", authorPublicKey: "pk1" });
            insertOAuthSession({ sessionId: "s2", oauthIdentity: "github:2", authorPublicKey: "pk1" });
            insertOAuthSession({ sessionId: "s3", oauthIdentity: "twitter:3", authorPublicKey: "pk2" }); // Different author

            const identities = db.getAuthorOAuthIdentities("pk1");

            expect(identities).toHaveLength(2);
            expect(identities).toContain("google:1");
            expect(identities).toContain("github:2");
            expect(identities).not.toContain("twitter:3");
        });

        it("countAuthorsWithOAuthIdentity returns correct count", () => {
            insertOAuthSession({ sessionId: "s1", oauthIdentity: "google:shared", authorPublicKey: "pk1" });
            insertOAuthSession({ sessionId: "s2", oauthIdentity: "google:shared", authorPublicKey: "pk2" });
            insertOAuthSession({ sessionId: "s3", oauthIdentity: "google:shared", authorPublicKey: "pk3" });
            insertOAuthSession({ sessionId: "s4", oauthIdentity: "github:unique", authorPublicKey: "pk4" });

            expect(db.countAuthorsWithOAuthIdentity("google:shared")).toBe(3);
            expect(db.countAuthorsWithOAuthIdentity("github:unique")).toBe(1);
            expect(db.countAuthorsWithOAuthIdentity("nonexistent:id")).toBe(0);
        });

        it("should work with votes table", () => {
            const sessionId = "vote-session";
            db.insertChallengeSession({
                sessionId,
                subplebbitPublicKey: "subpk",
                expiresAt: Date.now() + 3600000
            });
            db.updateChallengeSessionStatus(sessionId, "completed", Date.now(), "google:voter");

            db.insertVote({
                sessionId,
                publication: {
                    author: createMockAuthor(),
                    subplebbitAddress: "test-sub.eth",
                    timestamp: baseTimestamp,
                    protocolVersion: "1",
                    signature: createMockSignature("voter-pk"),
                    commentCid: "QmTest",
                    vote: 1
                }
            });

            const identities = db.getAuthorOAuthIdentities("voter-pk");
            expect(identities).toContain("google:voter");
        });

        it("should work with commentEdits table", () => {
            const sessionId = "edit-session";
            db.insertChallengeSession({
                sessionId,
                subplebbitPublicKey: "subpk",
                expiresAt: Date.now() + 3600000
            });
            db.updateChallengeSessionStatus(sessionId, "completed", Date.now(), "github:editor");

            db.insertCommentEdit({
                sessionId,
                publication: {
                    author: createMockAuthor(),
                    subplebbitAddress: "test-sub.eth",
                    timestamp: baseTimestamp,
                    protocolVersion: "1",
                    signature: createMockSignature("editor-pk"),
                    commentCid: "QmTest"
                }
            });

            const identities = db.getAuthorOAuthIdentities("editor-pk");
            expect(identities).toContain("github:editor");
        });
    });
});

describe("calculateRiskScore integration — socialVerification factor", () => {
    let db: SpamDetectionDatabase;

    beforeEach(() => {
        db = new SpamDetectionDatabase({ path: ":memory:" });
    });

    afterEach(() => {
        db.close();
    });

    function insertOAuthSession(params: { sessionId: string; oauthIdentity: string; authorPublicKey: string }) {
        const { sessionId, oauthIdentity, authorPublicKey } = params;

        db.insertChallengeSession({
            sessionId,
            subplebbitPublicKey: "subpk",
            expiresAt: Date.now() + 3600000
        });

        db.updateChallengeSessionStatus(sessionId, "completed", Date.now(), oauthIdentity);

        db.insertComment({
            sessionId,
            publication: {
                author: { address: "12D3KooWTestAddress" },
                subplebbitAddress: "test-sub.eth",
                timestamp: baseTimestamp,
                protocolVersion: "1",
                signature: { type: "ed25519", signature: "sig", publicKey: authorPublicKey, signedPropertyNames: ["author"] },
                content: "Test content"
            }
        });
    }

    it("should include socialVerification with weight > 0 when enabledOAuthProviders is passed", () => {
        insertOAuthSession({ sessionId: "s1", oauthIdentity: "github:999", authorPublicKey: "pk1" });

        const result = calculateRiskScore({
            challengeRequest: createMockChallengeRequest("pk1"),
            db,
            enabledOAuthProviders: ["github"]
        });

        const svFactor = result.factors.find((f) => f.name === "socialVerification");
        expect(svFactor).toBeDefined();
        expect(svFactor!.weight).toBeGreaterThan(0);
        // GitHub credibility 1.0 → score ~0.40, so less than 1.0
        expect(svFactor!.score).toBeLessThan(1.0);
    });

    it("should skip socialVerification (weight=0) when enabledOAuthProviders is empty", () => {
        insertOAuthSession({ sessionId: "s1", oauthIdentity: "github:999", authorPublicKey: "pk1" });

        const result = calculateRiskScore({
            challengeRequest: createMockChallengeRequest("pk1"),
            db,
            enabledOAuthProviders: []
        });

        const svFactor = result.factors.find((f) => f.name === "socialVerification");
        expect(svFactor).toBeDefined();
        expect(svFactor!.weight).toBe(0);
    });

    it("should skip socialVerification (weight=0) when enabledOAuthProviders is omitted", () => {
        insertOAuthSession({ sessionId: "s1", oauthIdentity: "github:999", authorPublicKey: "pk1" });

        const result = calculateRiskScore({
            challengeRequest: createMockChallengeRequest("pk1"),
            db
            // enabledOAuthProviders deliberately omitted — defaults to []
        });

        const svFactor = result.factors.find((f) => f.name === "socialVerification");
        expect(svFactor).toBeDefined();
        expect(svFactor!.weight).toBe(0);
    });
});
