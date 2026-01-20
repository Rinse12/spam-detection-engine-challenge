import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { calculateKarma } from "../../src/risk-score/factors/karma.js";
import { SpamDetectionDatabase } from "../../src/db/index.js";
import { CombinedDataService } from "../../src/risk-score/combined-data-service.js";
import type { RiskContext } from "../../src/risk-score/types.js";
import type { DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor } from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";

const baseTimestamp = Math.floor(Date.now() / 1000);
const baseSignature = {
    type: "ed25519",
    signature: "sig",
    publicKey: "pk",
    signedPropertyNames: ["author"]
};

function createMockAuthor(postScore: number, replyScore: number) {
    return {
        address: "12D3KooWTestAddress",
        subplebbit: {
            postScore,
            replyScore,
            firstCommentTimestamp: baseTimestamp - 86400,
            lastCommentCid: "QmYwAPJzv5CZsnAzt8auVZRn9p6nxfZmZ75W6rS4ju4Khu"
        }
    };
}

function createMockChallengeRequest(
    author: ReturnType<typeof createMockAuthor>,
    subplebbitAddress = "current-sub.eth"
): DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor {
    return {
        challengeRequestId: { bytes: new Uint8Array() },
        acceptedChallengeTypes: ["turnstile"],
        encrypted: {} as never,
        comment: {
            author,
            subplebbitAddress,
            timestamp: baseTimestamp,
            protocolVersion: "1",
            signature: baseSignature,
            content: "Test content"
        }
    } as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
}

function addKarmaFromSub(
    db: SpamDetectionDatabase,
    subplebbitAddress: string,
    postScore: number,
    replyScore: number,
    authorAddress = "12D3KooWTestAddress"
) {
    const sessionId = `session-${subplebbitAddress}-${Date.now()}-${Math.random()}`;
    db.insertChallengeSession({
        sessionId,
        subplebbitPublicKey: "pk",
        expiresAt: baseTimestamp + 3600
    });
    db.insertComment({
        sessionId,
        publication: {
            author: {
                address: authorAddress,
                subplebbit: { postScore, replyScore }
            },
            subplebbitAddress,
            timestamp: baseTimestamp,
            protocolVersion: "1",
            signature: baseSignature,
            content: "Comment"
        }
    });
}

describe("calculateKarma (count-based)", () => {
    let db: SpamDetectionDatabase;
    let combinedData: CombinedDataService;

    beforeEach(() => {
        db = new SpamDetectionDatabase({ path: ":memory:" });
        combinedData = new CombinedDataService(db);
    });

    afterEach(() => {
        db.close();
    });

    describe("no karma data", () => {
        it("should return NEUTRAL (0.5) when no karma data exists", () => {
            const author = createMockAuthor(0, 0); // Zero karma in current sub
            const challengeRequest = createMockChallengeRequest(author);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.1);

            expect(result.score).toBe(0.5);
            expect(result.explanation).toContain("no karma data");
        });
    });

    describe("single sub with karma", () => {
        it("should return SLIGHTLY_POSITIVE (0.35) for 1 sub with positive karma", () => {
            const author = createMockAuthor(10, 5); // Positive karma in current sub
            const challengeRequest = createMockChallengeRequest(author);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.1);

            expect(result.score).toBe(0.35);
            expect(result.explanation).toContain("1 sub positive");
            expect(result.explanation).toContain("0 subs negative");
            expect(result.explanation).toContain("net +1");
            expect(result.explanation).toContain("generally positive");
        });

        it("should return SLIGHTLY_NEGATIVE (0.65) for 1 sub with negative karma", () => {
            const author = createMockAuthor(-10, -5); // Negative karma in current sub
            const challengeRequest = createMockChallengeRequest(author);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.1);

            expect(result.score).toBe(0.65);
            expect(result.explanation).toContain("0 subs positive");
            expect(result.explanation).toContain("1 sub negative");
            expect(result.explanation).toContain("net -1");
            expect(result.explanation).toContain("some concerns");
        });
    });

    describe("multiple subs with positive karma", () => {
        it("should return POSITIVE (0.2) for 3 subs with positive karma", () => {
            const author = createMockAuthor(10, 5); // Current sub positive
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Add 2 more positive subs from DB
            addKarmaFromSub(db, "sub-a.eth", 20, 10);
            addKarmaFromSub(db, "sub-b.eth", 15, 5);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.1);

            expect(result.score).toBe(0.2);
            expect(result.explanation).toContain("3 subs positive");
            expect(result.explanation).toContain("net +3");
            expect(result.explanation).toContain("trusted in multiple communities");
        });

        it("should return VERY_POSITIVE (0.1) for 5+ subs with positive karma", () => {
            const author = createMockAuthor(10, 5); // Current sub positive
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Add 4 more positive subs from DB
            addKarmaFromSub(db, "sub-a.eth", 20, 10);
            addKarmaFromSub(db, "sub-b.eth", 15, 5);
            addKarmaFromSub(db, "sub-c.eth", 30, 10);
            addKarmaFromSub(db, "sub-d.eth", 25, 15);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.1);

            expect(result.score).toBe(0.1);
            expect(result.explanation).toContain("5 subs positive");
            expect(result.explanation).toContain("net +5");
            expect(result.explanation).toContain("widely trusted");
        });
    });

    describe("multiple subs with negative karma", () => {
        it("should return NEGATIVE (0.8) for 3 subs with negative karma", () => {
            const author = createMockAuthor(-10, -5); // Current sub negative
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Add 2 more negative subs from DB
            addKarmaFromSub(db, "sub-a.eth", -20, -10);
            addKarmaFromSub(db, "sub-b.eth", -15, -5);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.1);

            expect(result.score).toBe(0.8);
            expect(result.explanation).toContain("3 subs negative");
            expect(result.explanation).toContain("net -3");
            expect(result.explanation).toContain("multiple communities flag issues");
        });

        it("should return VERY_NEGATIVE (0.9) for 5+ subs with negative karma", () => {
            const author = createMockAuthor(-10, -5); // Current sub negative
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Add 4 more negative subs from DB
            addKarmaFromSub(db, "sub-a.eth", -20, -10);
            addKarmaFromSub(db, "sub-b.eth", -15, -5);
            addKarmaFromSub(db, "sub-c.eth", -30, -10);
            addKarmaFromSub(db, "sub-d.eth", -25, -15);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.1);

            expect(result.score).toBe(0.9);
            expect(result.explanation).toContain("5 subs negative");
            expect(result.explanation).toContain("net -5");
            expect(result.explanation).toContain("widely mistrusted");
        });
    });

    describe("mixed karma (positive and negative subs)", () => {
        it("should return NEUTRAL (0.5) for balanced karma (1 positive, 1 negative)", () => {
            const author = createMockAuthor(10, 5); // Current sub positive
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Add 1 negative sub from DB
            addKarmaFromSub(db, "hostile-sub.eth", -100, -50);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.1);

            expect(result.score).toBe(0.5);
            expect(result.explanation).toContain("1 sub positive");
            expect(result.explanation).toContain("1 sub negative");
            expect(result.explanation).toContain("net +0");
            expect(result.explanation).toContain("mixed reputation");
        });

        it("should calculate net correctly with mixed subs (3 positive, 1 negative = net +2)", () => {
            const author = createMockAuthor(10, 5); // Current sub positive
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Add 2 positive and 1 negative
            addKarmaFromSub(db, "sub-a.eth", 20, 10);
            addKarmaFromSub(db, "sub-b.eth", 15, 5);
            addKarmaFromSub(db, "hostile-sub.eth", -100, -50);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.1);

            expect(result.score).toBe(0.35); // net +2 → SLIGHTLY_POSITIVE
            expect(result.explanation).toContain("3 subs positive");
            expect(result.explanation).toContain("1 sub negative");
            expect(result.explanation).toContain("net +2");
        });
    });

    describe("collusion resistance", () => {
        it("should NOT be affected by massive negative karma from a single hostile sub", () => {
            // Author has -1000 karma in 1 hostile sub, but +10 karma in 2 other subs
            const author = createMockAuthor(10, 5); // Current sub positive
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Add 1 positive sub and 1 hostile sub with massive negative karma
            addKarmaFromSub(db, "friendly-sub.eth", 20, 10);
            addKarmaFromSub(db, "hostile-sub.eth", -500, -500); // -1000 karma!

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.1);

            // Net = 2 positive - 1 negative = +1 → SLIGHTLY_POSITIVE
            // The -1000 karma only counts as 1 negative vote!
            expect(result.score).toBe(0.35);
            expect(result.explanation).toContain("2 subs positive");
            expect(result.explanation).toContain("1 sub negative");
            expect(result.explanation).toContain("net +1");
        });

        it("should NOT be boosted by massive positive karma from a single friendly sub", () => {
            // Author has +1000 karma in 1 sub, but negative in 2 others
            const author = createMockAuthor(-10, -5); // Current sub negative
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Add 1 sub with huge positive karma and 1 negative
            addKarmaFromSub(db, "friendly-sub.eth", 500, 500); // +1000 karma!
            addKarmaFromSub(db, "hostile-sub.eth", -20, -10);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.1);

            // Net = 1 positive - 2 negative = -1 → SLIGHTLY_NEGATIVE
            // The +1000 karma only counts as 1 positive vote!
            expect(result.score).toBe(0.65);
            expect(result.explanation).toContain("1 sub positive");
            expect(result.explanation).toContain("2 subs negative");
            expect(result.explanation).toContain("net -1");
        });
    });

    describe("current sub handling", () => {
        it("should count current sub as 1 vote (same as other subs)", () => {
            const author = createMockAuthor(100, 50); // High karma in current sub
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Add 1 negative sub
            addKarmaFromSub(db, "hostile-sub.eth", -10, -5);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.1);

            // Current sub's +150 karma counts as 1 positive vote
            // Net = 1 positive - 1 negative = 0
            expect(result.score).toBe(0.5);
            expect(result.explanation).toContain("1 sub positive");
            expect(result.explanation).toContain("1 sub negative");
            expect(result.explanation).toContain("net +0");
        });

        it("should use current sub karma from request (not DB) when both exist", () => {
            // Author's karma changed: was positive in DB, now negative in request
            const author = createMockAuthor(-20, -10); // Now negative in current sub
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Old DB record shows positive karma in current sub
            addKarmaFromSub(db, "current-sub.eth", 50, 30);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.1);

            // Should use request's karma (-30) not DB karma (+80)
            expect(result.score).toBe(0.65); // 0 positive, 1 negative = net -1
            expect(result.explanation).toContain("0 subs positive");
            expect(result.explanation).toContain("1 sub negative");
        });

        it("should not double-count current sub if it exists in DB", () => {
            const author = createMockAuthor(20, 10); // Positive in current sub
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // DB also has record for current sub (should be ignored)
            addKarmaFromSub(db, "current-sub.eth", 50, 30);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.1);

            // Should only count current sub once
            expect(result.score).toBe(0.35); // 1 positive, 0 negative
            expect(result.explanation).toContain("1 sub positive");
            expect(result.explanation).toContain("0 subs negative");
        });
    });

    describe("zero karma subs", () => {
        it("should not count subs with zero karma", () => {
            const author = createMockAuthor(0, 0); // Zero karma in current sub
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Add subs with zero karma
            addKarmaFromSub(db, "zero-sub-a.eth", 0, 0);
            addKarmaFromSub(db, "zero-sub-b.eth", 5, -5); // Also nets to 0

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.1);

            // No positive or negative subs
            expect(result.score).toBe(0.5);
            expect(result.explanation).toContain("no karma data");
        });
    });

    describe("database methods", () => {
        it("getAuthorKarmaBySubplebbit should return empty map for unknown author", () => {
            const karmaMap = db.getAuthorKarmaBySubplebbit("unknown-address");
            expect(karmaMap.size).toBe(0);
        });

        it("getAuthorKarmaBySubplebbit should aggregate from votes", () => {
            const authorPublicKey = "vote-author-pk";
            const signature = { ...baseSignature, publicKey: authorPublicKey };

            db.insertChallengeSession({
                sessionId: "vote-1",
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });
            db.insertVote({
                sessionId: "vote-1",
                publication: {
                    author: {
                        address: "test-author",
                        subplebbit: { postScore: 25, replyScore: 15 }
                    },
                    subplebbitAddress: "vote-sub.eth",
                    timestamp: baseTimestamp,
                    protocolVersion: "1",
                    signature,
                    commentCid: "QmComment",
                    vote: 1
                }
            });

            const karmaMap = db.getAuthorKarmaBySubplebbit(authorPublicKey);

            expect(karmaMap.size).toBe(1);
            expect(karmaMap.get("vote-sub.eth")).toEqual({
                postScore: 25,
                replyScore: 15,
                receivedAt: expect.any(Number)
            });
        });

        it("getAuthorKarmaBySubplebbit should use latest record per sub", () => {
            const authorPublicKey = "same-author-pk";
            const signature = { ...baseSignature, publicKey: authorPublicKey };

            // Old record
            db.insertChallengeSession({
                sessionId: "old-record",
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });
            db.insertComment({
                sessionId: "old-record",
                publication: {
                    author: {
                        address: "test-author",
                        subplebbit: { postScore: 10, replyScore: 5 }
                    },
                    subplebbitAddress: "same-sub.eth",
                    timestamp: baseTimestamp - 1000,
                    protocolVersion: "1",
                    signature,
                    content: "Old"
                }
            });
            db.getDb()
                .prepare("UPDATE comments SET receivedAt = ? WHERE sessionId = ?")
                .run((baseTimestamp - 1000) * 1000, "old-record");

            // New record with different karma
            db.insertChallengeSession({
                sessionId: "new-record",
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });
            db.insertComment({
                sessionId: "new-record",
                publication: {
                    author: {
                        address: "test-author",
                        subplebbit: { postScore: 100, replyScore: 50 }
                    },
                    subplebbitAddress: "same-sub.eth",
                    timestamp: baseTimestamp,
                    protocolVersion: "1",
                    signature,
                    content: "New"
                }
            });

            const karmaMap = db.getAuthorKarmaBySubplebbit(authorPublicKey);

            expect(karmaMap.size).toBe(1);
            expect(karmaMap.get("same-sub.eth")).toEqual({
                postScore: 100,
                replyScore: 50,
                receivedAt: expect.any(Number)
            });
        });
    });
});
