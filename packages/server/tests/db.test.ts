import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SpamDetectionDatabase, createDatabase } from "../src/db/index.js";

describe("SpamDetectionDatabase", () => {
    let db: SpamDetectionDatabase;
    const subplebbitPublicKey = "test-public-key";

    beforeEach(() => {
        db = createDatabase(":memory:");
    });

    afterEach(() => {
        db.close();
    });

    describe("challenge sessions", () => {
        it("should create and retrieve a challenge session", () => {
            const session = db.insertChallengeSession({
                sessionId: "test-challenge-123",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            expect(session).toBeDefined();
            expect(session.sessionId).toBe("test-challenge-123");
            expect(session.subplebbitPublicKey).toBe(subplebbitPublicKey);
            expect(session.status).toBe("pending");
            expect(session.authorAccessedIframeAt).toBeNull();
        });

        it("should retrieve session by challenge ID", () => {
            db.insertChallengeSession({
                sessionId: "test-challenge-456",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            const session = db.getChallengeSessionBySessionId("test-challenge-456");
            expect(session).toBeDefined();
            expect(session?.sessionId).toBe("test-challenge-456");
        });

        it("should return undefined for non-existent challenge ID", () => {
            const session = db.getChallengeSessionBySessionId("non-existent-challenge");
            expect(session).toBeUndefined();
        });

        it("should update challenge session status", () => {
            db.insertChallengeSession({
                sessionId: "test-challenge-789",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            const now = Math.floor(Date.now() / 1000);
            const updated = db.updateChallengeSessionStatus("test-challenge-789", "completed", now);

            expect(updated).toBe(true);

            const session = db.getChallengeSessionBySessionId("test-challenge-789");
            expect(session?.status).toBe("completed");
            expect(session?.completedAt).toBe(now);
        });

        it("should update iframe access timestamp", () => {
            db.insertChallengeSession({
                sessionId: "iframe-test",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            const now = Math.floor(Date.now() / 1000);
            const updated = db.updateChallengeSessionIframeAccess("iframe-test", now);

            expect(updated).toBe(true);

            const session = db.getChallengeSessionBySessionId("iframe-test");
            expect(session?.authorAccessedIframeAt).toBe(now);
        });
    });

    describe("IP records", () => {
        it("should create an IP record", () => {
            // First create a challenge session (required for foreign key)
            db.insertChallengeSession({
                sessionId: "challenge-123",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            const now = Math.floor(Date.now() / 1000);
            const record = db.insertIpRecord({
                sessionId: "challenge-123",
                ipAddress: "192.168.1.1",
                countryCode: "US",
                timestamp: now
            });

            expect(record).toBeDefined();
            expect(record.sessionId).toBe("challenge-123");
            expect(record.ipAddress).toBe("192.168.1.1");
            expect(record.countryCode).toBe("US");
            expect(record.isVpn).toBeNull();
            expect(record.timestamp).toBe(now);
        });

        it("should retrieve IP record by challenge ID", () => {
            db.insertChallengeSession({
                sessionId: "lookup-challenge",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            const now = Math.floor(Date.now() / 1000);
            db.insertIpRecord({
                sessionId: "lookup-challenge",
                ipAddress: "172.16.0.1",
                isTor: true,
                timestamp: now
            });

            const record = db.getIpRecordBySessionId("lookup-challenge");
            expect(record).toBeDefined();
            expect(record?.ipAddress).toBe("172.16.0.1");
            expect(record?.isTor).toBe(1);
        });

        it("should store IP type flags correctly", () => {
            db.insertChallengeSession({
                sessionId: "flags-challenge",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            const now = Math.floor(Date.now() / 1000);
            const record = db.insertIpRecord({
                sessionId: "flags-challenge",
                ipAddress: "8.8.8.8",
                isVpn: true,
                isProxy: true,
                isTor: false,
                isDatacenter: true,
                timestamp: now
            });

            expect(record.isVpn).toBe(1);
            expect(record.isProxy).toBe(1);
            expect(record.isTor).toBe(0);
            expect(record.isDatacenter).toBe(1);
        });

        it("should update IP intelligence data", () => {
            db.insertChallengeSession({
                sessionId: "intel-challenge",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            const now = Math.floor(Date.now() / 1000);
            db.insertIpRecord({
                sessionId: "intel-challenge",
                ipAddress: "10.0.0.1",
                timestamp: now
            });

            const laterTime = now + 60;
            const updated = db.updateIpRecordIntelligence("intel-challenge", {
                isVpn: true,
                countryCode: "DE",
                timestamp: laterTime
            });

            expect(updated).toBe(true);

            const record = db.getIpRecordBySessionId("intel-challenge");
            expect(record?.isVpn).toBe(1);
            expect(record?.countryCode).toBe("DE");
            expect(record?.timestamp).toBe(laterTime);
        });
    });

    describe("duplicate publication prevention", () => {
        const baseTimestamp = Math.floor(Date.now() / 1000);

        it("should detect existing comment signature", () => {
            const sessionId = "comment-session-1";
            const signatureValue = "unique-comment-sig-123";

            db.insertChallengeSession({
                sessionId,
                subplebbitPublicKey,
                expiresAt: Date.now() + 3600000
            });

            db.insertComment({
                sessionId,
                publication: {
                    author: { address: "test-author.eth" },
                    subplebbitAddress: "test-sub.eth",
                    timestamp: baseTimestamp,
                    protocolVersion: "1.0.0",
                    signature: {
                        signature: signatureValue,
                        publicKey: "author-pubkey",
                        type: "ed25519",
                        signedPropertyNames: ["author", "content"]
                    },
                    content: "Test comment"
                }
            });

            expect(db.publicationSignatureExists(signatureValue)).toBe(true);
            expect(db.publicationSignatureExists("non-existent-sig")).toBe(false);
        });

        it("should detect existing vote signature", () => {
            const sessionId = "vote-session-1";
            const signatureValue = "unique-vote-sig-456";

            db.insertChallengeSession({
                sessionId,
                subplebbitPublicKey,
                expiresAt: Date.now() + 3600000
            });

            db.insertVote({
                sessionId,
                publication: {
                    author: { address: "test-author.eth" },
                    subplebbitAddress: "test-sub.eth",
                    commentCid: "Qm123",
                    vote: 1,
                    timestamp: baseTimestamp,
                    protocolVersion: "1.0.0",
                    signature: {
                        signature: signatureValue,
                        publicKey: "author-pubkey",
                        type: "ed25519",
                        signedPropertyNames: ["author", "vote"]
                    }
                }
            });

            expect(db.publicationSignatureExists(signatureValue)).toBe(true);
        });

        it("should detect existing commentEdit signature", () => {
            const sessionId = "edit-session-1";
            const signatureValue = "unique-edit-sig-789";

            db.insertChallengeSession({
                sessionId,
                subplebbitPublicKey,
                expiresAt: Date.now() + 3600000
            });

            db.insertCommentEdit({
                sessionId,
                publication: {
                    author: { address: "test-author.eth" },
                    subplebbitAddress: "test-sub.eth",
                    commentCid: "Qm456",
                    timestamp: baseTimestamp,
                    protocolVersion: "1.0.0",
                    signature: {
                        signature: signatureValue,
                        publicKey: "author-pubkey",
                        type: "ed25519",
                        signedPropertyNames: ["author", "content"]
                    },
                    content: "Edited content"
                }
            });

            expect(db.publicationSignatureExists(signatureValue)).toBe(true);
        });

        it("should detect existing commentModeration signature", () => {
            const sessionId = "mod-session-1";
            const signatureValue = "unique-mod-sig-abc";

            db.insertChallengeSession({
                sessionId,
                subplebbitPublicKey,
                expiresAt: Date.now() + 3600000
            });

            db.insertCommentModeration({
                sessionId,
                publication: {
                    author: { address: "test-mod.eth" },
                    subplebbitAddress: "test-sub.eth",
                    commentCid: "Qm789",
                    timestamp: baseTimestamp,
                    protocolVersion: "1.0.0",
                    signature: {
                        signature: signatureValue,
                        publicKey: "mod-pubkey",
                        type: "ed25519",
                        signedPropertyNames: ["author", "commentModeration"]
                    },
                    commentModeration: { removed: true }
                }
            });

            expect(db.publicationSignatureExists(signatureValue)).toBe(true);
        });

        it("should return false for non-existent signature", () => {
            expect(db.publicationSignatureExists("completely-new-signature")).toBe(false);
        });

        it("should detect signature across different publication types", () => {
            // Insert a comment with a specific signature
            const sessionId = "cross-type-session";
            const signatureValue = "cross-type-sig-xyz";

            db.insertChallengeSession({
                sessionId,
                subplebbitPublicKey,
                expiresAt: Date.now() + 3600000
            });

            db.insertComment({
                sessionId,
                publication: {
                    author: { address: "test-author.eth" },
                    subplebbitAddress: "test-sub.eth",
                    timestamp: baseTimestamp,
                    protocolVersion: "1.0.0",
                    signature: {
                        signature: signatureValue,
                        publicKey: "author-pubkey",
                        type: "ed25519",
                        signedPropertyNames: ["author", "content"]
                    },
                    content: "Test"
                }
            });

            // The signature should be detected even though we're not specifying the table
            expect(db.publicationSignatureExists(signatureValue)).toBe(true);
        });
    });
});
