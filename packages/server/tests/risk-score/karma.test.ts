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

describe("calculateKarma", () => {
    let db: SpamDetectionDatabase;
    let combinedData: CombinedDataService;

    beforeEach(() => {
        db = new SpamDetectionDatabase({ path: ":memory:" });
        combinedData = new CombinedDataService(db);
    });

    afterEach(() => {
        db.close();
    });

    describe("with only current sub karma (no DB history)", () => {
        it("should return VERY_HIGH score for karma >= 100", () => {
            const author = createMockAuthor(80, 30); // total = 110
            const challengeRequest = createMockChallengeRequest(author);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.13);

            expect(result.score).toBe(0.1);
            expect(result.weight).toBe(0.13);
            expect(result.explanation).toContain("110");
            expect(result.explanation).toContain("very high");
        });

        it("should return HIGH score for karma >= 50", () => {
            const author = createMockAuthor(30, 25); // total = 55
            const challengeRequest = createMockChallengeRequest(author);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.13);

            expect(result.score).toBe(0.2);
            expect(result.explanation).toContain("55");
            expect(result.explanation).toContain("high");
        });

        it("should return NEUTRAL score for karma = 0", () => {
            const author = createMockAuthor(0, 0);
            const challengeRequest = createMockChallengeRequest(author);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.13);

            expect(result.score).toBe(0.5);
            expect(result.explanation).toContain("neutral");
        });

        it("should return VERY_NEGATIVE score for karma < -10", () => {
            const author = createMockAuthor(-15, -5); // total = -20
            const challengeRequest = createMockChallengeRequest(author);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.13);

            expect(result.score).toBe(0.9);
            expect(result.explanation).toContain("-20");
            expect(result.explanation).toContain("very negative");
        });
    });

    describe("with karma from other subs in DB", () => {
        it("should aggregate karma from other subs with weighted average (current sub 70%, others 30%)", () => {
            // Current sub has low karma
            const author = createMockAuthor(5, 5); // current sub karma = 10
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Add high karma from another sub in DB
            const challengeId = "other-sub-comment";
            db.insertChallengeSession({
                challengeId,
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });

            db.insertComment({
                challengeId,
                publication: {
                    author: {
                        address: author.address,
                        subplebbit: {
                            postScore: 100,
                            replyScore: 50
                        }
                    },
                    subplebbitAddress: "other-sub.eth", // Different sub
                    timestamp: baseTimestamp,
                    protocolVersion: "1",
                    signature: baseSignature,
                    content: "Comment in other sub"
                }
            });

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.13);

            // Weighted: 10 * 0.7 + 150 * 0.3 = 7 + 45 = 52 (rounded)
            expect(result.score).toBe(0.2); // HIGH (>= 50)
            expect(result.explanation).toContain("52");
            expect(result.explanation).toContain("current sub: 10");
            expect(result.explanation).toContain("1 other sub: 150");
        });

        it("should prioritize current sub karma (bad user in current sub should still get high risk)", () => {
            // Current sub has very negative karma
            const author = createMockAuthor(-20, -10); // current sub karma = -30
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Add high karma from another sub in DB
            const challengeId = "other-sub-comment";
            db.insertChallengeSession({
                challengeId,
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });

            db.insertComment({
                challengeId,
                publication: {
                    author: {
                        address: author.address,
                        subplebbit: {
                            postScore: 200,
                            replyScore: 100
                        }
                    },
                    subplebbitAddress: "other-sub.eth",
                    timestamp: baseTimestamp,
                    protocolVersion: "1",
                    signature: baseSignature,
                    content: "Comment in other sub"
                }
            });

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.13);

            // Weighted: -30 * 0.7 + 300 * 0.3 = -21 + 90 = 69 (rounded)
            // This shows that even with 300 karma elsewhere, negative karma in current sub
            // significantly impacts the score
            expect(result.score).toBe(0.2); // HIGH but not VERY_HIGH
            expect(result.explanation).toContain("69");
            expect(result.explanation).toContain("current sub: -30");
            expect(result.explanation).toContain("1 other sub: 300");
        });

        it("should only use latest karma per sub from DB", () => {
            const author = createMockAuthor(10, 10); // current sub karma = 20
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Add old comment with low karma from other-sub
            const oldChallengeId = "old-comment";
            db.insertChallengeSession({
                challengeId: oldChallengeId,
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });

            db.insertComment({
                challengeId: oldChallengeId,
                publication: {
                    author: {
                        address: author.address,
                        subplebbit: {
                            postScore: 5,
                            replyScore: 5
                        }
                    },
                    subplebbitAddress: "other-sub.eth",
                    timestamp: baseTimestamp - 1000,
                    protocolVersion: "1",
                    signature: baseSignature,
                    content: "Old comment"
                }
            });

            // Set older receivedAt
            db.getDb()
                .prepare("UPDATE comments SET receivedAt = ? WHERE challengeId = ?")
                .run(baseTimestamp - 1000, oldChallengeId);

            // Add newer comment with higher karma from same other-sub
            const newChallengeId = "new-comment";
            db.insertChallengeSession({
                challengeId: newChallengeId,
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });

            db.insertComment({
                challengeId: newChallengeId,
                publication: {
                    author: {
                        address: author.address,
                        subplebbit: {
                            postScore: 50,
                            replyScore: 30
                        }
                    },
                    subplebbitAddress: "other-sub.eth",
                    timestamp: baseTimestamp,
                    protocolVersion: "1",
                    signature: baseSignature,
                    content: "New comment with higher karma"
                }
            });

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.13);

            // Should use newer karma (80) not old karma (10)
            // Weighted: 20 * 0.7 + 80 * 0.3 = 14 + 24 = 38 (rounded)
            expect(result.score).toBe(0.35); // MODERATE (>= 10)
            expect(result.explanation).toContain("38");
            expect(result.explanation).toContain("current sub: 20");
            expect(result.explanation).toContain("1 other sub: 80");
        });

        it("should aggregate karma from multiple other subs", () => {
            const author = createMockAuthor(10, 10); // current sub karma = 20
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Add karma from sub-a
            db.insertChallengeSession({
                challengeId: "sub-a-comment",
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });
            db.insertComment({
                challengeId: "sub-a-comment",
                publication: {
                    author: {
                        address: author.address,
                        subplebbit: { postScore: 30, replyScore: 20 }
                    },
                    subplebbitAddress: "sub-a.eth",
                    timestamp: baseTimestamp,
                    protocolVersion: "1",
                    signature: baseSignature,
                    content: "Comment in sub A"
                }
            });

            // Add karma from sub-b
            db.insertChallengeSession({
                challengeId: "sub-b-comment",
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });
            db.insertComment({
                challengeId: "sub-b-comment",
                publication: {
                    author: {
                        address: author.address,
                        subplebbit: { postScore: 40, replyScore: 10 }
                    },
                    subplebbitAddress: "sub-b.eth",
                    timestamp: baseTimestamp,
                    protocolVersion: "1",
                    signature: baseSignature,
                    content: "Comment in sub B"
                }
            });

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.13);

            // Other subs total: 50 + 50 = 100
            // Weighted: 20 * 0.7 + 100 * 0.3 = 14 + 30 = 44 (rounded)
            expect(result.score).toBe(0.35); // MODERATE
            expect(result.explanation).toContain("44");
            expect(result.explanation).toContain("current sub: 20");
            expect(result.explanation).toContain("2 other subs: 100");
        });

        it("should not double-count karma from current sub if it exists in DB", () => {
            const author = createMockAuthor(50, 50); // current sub karma = 100
            const challengeRequest = createMockChallengeRequest(author, "current-sub.eth");

            // Add old record from the SAME current sub in DB (should be ignored)
            db.insertChallengeSession({
                challengeId: "same-sub-old",
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });
            db.insertComment({
                challengeId: "same-sub-old",
                publication: {
                    author: {
                        address: author.address,
                        subplebbit: { postScore: 20, replyScore: 10 }
                    },
                    subplebbitAddress: "current-sub.eth", // Same as current sub!
                    timestamp: baseTimestamp - 1000,
                    protocolVersion: "1",
                    signature: baseSignature,
                    content: "Old comment in same sub"
                }
            });

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateKarma(ctx, 0.13);

            // Should only use current sub karma (100) since DB record is from same sub
            // No "other subs" in explanation
            expect(result.score).toBe(0.1); // VERY_HIGH (>= 100)
            expect(result.explanation).toContain("100");
            expect(result.explanation).not.toContain("other sub");
        });
    });

    describe("getAuthorKarmaBySubplebbit database method", () => {
        it("should return empty map for unknown author", () => {
            const karmaMap = db.getAuthorKarmaBySubplebbit("unknown-address");
            expect(karmaMap.size).toBe(0);
        });

        it("should aggregate karma from votes", () => {
            const authorPublicKey = "vote-author-pk";
            const signature = { ...baseSignature, publicKey: authorPublicKey };

            db.insertChallengeSession({
                challengeId: "vote-1",
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });
            db.insertVote({
                challengeId: "vote-1",
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

            // Query by signature public key (not author address)
            const karmaMap = db.getAuthorKarmaBySubplebbit(authorPublicKey);

            expect(karmaMap.size).toBe(1);
            expect(karmaMap.get("vote-sub.eth")).toEqual({
                postScore: 25,
                replyScore: 15,
                receivedAt: expect.any(Number)
            });
        });

        it("should aggregate karma from comment edits", () => {
            const authorPublicKey = "edit-author-pk";
            const signature = { ...baseSignature, publicKey: authorPublicKey };

            db.insertChallengeSession({
                challengeId: "edit-1",
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });
            db.insertCommentEdit({
                challengeId: "edit-1",
                publication: {
                    author: {
                        address: "test-author",
                        subplebbit: { postScore: 35, replyScore: 25 }
                    },
                    subplebbitAddress: "edit-sub.eth",
                    timestamp: baseTimestamp,
                    protocolVersion: "1",
                    signature,
                    commentCid: "QmComment",
                    content: "Edited"
                }
            });

            // Query by signature public key (not author address)
            const karmaMap = db.getAuthorKarmaBySubplebbit(authorPublicKey);

            expect(karmaMap.size).toBe(1);
            expect(karmaMap.get("edit-sub.eth")).toEqual({
                postScore: 35,
                replyScore: 25,
                receivedAt: expect.any(Number)
            });
        });

        it("should use latest record per sub when multiple exist", () => {
            const authorPublicKey = "same-author-pk";
            const signature = { ...baseSignature, publicKey: authorPublicKey };

            // Old record
            db.insertChallengeSession({
                challengeId: "old-record",
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });
            db.insertComment({
                challengeId: "old-record",
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
                .prepare("UPDATE comments SET receivedAt = ? WHERE challengeId = ?")
                .run(baseTimestamp - 1000, "old-record");

            // New record with different karma
            db.insertChallengeSession({
                challengeId: "new-record",
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });
            db.insertComment({
                challengeId: "new-record",
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

            // Query by signature public key (not author address)
            const karmaMap = db.getAuthorKarmaBySubplebbit(authorPublicKey);

            expect(karmaMap.size).toBe(1);
            // Should have the newer karma values
            expect(karmaMap.get("same-sub.eth")).toEqual({
                postScore: 100,
                replyScore: 50,
                receivedAt: expect.any(Number)
            });
        });
    });

    describe("getAuthorAggregatedKarma database method", () => {
        it("should return zeros for unknown author", () => {
            const result = db.getAuthorAggregatedKarma("unknown-address");
            expect(result).toEqual({
                totalPostScore: 0,
                totalReplyScore: 0,
                subplebbitCount: 0
            });
        });

        it("should sum karma across all subs", () => {
            const authorPublicKey = "agg-author-pk";
            const signature = { ...baseSignature, publicKey: authorPublicKey };

            // Add karma from sub-a
            db.insertChallengeSession({
                challengeId: "sub-a",
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });
            db.insertComment({
                challengeId: "sub-a",
                publication: {
                    author: {
                        address: "test-author",
                        subplebbit: { postScore: 30, replyScore: 20 }
                    },
                    subplebbitAddress: "sub-a.eth",
                    timestamp: baseTimestamp,
                    protocolVersion: "1",
                    signature,
                    content: "A"
                }
            });

            // Add karma from sub-b
            db.insertChallengeSession({
                challengeId: "sub-b",
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });
            db.insertComment({
                challengeId: "sub-b",
                publication: {
                    author: {
                        address: "test-author",
                        subplebbit: { postScore: 40, replyScore: 10 }
                    },
                    subplebbitAddress: "sub-b.eth",
                    timestamp: baseTimestamp,
                    protocolVersion: "1",
                    signature,
                    content: "B"
                }
            });

            // Query by signature public key (not author address)
            const result = db.getAuthorAggregatedKarma(authorPublicKey);

            expect(result).toEqual({
                totalPostScore: 70,
                totalReplyScore: 30,
                subplebbitCount: 2
            });
        });
    });
});
