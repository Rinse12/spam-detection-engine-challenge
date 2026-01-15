import Database from "better-sqlite3";
import { SCHEMA_SQL } from "./schema.js";

export interface ChallengeSession {
    id: number;
    challengeId: string;
    author: string;
    subplebbitAddress: string;
    /** Ed25519 public key of the subplebbit that created this session. Used to verify the same subplebbit completes the challenge. */
    subplebbitPublicKey: string | null;
    status: "pending" | "completed" | "failed";
    completedAt: number | null;
    expiresAt: number;
    createdAt: number;
}

export interface IpRecord {
    id: number;
    ipAddress: string;
    author: string;
    challengeId: string;
    isVpn: number;
    isProxy: number;
    isTor: number;
    isDatacenter: number;
    countryCode: string | null;
    intelUpdatedAt: number | null;
    firstSeenAt: number;
    lastSeenAt: number;
}

export interface DatabaseConfig {
    /** Path to the SQLite database file. Use ":memory:" for in-memory database. */
    path: string;
    /** Enable WAL mode for better concurrent read performance. Default: true */
    walMode?: boolean;
}

/**
 * Database wrapper for the spam detection engine.
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
        this.ensureChallengeSessionSchema();
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

    private ensureChallengeSessionSchema(): void {
        const columns = this.db.prepare("PRAGMA table_info(challengeSessions)").all() as Array<{ name: string }>;
        const hasSubplebbitPublicKey = columns.some((column) => column.name === "subplebbitPublicKey");
        if (!hasSubplebbitPublicKey) {
            this.db.exec("ALTER TABLE challengeSessions ADD COLUMN subplebbitPublicKey TEXT");
        }
    }

    /**
     * Insert a new challenge session.
     */
    insertChallengeSession(params: {
        challengeId: string;
        author: string;
        subplebbitAddress: string;
        /** Ed25519 public key of the subplebbit */
        subplebbitPublicKey: string;
        expiresAt: number;
    }): ChallengeSession {
        const stmt = this.db.prepare(`
      INSERT INTO challengeSessions (
        challengeId,
        author,
        subplebbitAddress,
        subplebbitPublicKey,
        expiresAt
      )
      VALUES (
        @challengeId,
        @author,
        @subplebbitAddress,
        @subplebbitPublicKey,
        @expiresAt
      )
    `);

        const result = stmt.run(params);

        return this.getChallengeSessionById(result.lastInsertRowid as number)!;
    }

    /**
     * Get a challenge session by its ID.
     */
    getChallengeSessionById(id: number): ChallengeSession | undefined {
        const stmt = this.db.prepare(`
      SELECT * FROM challengeSessions WHERE id = ?
    `);
        return stmt.get(id) as ChallengeSession | undefined;
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

    /**
     * Get challenge sessions by author.
     */
    getChallengeSessionsByAuthor(author: string): ChallengeSession[] {
        const stmt = this.db.prepare(`
      SELECT * FROM challengeSessions WHERE author = ? ORDER BY createdAt DESC
    `);
        return stmt.all(author) as ChallengeSession[];
    }

    /**
     * Count pending challenge sessions for an author (for rate limiting).
     */
    countPendingChallengeSessionsByAuthor(author: string): number {
        const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM challengeSessions
      WHERE author = ? AND status = 'pending'
    `);
        const result = stmt.get(author) as { count: number };
        return result.count;
    }

    // ============================================
    // IP Record Methods
    // ============================================

    /**
     * Create or update an IP record.
     */
    upsertIpRecord(params: {
        ipAddress: string;
        author: string;
        challengeId: string;
        isVpn?: boolean;
        isProxy?: boolean;
        isTor?: boolean;
        isDatacenter?: boolean;
        countryCode?: string;
        intelUpdatedAt?: number;
    }): IpRecord {
        const now = Math.floor(Date.now() / 1000);

        // Check if record exists
        const existing = this.getIpRecordByIpAndAuthor(params.ipAddress, params.author);

        if (existing) {
            // Update existing record
            const stmt = this.db.prepare(`
        UPDATE ipRecords SET
          challengeId = @challengeId,
          isVpn = COALESCE(@isVpn, isVpn),
          isProxy = COALESCE(@isProxy, isProxy),
          isTor = COALESCE(@isTor, isTor),
          isDatacenter = COALESCE(@isDatacenter, isDatacenter),
          countryCode = COALESCE(@countryCode, countryCode),
          intelUpdatedAt = COALESCE(@intelUpdatedAt, intelUpdatedAt),
          lastSeenAt = @lastSeenAt
        WHERE ipAddress = @ipAddress AND author = @author
      `);

            stmt.run({
                ipAddress: params.ipAddress,
                author: params.author,
                challengeId: params.challengeId,
                isVpn: params.isVpn !== undefined ? (params.isVpn ? 1 : 0) : null,
                isProxy: params.isProxy !== undefined ? (params.isProxy ? 1 : 0) : null,
                isTor: params.isTor !== undefined ? (params.isTor ? 1 : 0) : null,
                isDatacenter: params.isDatacenter !== undefined ? (params.isDatacenter ? 1 : 0) : null,
                countryCode: params.countryCode ?? null,
                intelUpdatedAt: params.intelUpdatedAt ?? null,
                lastSeenAt: now
            });

            return this.getIpRecordByIpAndAuthor(params.ipAddress, params.author)!;
        } else {
            // Insert new record
            const stmt = this.db.prepare(`
        INSERT INTO ipRecords (ipAddress, author, challengeId, isVpn, isProxy, isTor, isDatacenter, countryCode, intelUpdatedAt)
        VALUES (@ipAddress, @author, @challengeId, @isVpn, @isProxy, @isTor, @isDatacenter, @countryCode, @intelUpdatedAt)
      `);

            const result = stmt.run({
                ipAddress: params.ipAddress,
                author: params.author,
                challengeId: params.challengeId,
                isVpn: params.isVpn ? 1 : 0,
                isProxy: params.isProxy ? 1 : 0,
                isTor: params.isTor ? 1 : 0,
                isDatacenter: params.isDatacenter ? 1 : 0,
                countryCode: params.countryCode ?? null,
                intelUpdatedAt: params.intelUpdatedAt ?? null
            });

            return this.getIpRecordById(result.lastInsertRowid as number)!;
        }
    }

    /**
     * Get an IP record by its ID.
     */
    getIpRecordById(id: number): IpRecord | undefined {
        const stmt = this.db.prepare(`
      SELECT * FROM ipRecords WHERE id = ?
    `);
        return stmt.get(id) as IpRecord | undefined;
    }

    /**
     * Get an IP record by IP address and author.
     */
    getIpRecordByIpAndAuthor(ipAddress: string, author: string): IpRecord | undefined {
        const stmt = this.db.prepare(`
      SELECT * FROM ipRecords WHERE ipAddress = ? AND author = ?
    `);
        return stmt.get(ipAddress, author) as IpRecord | undefined;
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
     * Get all IP records for an author.
     */
    getIpRecordsByAuthor(author: string): IpRecord[] {
        const stmt = this.db.prepare(`
      SELECT * FROM ipRecords WHERE author = ? ORDER BY lastSeenAt DESC
    `);
        return stmt.all(author) as IpRecord[];
    }

    /**
     * Delete old IP records (older than the specified number of days).
     * Returns the number of deleted records.
     */
    purgeOldIpRecords(olderThanDays: number = 30): number {
        const cutoff = Math.floor(Date.now() / 1000) - olderThanDays * 24 * 60 * 60;
        const stmt = this.db.prepare(`
      DELETE FROM ipRecords WHERE lastSeenAt < ?
    `);
        const result = stmt.run(cutoff);
        return result.changes;
    }
}

/**
 * Create a database instance with default configuration.
 */
export function createDatabase(path: string = ":memory:"): SpamDetectionDatabase {
    return new SpamDetectionDatabase({ path });
}

export { SCHEMA_SQL } from "./schema.js";
