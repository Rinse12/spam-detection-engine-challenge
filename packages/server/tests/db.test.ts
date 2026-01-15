import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SpamDetectionDatabase, createDatabase } from "../src/db/index.js";

describe("SpamDetectionDatabase", () => {
  let db: SpamDetectionDatabase;
  const signerPublicKey = "test-public-key";

  beforeEach(() => {
    db = createDatabase(":memory:");
  });

  afterEach(() => {
    db.close();
  });

  describe("challenge sessions", () => {
    it("should create and retrieve a challenge session", () => {
      const session = db.createChallengeSession({
        challengeId: "test-challenge-123",
        author: "12D3KooW...",
        subplebbitAddress: "my-sub.eth",
        signerPublicKey,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      });

      expect(session).toBeDefined();
      expect(session.challengeId).toBe("test-challenge-123");
      expect(session.author).toBe("12D3KooW...");
      expect(session.subplebbitAddress).toBe("my-sub.eth");
      expect(session.status).toBe("pending");
    });

    it("should retrieve session by challenge ID", () => {
      db.createChallengeSession({
        challengeId: "test-challenge-456",
        author: "12D3KooW...",
        subplebbitAddress: "my-sub.eth",
        signerPublicKey,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      });

      const session = db.getChallengeSessionByChallengeId("test-challenge-456");
      expect(session).toBeDefined();
      expect(session?.challengeId).toBe("test-challenge-456");
    });

    it("should return undefined for non-existent challenge ID", () => {
      const session =
        db.getChallengeSessionByChallengeId("non-existent-challenge");
      expect(session).toBeUndefined();
    });

    it("should update challenge session status", () => {
      db.createChallengeSession({
        challengeId: "test-challenge-789",
        author: "12D3KooW...",
        subplebbitAddress: "my-sub.eth",
        signerPublicKey,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      });

      const now = Math.floor(Date.now() / 1000);
      const updated = db.updateChallengeSessionStatus(
        "test-challenge-789",
        "completed",
        now
      );

      expect(updated).toBe(true);

      const session = db.getChallengeSessionByChallengeId("test-challenge-789");
      expect(session?.status).toBe("completed");
      expect(session?.completedAt).toBe(now);
    });

    it("should get sessions by author", () => {
      db.createChallengeSession({
        challengeId: "challenge-1",
        author: "author-123",
        subplebbitAddress: "sub-1.eth",
        signerPublicKey,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      });

      db.createChallengeSession({
        challengeId: "challenge-2",
        author: "author-123",
        subplebbitAddress: "sub-2.eth",
        signerPublicKey,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      });

      db.createChallengeSession({
        challengeId: "challenge-3",
        author: "other-author",
        subplebbitAddress: "sub-1.eth",
        signerPublicKey,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      });

      const sessions = db.getChallengeSessionsByAuthor("author-123");
      expect(sessions).toHaveLength(2);
    });

    it("should count pending sessions by author", () => {
      db.createChallengeSession({
        challengeId: "pending-1",
        author: "author-456",
        subplebbitAddress: "sub.eth",
        signerPublicKey,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      });

      db.createChallengeSession({
        challengeId: "pending-2",
        author: "author-456",
        subplebbitAddress: "sub.eth",
        signerPublicKey,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      });

      db.createChallengeSession({
        challengeId: "completed-1",
        author: "author-456",
        subplebbitAddress: "sub.eth",
        signerPublicKey,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      });
      db.updateChallengeSessionStatus("completed-1", "completed");

      const count = db.countPendingChallengeSessionsByAuthor("author-456");
      expect(count).toBe(2);
    });

    it("should purge expired sessions", () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      db.createChallengeSession({
        challengeId: "expired-session",
        author: "author",
        subplebbitAddress: "sub.eth",
        signerPublicKey,
        expiresAt: pastTime,
      });

      db.createChallengeSession({
        challengeId: "valid-session",
        author: "author",
        subplebbitAddress: "sub.eth",
        signerPublicKey,
        expiresAt: futureTime,
      });

      const purged = db.purgeExpiredChallengeSessions();
      expect(purged).toBe(1);

      expect(
        db.getChallengeSessionByChallengeId("expired-session")
      ).toBeUndefined();
      expect(
        db.getChallengeSessionByChallengeId("valid-session")
      ).toBeDefined();
    });
  });

  describe("IP records", () => {
    it("should create an IP record", () => {
      const record = db.upsertIpRecord({
        ipAddress: "192.168.1.1",
        author: "12D3KooW...",
        challengeId: "challenge-123",
        countryCode: "US",
      });

      expect(record).toBeDefined();
      expect(record.ipAddress).toBe("192.168.1.1");
      expect(record.author).toBe("12D3KooW...");
      expect(record.countryCode).toBe("US");
      expect(record.isVpn).toBe(0);
    });

    it("should update existing IP record on upsert", () => {
      db.upsertIpRecord({
        ipAddress: "10.0.0.1",
        author: "author-1",
        challengeId: "challenge-1",
        isVpn: false,
      });

      const updated = db.upsertIpRecord({
        ipAddress: "10.0.0.1",
        author: "author-1",
        challengeId: "challenge-2",
        isVpn: true,
        countryCode: "DE",
      });

      expect(updated.isVpn).toBe(1);
      expect(updated.countryCode).toBe("DE");
      expect(updated.challengeId).toBe("challenge-2");
    });

    it("should retrieve IP record by challenge ID", () => {
      db.upsertIpRecord({
        ipAddress: "172.16.0.1",
        author: "author-x",
        challengeId: "lookup-challenge",
        isTor: true,
      });

      const record = db.getIpRecordByChallengeId("lookup-challenge");
      expect(record).toBeDefined();
      expect(record?.ipAddress).toBe("172.16.0.1");
      expect(record?.isTor).toBe(1);
    });

    it("should get IP records by author", () => {
      db.upsertIpRecord({
        ipAddress: "1.1.1.1",
        author: "multi-ip-author",
        challengeId: "c1",
      });

      db.upsertIpRecord({
        ipAddress: "2.2.2.2",
        author: "multi-ip-author",
        challengeId: "c2",
      });

      db.upsertIpRecord({
        ipAddress: "3.3.3.3",
        author: "other-author",
        challengeId: "c3",
      });

      const records = db.getIpRecordsByAuthor("multi-ip-author");
      expect(records).toHaveLength(2);
    });

    it("should store IP type flags correctly", () => {
      const record = db.upsertIpRecord({
        ipAddress: "8.8.8.8",
        author: "author",
        challengeId: "ch",
        isVpn: true,
        isProxy: true,
        isTor: false,
        isDatacenter: true,
      });

      expect(record.isVpn).toBe(1);
      expect(record.isProxy).toBe(1);
      expect(record.isTor).toBe(0);
      expect(record.isDatacenter).toBe(1);
    });
  });
});
