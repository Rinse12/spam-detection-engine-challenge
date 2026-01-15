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
                challengeId: "test-challenge-123",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            expect(session).toBeDefined();
            expect(session.challengeId).toBe("test-challenge-123");
            expect(session.subplebbitPublicKey).toBe(subplebbitPublicKey);
            expect(session.status).toBe("pending");
            expect(session.authorAccessedIframeAt).toBeNull();
        });

        it("should retrieve session by challenge ID", () => {
            db.insertChallengeSession({
                challengeId: "test-challenge-456",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            const session = db.getChallengeSessionByChallengeId("test-challenge-456");
            expect(session).toBeDefined();
            expect(session?.challengeId).toBe("test-challenge-456");
        });

        it("should return undefined for non-existent challenge ID", () => {
            const session = db.getChallengeSessionByChallengeId("non-existent-challenge");
            expect(session).toBeUndefined();
        });

        it("should update challenge session status", () => {
            db.insertChallengeSession({
                challengeId: "test-challenge-789",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            const now = Math.floor(Date.now() / 1000);
            const updated = db.updateChallengeSessionStatus("test-challenge-789", "completed", now);

            expect(updated).toBe(true);

            const session = db.getChallengeSessionByChallengeId("test-challenge-789");
            expect(session?.status).toBe("completed");
            expect(session?.completedAt).toBe(now);
        });

        it("should update iframe access timestamp", () => {
            db.insertChallengeSession({
                challengeId: "iframe-test",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            const now = Math.floor(Date.now() / 1000);
            const updated = db.updateChallengeSessionIframeAccess("iframe-test", now);

            expect(updated).toBe(true);

            const session = db.getChallengeSessionByChallengeId("iframe-test");
            expect(session?.authorAccessedIframeAt).toBe(now);
        });

        it("should purge expired sessions", () => {
            const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
            const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

            db.insertChallengeSession({
                challengeId: "expired-session",
                subplebbitPublicKey,
                expiresAt: pastTime
            });

            db.insertChallengeSession({
                challengeId: "valid-session",
                subplebbitPublicKey,
                expiresAt: futureTime
            });

            const purged = db.purgeExpiredChallengeSessions();
            expect(purged).toBe(1);

            expect(db.getChallengeSessionByChallengeId("expired-session")).toBeUndefined();
            expect(db.getChallengeSessionByChallengeId("valid-session")).toBeDefined();
        });
    });

    describe("IP records", () => {
        it("should create an IP record", () => {
            // First create a challenge session (required for foreign key)
            db.insertChallengeSession({
                challengeId: "challenge-123",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            const now = Math.floor(Date.now() / 1000);
            const record = db.insertIpRecord({
                challengeId: "challenge-123",
                ipAddress: "192.168.1.1",
                countryCode: "US",
                timestamp: now
            });

            expect(record).toBeDefined();
            expect(record.challengeId).toBe("challenge-123");
            expect(record.ipAddress).toBe("192.168.1.1");
            expect(record.countryCode).toBe("US");
            expect(record.isVpn).toBeNull();
            expect(record.timestamp).toBe(now);
        });

        it("should retrieve IP record by challenge ID", () => {
            db.insertChallengeSession({
                challengeId: "lookup-challenge",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            const now = Math.floor(Date.now() / 1000);
            db.insertIpRecord({
                challengeId: "lookup-challenge",
                ipAddress: "172.16.0.1",
                isTor: true,
                timestamp: now
            });

            const record = db.getIpRecordByChallengeId("lookup-challenge");
            expect(record).toBeDefined();
            expect(record?.ipAddress).toBe("172.16.0.1");
            expect(record?.isTor).toBe(1);
        });

        it("should store IP type flags correctly", () => {
            db.insertChallengeSession({
                challengeId: "flags-challenge",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            const now = Math.floor(Date.now() / 1000);
            const record = db.insertIpRecord({
                challengeId: "flags-challenge",
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
                challengeId: "intel-challenge",
                subplebbitPublicKey,
                expiresAt: Math.floor(Date.now() / 1000) + 3600
            });

            const now = Math.floor(Date.now() / 1000);
            db.insertIpRecord({
                challengeId: "intel-challenge",
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

            const record = db.getIpRecordByChallengeId("intel-challenge");
            expect(record?.isVpn).toBe(1);
            expect(record?.countryCode).toBe("DE");
            expect(record?.timestamp).toBe(laterTime);
        });
    });
});
