import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { calculateAccountAge } from "../../src/risk-score/factors/account-age.js";
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

const SECONDS_PER_DAY = 24 * 60 * 60;

function createMockAuthor(firstCommentTimestamp?: number) {
    return {
        address: "12D3KooWTestAddress",
        subplebbit: firstCommentTimestamp
            ? {
                  postScore: 0,
                  replyScore: 0,
                  firstCommentTimestamp,
                  lastCommentCid: "QmYwAPJzv5CZsnAzt8auVZRn9p6nxfZmZ75W6rS4ju4Khu"
              }
            : undefined
    };
}

function createMockChallengeRequest(author: ReturnType<typeof createMockAuthor>): DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor {
    return {
        challengeRequestId: { bytes: new Uint8Array() },
        acceptedChallengeTypes: ["turnstile"],
        encrypted: {} as never,
        comment: {
            author,
            subplebbitAddress: "test-sub.eth",
            timestamp: baseTimestamp,
            protocolVersion: "1",
            signature: baseSignature,
            content: "Test content"
        }
    } as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
}

describe("calculateAccountAge", () => {
    let db: SpamDetectionDatabase;
    let combinedData: CombinedDataService;

    beforeEach(() => {
        db = new SpamDetectionDatabase({ path: ":memory:" });
        combinedData = new CombinedDataService(db);
    });

    afterEach(() => {
        db.close();
    });

    describe("with no history", () => {
        it("should return NO_HISTORY score when author has no subplebbit data and no DB history", () => {
            const author = createMockAuthor(undefined);
            const challengeRequest = createMockChallengeRequest(author);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateAccountAge(ctx, 0.17);

            // No history = maximum risk (completely unknown author)
            expect(result.score).toBe(1.0);
            expect(result.weight).toBe(0.17);
            expect(result.explanation).toContain("No account history");
        });
    });

    describe("ignoring author.subplebbit.firstCommentTimestamp (security fix)", () => {
        it("should return NO_HISTORY even when firstCommentTimestamp claims old account", () => {
            // Subplebbit claims account is 400 days old, but we have no DB records
            // We should NOT trust this claim - it could be fabricated
            const firstCommentTimestamp = baseTimestamp - 400 * SECONDS_PER_DAY;
            const author = createMockAuthor(firstCommentTimestamp);
            const challengeRequest = createMockChallengeRequest(author);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateAccountAge(ctx, 0.17);

            // Should return NO_HISTORY because we don't trust firstCommentTimestamp
            expect(result.score).toBe(1.0);
            expect(result.explanation).toContain("No account history");
        });

        it("should return NO_HISTORY even when firstCommentTimestamp claims recent account", () => {
            // Even if subplebbit provides a firstCommentTimestamp, we ignore it
            const firstCommentTimestamp = baseTimestamp - 3 * SECONDS_PER_DAY;
            const author = createMockAuthor(firstCommentTimestamp);
            const challengeRequest = createMockChallengeRequest(author);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateAccountAge(ctx, 0.17);

            // Should return NO_HISTORY because we don't trust firstCommentTimestamp
            expect(result.score).toBe(1.0);
            expect(result.explanation).toContain("No account history");
        });
    });

    describe("using only DB history", () => {
        it("should use DB first seen timestamp when author.subplebbit has no firstCommentTimestamp", () => {
            const author = createMockAuthor(undefined);
            const challengeRequest = createMockChallengeRequest(author);

            // Insert a comment from this author 100 days ago in the DB
            const dbFirstSeen = baseTimestamp - 100 * SECONDS_PER_DAY;
            const sessionId = "old-comment-challenge";
            db.insertChallengeSession({
                sessionId,
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });

            // Manually set receivedAt to simulate old record
            db.getDb()
                .prepare("UPDATE challengeSessions SET receivedChallengeRequestAt = ? WHERE sessionId = ?")
                .run(dbFirstSeen, sessionId);

            db.insertComment({
                sessionId,
                publication: {
                    author: { address: author.address },
                    subplebbitAddress: "test-sub.eth",
                    timestamp: dbFirstSeen,
                    protocolVersion: "1",
                    signature: baseSignature,
                    content: "Old comment"
                }
            });

            // Manually update receivedAt on the comment
            db.getDb()
                .prepare("UPDATE comments SET receivedAt = ? WHERE sessionId = ?")
                .run(dbFirstSeen * 1000, sessionId);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateAccountAge(ctx, 0.17);

            // 100 days is between 90 and 365, so should be OLD score (0.2)
            expect(result.score).toBe(0.2);
            expect(result.explanation).toContain("100 days old");
            expect(result.explanation).toContain("established");
        });
    });

    describe("DB-only scoring (ignoring subplebbit claims)", () => {
        it("should use only DB timestamp even when subplebbit claims different age", () => {
            // Subplebbit says first comment was 30 days ago, but we ignore this
            const subplebbitFirstComment = baseTimestamp - 30 * SECONDS_PER_DAY;
            const author = createMockAuthor(subplebbitFirstComment);
            const challengeRequest = createMockChallengeRequest(author);

            // Our DB shows we saw them 200 days ago - this is what we trust
            const dbFirstSeen = baseTimestamp - 200 * SECONDS_PER_DAY;
            const sessionId = "very-old-comment";
            db.insertChallengeSession({
                sessionId,
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });

            db.insertComment({
                sessionId,
                publication: {
                    author: { address: author.address },
                    subplebbitAddress: "test-sub.eth",
                    timestamp: dbFirstSeen,
                    protocolVersion: "1",
                    signature: baseSignature,
                    content: "Very old comment"
                }
            });

            // Manually update receivedAt to the older timestamp (DB stores milliseconds)
            db.getDb()
                .prepare("UPDATE comments SET receivedAt = ? WHERE sessionId = ?")
                .run(dbFirstSeen * 1000, sessionId);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateAccountAge(ctx, 0.17);

            // Should use DB's 200 days -> OLD score (0.2)
            expect(result.score).toBe(0.2);
            expect(result.explanation).toContain("200 days old");
        });

        it("should NOT use subplebbit timestamp even when it claims older than DB", () => {
            // Subplebbit claims 500 days old - could be fabricated by malicious sub owner
            const subplebbitFirstComment = baseTimestamp - 500 * SECONDS_PER_DAY;
            const author = createMockAuthor(subplebbitFirstComment);
            const challengeRequest = createMockChallengeRequest(author);

            // Our DB only shows them from 10 days ago - this is what we trust
            const dbFirstSeen = baseTimestamp - 10 * SECONDS_PER_DAY;
            const sessionId = "recent-in-db";
            db.insertChallengeSession({
                sessionId,
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });

            db.insertComment({
                sessionId,
                publication: {
                    author: { address: author.address },
                    subplebbitAddress: "test-sub.eth",
                    timestamp: dbFirstSeen,
                    protocolVersion: "1",
                    signature: baseSignature,
                    content: "Recent comment in our DB"
                }
            });

            db.getDb()
                .prepare("UPDATE comments SET receivedAt = ? WHERE sessionId = ?")
                .run(dbFirstSeen * 1000, sessionId);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateAccountAge(ctx, 0.17);

            // Should use DB's 10 days (ignoring subplebbit's 500 claim) -> MODERATE score (0.5)
            expect(result.score).toBe(0.5);
            expect(result.explanation).toContain("10 days old");
        });
    });

    describe("DB first seen across different publication types", () => {
        it("should find oldest timestamp across votes", () => {
            const author = createMockAuthor(undefined);
            const challengeRequest = createMockChallengeRequest(author);

            // Insert a vote from 150 days ago
            const voteTime = baseTimestamp - 150 * SECONDS_PER_DAY;
            const sessionId = "old-vote";
            db.insertChallengeSession({
                sessionId,
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });

            db.insertVote({
                sessionId,
                publication: {
                    author: { address: author.address },
                    subplebbitAddress: "test-sub.eth",
                    timestamp: voteTime,
                    protocolVersion: "1",
                    signature: baseSignature,
                    commentCid: "QmComment",
                    vote: 1
                }
            });

            db.getDb()
                .prepare("UPDATE votes SET receivedAt = ? WHERE sessionId = ?")
                .run(voteTime * 1000, sessionId);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateAccountAge(ctx, 0.17);

            expect(result.score).toBe(0.2); // 150 days -> OLD
            expect(result.explanation).toContain("150 days old");
        });

        it("should find oldest timestamp across comment edits", () => {
            const author = createMockAuthor(undefined);
            const challengeRequest = createMockChallengeRequest(author);

            // Insert a comment edit from 45 days ago
            const editTime = baseTimestamp - 45 * SECONDS_PER_DAY;
            const sessionId = "old-edit";
            db.insertChallengeSession({
                sessionId,
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });

            db.insertCommentEdit({
                sessionId,
                publication: {
                    author: { address: author.address },
                    subplebbitAddress: "test-sub.eth",
                    timestamp: editTime,
                    protocolVersion: "1",
                    signature: baseSignature,
                    commentCid: "QmComment",
                    content: "Edited content"
                }
            });

            db.getDb()
                .prepare("UPDATE commentEdits SET receivedAt = ? WHERE sessionId = ?")
                .run(editTime * 1000, sessionId);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateAccountAge(ctx, 0.17);

            expect(result.score).toBe(0.35); // 45 days -> ESTABLISHED
            expect(result.explanation).toContain("45 days old");
        });

        it("should use the oldest timestamp across all publication types", () => {
            const author = createMockAuthor(undefined);
            const challengeRequest = createMockChallengeRequest(author);

            // Insert a vote from 50 days ago
            const voteTime = baseTimestamp - 50 * SECONDS_PER_DAY;
            db.insertChallengeSession({
                sessionId: "vote-challenge",
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });
            db.insertVote({
                sessionId: "vote-challenge",
                publication: {
                    author: { address: author.address },
                    subplebbitAddress: "test-sub.eth",
                    timestamp: voteTime,
                    protocolVersion: "1",
                    signature: baseSignature,
                    commentCid: "QmComment",
                    vote: 1
                }
            });
            db.getDb()
                .prepare("UPDATE votes SET receivedAt = ? WHERE sessionId = ?")
                .run(voteTime * 1000, "vote-challenge");

            // Insert a comment from 400 days ago (oldest)
            const commentTime = baseTimestamp - 400 * SECONDS_PER_DAY;
            db.insertChallengeSession({
                sessionId: "comment-challenge",
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });
            db.insertComment({
                sessionId: "comment-challenge",
                publication: {
                    author: { address: author.address },
                    subplebbitAddress: "test-sub.eth",
                    timestamp: commentTime,
                    protocolVersion: "1",
                    signature: baseSignature,
                    content: "Old comment"
                }
            });
            db.getDb()
                .prepare("UPDATE comments SET receivedAt = ? WHERE sessionId = ?")
                .run(commentTime * 1000, "comment-challenge");

            // Insert an edit from 20 days ago
            const editTime = baseTimestamp - 20 * SECONDS_PER_DAY;
            db.insertChallengeSession({
                sessionId: "edit-challenge",
                subplebbitPublicKey: "pk",
                expiresAt: baseTimestamp + 3600
            });
            db.insertCommentEdit({
                sessionId: "edit-challenge",
                publication: {
                    author: { address: author.address },
                    subplebbitAddress: "test-sub.eth",
                    timestamp: editTime,
                    protocolVersion: "1",
                    signature: baseSignature,
                    commentCid: "QmComment",
                    content: "Edited"
                }
            });
            db.getDb()
                .prepare("UPDATE commentEdits SET receivedAt = ? WHERE sessionId = ?")
                .run(editTime * 1000, "edit-challenge");

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateAccountAge(ctx, 0.17);

            // Should use the oldest (comment at 400 days) -> VERY_OLD (0.1)
            expect(result.score).toBe(0.1);
            expect(result.explanation).toContain("400 days old");
            expect(result.explanation).toContain("very established");
        });
    });
});
