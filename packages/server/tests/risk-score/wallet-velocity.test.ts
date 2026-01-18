import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { calculateWalletVelocity } from "../../src/risk-score/factors/wallet-velocity.js";
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

function createMockAuthor(
    wallets?: Record<string, { address: string; timestamp: number; signature: { signature: string; type: string } }>
) {
    return {
        address: "12D3KooWTestAddress",
        subplebbit: {
            postScore: 0,
            replyScore: 0,
            firstCommentTimestamp: baseTimestamp - 86400,
            lastCommentCid: "QmYwAPJzv5CZsnAzt8auVZRn9p6nxfZmZ75W6rS4ju4Khu"
        },
        wallets
    };
}

function createMockChallengeRequest(
    pubType: "comment" | "vote" | "commentEdit" | "commentModeration",
    author: ReturnType<typeof createMockAuthor>,
    isPost = true
): DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor {
    const base = {
        challengeRequestId: { bytes: new Uint8Array() },
        acceptedChallengeTypes: ["turnstile"],
        encrypted: {} as never
    };

    if (pubType === "comment") {
        return {
            ...base,
            comment: {
                author,
                subplebbitAddress: "test-sub.eth",
                timestamp: baseTimestamp,
                protocolVersion: "1",
                signature: baseSignature,
                content: "Test content",
                parentCid: isPost ? undefined : "QmParentCid"
            }
        } as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
    }
    if (pubType === "vote") {
        return {
            ...base,
            vote: {
                author,
                subplebbitAddress: "test-sub.eth",
                timestamp: baseTimestamp,
                protocolVersion: "1",
                signature: baseSignature,
                commentCid: "QmCommentCid",
                vote: 1
            }
        } as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
    }
    if (pubType === "commentEdit") {
        return {
            ...base,
            commentEdit: {
                author,
                subplebbitAddress: "test-sub.eth",
                timestamp: baseTimestamp,
                protocolVersion: "1",
                signature: baseSignature,
                commentCid: "QmCommentCid",
                content: "Edited content"
            }
        } as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
    }
    // commentModeration
    return {
        ...base,
        commentModeration: {
            author,
            subplebbitAddress: "test-sub.eth",
            timestamp: baseTimestamp,
            protocolVersion: "1",
            signature: baseSignature,
            commentCid: "QmCommentCid"
        }
    } as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
}

describe("calculateWalletVelocity", () => {
    let db: SpamDetectionDatabase;
    let combinedData: CombinedDataService;

    beforeEach(() => {
        db = new SpamDetectionDatabase({ path: ":memory:" });
        combinedData = new CombinedDataService(db);
    });

    afterEach(() => {
        db.close();
    });

    describe("when author has no wallets", () => {
        it("should return score 0 with weight 0 (factor skipped)", () => {
            const author = createMockAuthor(undefined);
            const challengeRequest = createMockChallengeRequest("comment", author);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateWalletVelocity(ctx, 0.15);

            expect(result.score).toBe(0);
            expect(result.weight).toBe(0);
            expect(result.explanation).toContain("No wallets linked");
        });
    });

    describe("when author has wallets with no prior activity", () => {
        it("should return low score for post", () => {
            const author = createMockAuthor({
                eth: {
                    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f42d11",
                    timestamp: baseTimestamp - 1000,
                    signature: { signature: "sig", type: "ethereum" }
                }
            });
            const challengeRequest = createMockChallengeRequest("comment", author, true);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateWalletVelocity(ctx, 0.15);

            expect(result.score).toBe(0.1); // NORMAL score
            expect(result.weight).toBe(0.15);
            expect(result.explanation).toContain("post");
            expect(result.explanation).toContain("0/hr");
        });

        it("should return low score for vote", () => {
            const author = createMockAuthor({
                eth: {
                    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f42d11",
                    timestamp: baseTimestamp - 1000,
                    signature: { signature: "sig", type: "ethereum" }
                }
            });
            const challengeRequest = createMockChallengeRequest("vote", author);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateWalletVelocity(ctx, 0.15);

            expect(result.score).toBe(0.1);
            expect(result.explanation).toContain("vote");
        });
    });

    describe("when wallet has excessive activity", () => {
        it("should return high score for post with many posts from same wallet", () => {
            const walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f42d11";
            const author = createMockAuthor({
                eth: {
                    address: walletAddress,
                    timestamp: baseTimestamp - 1000,
                    signature: { signature: "sig", type: "ethereum" }
                }
            });

            // Insert 15 posts from this wallet (above BOT_LIKE threshold of 12)
            for (let i = 0; i < 15; i++) {
                const challengeId = `challenge-${i}`;
                db.insertChallengeSession({
                    challengeId,
                    subplebbitPublicKey: "pk",
                    expiresAt: baseTimestamp + 3600
                });
                db.insertComment({
                    challengeId,
                    publication: {
                        author: {
                            address: `author-${i}`,
                            wallets: {
                                eth: {
                                    address: walletAddress,
                                    timestamp: baseTimestamp - 1000,
                                    signature: { signature: "sig", type: "ethereum" }
                                }
                            }
                        },
                        subplebbitAddress: "test-sub.eth",
                        timestamp: baseTimestamp,
                        protocolVersion: "1",
                        signature: baseSignature
                        // No parentCid = post
                    }
                });
            }

            const challengeRequest = createMockChallengeRequest("comment", author, true);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateWalletVelocity(ctx, 0.15);

            expect(result.score).toBe(0.95); // BOT_LIKE score
            expect(result.explanation).toContain("15/hr");
            expect(result.explanation).toContain("likely automated");
        });

        it("should allow more votes before flagging (higher threshold)", () => {
            const walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f42d11";
            const author = createMockAuthor({
                eth: {
                    address: walletAddress,
                    timestamp: baseTimestamp - 1000,
                    signature: { signature: "sig", type: "ethereum" }
                }
            });

            // Insert 25 votes - above NORMAL (20) but below ELEVATED (40)
            for (let i = 0; i < 25; i++) {
                const challengeId = `vote-challenge-${i}`;
                db.insertChallengeSession({
                    challengeId,
                    subplebbitPublicKey: "pk",
                    expiresAt: baseTimestamp + 3600
                });
                db.insertVote({
                    challengeId,
                    publication: {
                        author: {
                            address: `author-${i}`,
                            wallets: {
                                eth: {
                                    address: walletAddress,
                                    timestamp: baseTimestamp - 1000,
                                    signature: { signature: "sig", type: "ethereum" }
                                }
                            }
                        },
                        subplebbitAddress: "test-sub.eth",
                        timestamp: baseTimestamp,
                        protocolVersion: "1",
                        signature: baseSignature,
                        commentCid: `QmComment${i}`,
                        vote: 1
                    }
                });
            }

            const challengeRequest = createMockChallengeRequest("vote", author);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateWalletVelocity(ctx, 0.15);

            expect(result.score).toBe(0.4); // ELEVATED score (25 is between 20 and 40)
            expect(result.explanation).toContain("25/hr");
        });
    });

    describe("with multiple wallets", () => {
        it("should use highest velocity among all wallets", () => {
            const cleanWallet = "0x1111111111111111111111111111111111111111";
            const spammyWallet = "0x2222222222222222222222222222222222222222";

            // Insert many posts from spammy wallet only
            for (let i = 0; i < 10; i++) {
                const challengeId = `spam-challenge-${i}`;
                db.insertChallengeSession({
                    challengeId,
                    subplebbitPublicKey: "pk",
                    expiresAt: baseTimestamp + 3600
                });
                db.insertComment({
                    challengeId,
                    publication: {
                        author: {
                            address: `spammer-${i}`,
                            wallets: {
                                eth: {
                                    address: spammyWallet,
                                    timestamp: baseTimestamp - 1000,
                                    signature: { signature: "sig", type: "ethereum" }
                                }
                            }
                        },
                        subplebbitAddress: "test-sub.eth",
                        timestamp: baseTimestamp,
                        protocolVersion: "1",
                        signature: baseSignature
                    }
                });
            }

            // Author has both wallets
            const author = createMockAuthor({
                eth: {
                    address: cleanWallet,
                    timestamp: baseTimestamp - 1000,
                    signature: { signature: "sig", type: "ethereum" }
                },
                polygon: {
                    address: spammyWallet,
                    timestamp: baseTimestamp - 1000,
                    signature: { signature: "sig", type: "ethereum" }
                }
            });

            const challengeRequest = createMockChallengeRequest("comment", author, true);

            const ctx: RiskContext = {
                challengeRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const result = calculateWalletVelocity(ctx, 0.15);

            // Should use spammy wallet's velocity (10 posts > BOT_LIKE threshold of 8 for posts)
            expect(result.score).toBe(0.95); // BOT_LIKE (10 > 8)
            expect(result.explanation).toContain("10/hr");
        });
    });

    describe("distinguishes posts from replies", () => {
        it("should track posts and replies separately", () => {
            const walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f42d11";
            const author = createMockAuthor({
                eth: {
                    address: walletAddress,
                    timestamp: baseTimestamp - 1000,
                    signature: { signature: "sig", type: "ethereum" }
                }
            });

            // Insert 20 replies from this wallet (above SUSPICIOUS threshold of 15 for replies)
            for (let i = 0; i < 20; i++) {
                const challengeId = `reply-challenge-${i}`;
                db.insertChallengeSession({
                    challengeId,
                    subplebbitPublicKey: "pk",
                    expiresAt: baseTimestamp + 3600
                });
                db.insertComment({
                    challengeId,
                    publication: {
                        author: {
                            address: `author-${i}`,
                            wallets: {
                                eth: {
                                    address: walletAddress,
                                    timestamp: baseTimestamp - 1000,
                                    signature: { signature: "sig", type: "ethereum" }
                                }
                            }
                        },
                        subplebbitAddress: "test-sub.eth",
                        timestamp: baseTimestamp,
                        protocolVersion: "1",
                        signature: baseSignature,
                        parentCid: "QmParent" // Has parentCid = reply
                    }
                });
            }

            // New post from same wallet should show 0 posts (only replies were inserted)
            const postRequest = createMockChallengeRequest("comment", author, true);

            const postCtx: RiskContext = {
                challengeRequest: postRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const postResult = calculateWalletVelocity(postCtx, 0.15);
            expect(postResult.score).toBe(0.1); // Normal - no posts from this wallet
            expect(postResult.explanation).toContain("0/hr");

            // New reply from same wallet should show 20 replies
            const replyRequest = createMockChallengeRequest("comment", author, false);

            const replyCtx: RiskContext = {
                challengeRequest: replyRequest,
                now: baseTimestamp,
                hasIpInfo: false,
                db,
                combinedData
            };

            const replyResult = calculateWalletVelocity(replyCtx, 0.15);
            expect(replyResult.score).toBe(0.95); // BOT_LIKE (20 > 15)
            expect(replyResult.explanation).toContain("20/hr");
        });
    });
});
