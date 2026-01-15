import Database from "better-sqlite3";
import { SCHEMA_SQL } from "./schema.js";

export interface ChallengeSession {
    challengeId: string;
    /** Ed25519 public key of the subplebbit that created this session. Used to verify the same subplebbit completes the challenge. */
    subplebbitPublicKey: string | null;
    status: "pending" | "completed" | "failed";
    completedAt: number | null;
    expiresAt: number;
    receivedChallengeRequestAt: number;
    /** When the author accessed the iframe */
    authorAccessedIframeAt: number | null;
}

export interface IpRecord {
    challengeId: string;
    ipAddress: string;
    isVpn: number | null;
    isProxy: number | null;
    isTor: number | null;
    isDatacenter: number | null;
    countryCode: string | null;
    /** When we queried the IP provider */
    timestamp: number;
}

export interface DatabaseConfig {
    /** Path to the SQLite database file. Use ":memory:" for in-memory database. */
    path: string;
    /** Enable WAL mode for better concurrent read performance. Default: true */
    walMode?: boolean;
}

/**
 * Database wrapper for EasyCommunitySpamBlocker.
 * Provides methods for managing challenge sessions and IP records.
 */
export class SpamDetectionDatabase {
    private db: Database.Database;

    constructor(config: DatabaseConfig) {
        this.db = new Database(config.path);

        // Enable WAL mode by default for better performance
        if (config.walMode !== false) {
            this.db.pragma("journal_mode = WAL");
        }

        // Initialize schema
        this.db.exec(SCHEMA_SQL);
    }

    /**
     * Close the database connection.
     */
    close(): void {
        this.db.close();
    }

    /**
     * Get the underlying better-sqlite3 database instance.
     */
    getDb(): Database.Database {
        return this.db;
    }

    // ============================================
    // Challenge Session Methods
    // ============================================

    /**
     * Insert a new challenge session.
     */
    insertChallengeSession(params: {
        challengeId: string;
        /** Ed25519 public key of the subplebbit */
        subplebbitPublicKey: string;
        expiresAt: number;
    }): ChallengeSession {
        const stmt = this.db.prepare(`
      INSERT INTO challengeSessions (
        challengeId,
        subplebbitPublicKey,
        expiresAt
      )
      VALUES (
        @challengeId,
        @subplebbitPublicKey,
        @expiresAt
      )
    `);

        stmt.run(params);

        return this.getChallengeSessionByChallengeId(params.challengeId)!;
    }

    /**
     * Get a challenge session by its challenge ID.
     */
    getChallengeSessionByChallengeId(challengeId: string): ChallengeSession | undefined {
        const stmt = this.db.prepare(`
      SELECT * FROM challengeSessions WHERE challengeId = ?
    `);
        return stmt.get(challengeId) as ChallengeSession | undefined;
    }

    /**
     * Update the status of a challenge session.
     */
    updateChallengeSessionStatus(challengeId: string, status: "pending" | "completed" | "failed", completedAt?: number): boolean {
        const stmt = this.db.prepare(`
      UPDATE challengeSessions
      SET status = @status, completedAt = @completedAt
      WHERE challengeId = @challengeId
    `);

        const result = stmt.run({
            challengeId,
            status,
            completedAt: completedAt ?? null
        });

        return result.changes > 0;
    }

    /**
     * Update when the author accessed the iframe.
     */
    updateChallengeSessionIframeAccess(challengeId: string, authorAccessedIframeAt: number): boolean {
        const stmt = this.db.prepare(`
      UPDATE challengeSessions
      SET authorAccessedIframeAt = @authorAccessedIframeAt
      WHERE challengeId = @challengeId
    `);

        const result = stmt.run({
            challengeId,
            authorAccessedIframeAt
        });

        return result.changes > 0;
    }

    /**
     * Delete expired challenge sessions.
     * Returns the number of deleted sessions.
     */
    purgeExpiredChallengeSessions(): number {
        const now = Math.floor(Date.now() / 1000);
        const stmt = this.db.prepare(`
      DELETE FROM challengeSessions WHERE expiresAt < ?
    `);
        const result = stmt.run(now);
        return result.changes;
    }

    // ============================================
    // IP Record Methods
    // ============================================

    /**
     * Insert an IP record for a challenge.
     */
    insertIpRecord(params: {
        challengeId: string;
        ipAddress: string;
        isVpn?: boolean;
        isProxy?: boolean;
        isTor?: boolean;
        isDatacenter?: boolean;
        countryCode?: string;
        timestamp: number;
    }): IpRecord {
        const stmt = this.db.prepare(`
      INSERT INTO ipRecords (challengeId, ipAddress, isVpn, isProxy, isTor, isDatacenter, countryCode, timestamp)
      VALUES (@challengeId, @ipAddress, @isVpn, @isProxy, @isTor, @isDatacenter, @countryCode, @timestamp)
    `);

        stmt.run({
            challengeId: params.challengeId,
            ipAddress: params.ipAddress,
            isVpn: params.isVpn !== undefined ? (params.isVpn ? 1 : 0) : null,
            isProxy: params.isProxy !== undefined ? (params.isProxy ? 1 : 0) : null,
            isTor: params.isTor !== undefined ? (params.isTor ? 1 : 0) : null,
            isDatacenter: params.isDatacenter !== undefined ? (params.isDatacenter ? 1 : 0) : null,
            countryCode: params.countryCode ?? null,
            timestamp: params.timestamp
        });

        return this.getIpRecordByChallengeId(params.challengeId)!;
    }

    /**
     * Get an IP record by challenge ID.
     */
    getIpRecordByChallengeId(challengeId: string): IpRecord | undefined {
        const stmt = this.db.prepare(`
      SELECT * FROM ipRecords WHERE challengeId = ?
    `);
        return stmt.get(challengeId) as IpRecord | undefined;
    }

    /**
     * Update IP intelligence data for an existing IP record.
     */
    updateIpRecordIntelligence(
        challengeId: string,
        params: {
            isVpn?: boolean;
            isProxy?: boolean;
            isTor?: boolean;
            isDatacenter?: boolean;
            countryCode?: string;
            timestamp: number;
        }
    ): boolean {
        const stmt = this.db.prepare(`
      UPDATE ipRecords SET
        isVpn = COALESCE(@isVpn, isVpn),
        isProxy = COALESCE(@isProxy, isProxy),
        isTor = COALESCE(@isTor, isTor),
        isDatacenter = COALESCE(@isDatacenter, isDatacenter),
        countryCode = COALESCE(@countryCode, countryCode),
        timestamp = @timestamp
      WHERE challengeId = @challengeId
    `);

        const result = stmt.run({
            challengeId,
            isVpn: params.isVpn !== undefined ? (params.isVpn ? 1 : 0) : null,
            isProxy: params.isProxy !== undefined ? (params.isProxy ? 1 : 0) : null,
            isTor: params.isTor !== undefined ? (params.isTor ? 1 : 0) : null,
            isDatacenter: params.isDatacenter !== undefined ? (params.isDatacenter ? 1 : 0) : null,
            countryCode: params.countryCode ?? null,
            timestamp: params.timestamp
        });

        return result.changes > 0;
    }
}

/**
 * Create a database instance.
 */
export function createDatabase(path: string): SpamDetectionDatabase {
    return new SpamDetectionDatabase({ path });
}

export { SCHEMA_SQL } from "./schema.js";
