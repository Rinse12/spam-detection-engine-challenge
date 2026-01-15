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

    // ============================================
    // Risk Score Query Methods
    // ============================================

    /**
     * Count publications by author address within a time window.
     * Searches across comments, votes, commentEdits, and commentModerations.
     * The author column stores JSON, so we extract the address field.
     */
    countPublicationsByAuthor(authorAddress: string, sinceTimestamp: number): number {
        // Query each publication type and sum the counts
        // Using json_extract to get the address from the JSON author field
        const commentCount = this.db
            .prepare(
                `SELECT COUNT(*) as count FROM comments
         WHERE json_extract(author, '$.address') = ? AND receivedAt >= ?`
            )
            .get(authorAddress, sinceTimestamp) as { count: number };

        const voteCount = this.db
            .prepare(
                `SELECT COUNT(*) as count FROM votes
         WHERE json_extract(author, '$.address') = ? AND receivedAt >= ?`
            )
            .get(authorAddress, sinceTimestamp) as { count: number };

        const editCount = this.db
            .prepare(
                `SELECT COUNT(*) as count FROM commentEdits
         WHERE json_extract(author, '$.address') = ? AND receivedAt >= ?`
            )
            .get(authorAddress, sinceTimestamp) as { count: number };

        const moderationCount = this.db
            .prepare(
                `SELECT COUNT(*) as count FROM commentModerations
         WHERE json_extract(author, '$.address') = ? AND receivedAt >= ?`
            )
            .get(authorAddress, sinceTimestamp) as { count: number };

        return commentCount.count + voteCount.count + editCount.count + moderationCount.count;
    }

    /**
     * Count publications by author in the last hour and last 24 hours.
     * Returns both counts for velocity calculation.
     */
    getAuthorVelocityStats(authorAddress: string): { lastHour: number; last24Hours: number } {
        const now = Math.floor(Date.now() / 1000);
        const oneHourAgo = now - 3600;
        const oneDayAgo = now - 86400;

        return {
            lastHour: this.countPublicationsByAuthor(authorAddress, oneHourAgo),
            last24Hours: this.countPublicationsByAuthor(authorAddress, oneDayAgo)
        };
    }

    // ============================================
    // Publication Insertion Methods
    // ============================================

    /**
     * Insert a comment publication.
     */
    insertComment(params: {
        challengeId: string;
        publication: {
            author: unknown;
            subplebbitAddress: string;
            parentCid?: string;
            content?: string;
            link?: string;
            linkWidth?: number;
            linkHeight?: number;
            postCid?: string;
            signature: unknown;
            title?: string;
            timestamp: number;
            linkHtmlTagName?: string;
            flair?: unknown;
            spoiler?: boolean;
            protocolVersion: string;
            nsfw?: boolean;
        };
    }): void {
        const stmt = this.db.prepare(`
            INSERT INTO comments (
                challengeId, author, subplebbitAddress, parentCid, content, link,
                linkWidth, linkHeight, postCid, signature, title, timestamp,
                linkHtmlTagName, flair, spoiler, protocolVersion, nsfw
            ) VALUES (
                @challengeId, @author, @subplebbitAddress, @parentCid, @content, @link,
                @linkWidth, @linkHeight, @postCid, @signature, @title, @timestamp,
                @linkHtmlTagName, @flair, @spoiler, @protocolVersion, @nsfw
            )
        `);

        stmt.run({
            challengeId: params.challengeId,
            author: JSON.stringify(params.publication.author),
            subplebbitAddress: params.publication.subplebbitAddress,
            parentCid: params.publication.parentCid ?? null,
            content: params.publication.content ?? null,
            link: params.publication.link ?? null,
            linkWidth: params.publication.linkWidth ?? null,
            linkHeight: params.publication.linkHeight ?? null,
            postCid: params.publication.postCid ?? null,
            signature: JSON.stringify(params.publication.signature),
            title: params.publication.title ?? null,
            timestamp: params.publication.timestamp,
            linkHtmlTagName: params.publication.linkHtmlTagName ?? null,
            flair: params.publication.flair ? JSON.stringify(params.publication.flair) : null,
            spoiler: params.publication.spoiler !== undefined ? (params.publication.spoiler ? 1 : 0) : null,
            protocolVersion: params.publication.protocolVersion,
            nsfw: params.publication.nsfw !== undefined ? (params.publication.nsfw ? 1 : 0) : null
        });
    }

    /**
     * Insert a vote publication.
     */
    insertVote(params: {
        challengeId: string;
        publication: {
            author: unknown;
            subplebbitAddress: string;
            commentCid: string;
            signature: unknown;
            protocolVersion: string;
            vote: number;
            timestamp: number;
        };
    }): void {
        const stmt = this.db.prepare(`
            INSERT INTO votes (
                challengeId, author, subplebbitAddress, commentCid, signature,
                protocolVersion, vote, timestamp
            ) VALUES (
                @challengeId, @author, @subplebbitAddress, @commentCid, @signature,
                @protocolVersion, @vote, @timestamp
            )
        `);

        stmt.run({
            challengeId: params.challengeId,
            author: JSON.stringify(params.publication.author),
            subplebbitAddress: params.publication.subplebbitAddress,
            commentCid: params.publication.commentCid,
            signature: JSON.stringify(params.publication.signature),
            protocolVersion: params.publication.protocolVersion,
            vote: params.publication.vote,
            timestamp: params.publication.timestamp
        });
    }

    /**
     * Insert a comment edit publication.
     */
    insertCommentEdit(params: {
        challengeId: string;
        publication: {
            author: unknown;
            subplebbitAddress: string;
            commentCid: string;
            signature: unknown;
            protocolVersion: string;
            content?: string;
            reason?: string;
            deleted?: boolean;
            flair?: unknown;
            spoiler?: boolean;
            nsfw?: boolean;
            timestamp: number;
        };
    }): void {
        const stmt = this.db.prepare(`
            INSERT INTO commentEdits (
                challengeId, author, subplebbitAddress, commentCid, signature,
                protocolVersion, content, reason, deleted, flair, spoiler, nsfw, timestamp
            ) VALUES (
                @challengeId, @author, @subplebbitAddress, @commentCid, @signature,
                @protocolVersion, @content, @reason, @deleted, @flair, @spoiler, @nsfw, @timestamp
            )
        `);

        stmt.run({
            challengeId: params.challengeId,
            author: JSON.stringify(params.publication.author),
            subplebbitAddress: params.publication.subplebbitAddress,
            commentCid: params.publication.commentCid,
            signature: JSON.stringify(params.publication.signature),
            protocolVersion: params.publication.protocolVersion,
            content: params.publication.content ?? null,
            reason: params.publication.reason ?? null,
            deleted: params.publication.deleted !== undefined ? (params.publication.deleted ? 1 : 0) : null,
            flair: params.publication.flair ? JSON.stringify(params.publication.flair) : null,
            spoiler: params.publication.spoiler !== undefined ? (params.publication.spoiler ? 1 : 0) : null,
            nsfw: params.publication.nsfw !== undefined ? (params.publication.nsfw ? 1 : 0) : null,
            timestamp: params.publication.timestamp
        });
    }

    /**
     * Insert a comment moderation publication.
     */
    insertCommentModeration(params: {
        challengeId: string;
        publication: {
            author: unknown;
            subplebbitAddress: string;
            commentCid: string;
            commentModeration?: unknown;
            signature: unknown;
            protocolVersion?: string;
            timestamp: number;
        };
    }): void {
        const stmt = this.db.prepare(`
            INSERT INTO commentModerations (
                challengeId, author, subplebbitAddress, commentCid, commentModeration,
                signature, protocolVersion, timestamp
            ) VALUES (
                @challengeId, @author, @subplebbitAddress, @commentCid, @commentModeration,
                @signature, @protocolVersion, @timestamp
            )
        `);

        stmt.run({
            challengeId: params.challengeId,
            author: JSON.stringify(params.publication.author),
            subplebbitAddress: params.publication.subplebbitAddress,
            commentCid: params.publication.commentCid,
            commentModeration: params.publication.commentModeration ? JSON.stringify(params.publication.commentModeration) : null,
            signature: JSON.stringify(params.publication.signature),
            protocolVersion: params.publication.protocolVersion ?? null,
            timestamp: params.publication.timestamp
        });
    }

    // ============================================
    // Wallet Velocity Query Methods
    // ============================================

    /**
     * Count publications by wallet address for a specific publication type within a time window.
     * Searches for wallet addresses in author.wallets.
     */
    countPublicationsByWallet(
        walletAddress: string,
        publicationType: "post" | "reply" | "vote" | "commentEdit" | "commentModeration",
        sinceTimestamp: number
    ): number {
        // Normalize wallet address to lowercase for case-insensitive comparison
        const normalizedWallet = walletAddress.toLowerCase();

        // Build the wallet matching condition
        // Matches if any wallet in author.wallets.*.address matches
        const walletCondition = `(
            EXISTS (
                SELECT 1 FROM json_each(json_extract(author, '$.wallets'))
                WHERE LOWER(json_extract(value, '$.address')) = ?
            )
        )`;

        let count = 0;

        if (publicationType === "post") {
            // Posts are comments without parentCid
            const result = this.db
                .prepare(
                    `SELECT COUNT(*) as count FROM comments
                    WHERE ${walletCondition} AND parentCid IS NULL AND receivedAt >= ?`
                )
                .get(normalizedWallet, sinceTimestamp) as { count: number };
            count = result.count;
        } else if (publicationType === "reply") {
            // Replies are comments with parentCid
            const result = this.db
                .prepare(
                    `SELECT COUNT(*) as count FROM comments
                    WHERE ${walletCondition} AND parentCid IS NOT NULL AND receivedAt >= ?`
                )
                .get(normalizedWallet, sinceTimestamp) as { count: number };
            count = result.count;
        } else if (publicationType === "vote") {
            const result = this.db
                .prepare(
                    `SELECT COUNT(*) as count FROM votes
                    WHERE ${walletCondition} AND receivedAt >= ?`
                )
                .get(normalizedWallet, sinceTimestamp) as { count: number };
            count = result.count;
        } else if (publicationType === "commentEdit") {
            const result = this.db
                .prepare(
                    `SELECT COUNT(*) as count FROM commentEdits
                    WHERE ${walletCondition} AND receivedAt >= ?`
                )
                .get(normalizedWallet, sinceTimestamp) as { count: number };
            count = result.count;
        } else if (publicationType === "commentModeration") {
            const result = this.db
                .prepare(
                    `SELECT COUNT(*) as count FROM commentModerations
                    WHERE ${walletCondition} AND receivedAt >= ?`
                )
                .get(normalizedWallet, sinceTimestamp) as { count: number };
            count = result.count;
        }

        return count;
    }

    /**
     * Get wallet velocity stats for a specific publication type.
     * Returns publication counts in the last hour and last 24 hours.
     */
    getWalletVelocityStats(
        walletAddress: string,
        publicationType: "post" | "reply" | "vote" | "commentEdit" | "commentModeration"
    ): { lastHour: number; last24Hours: number } {
        const now = Math.floor(Date.now() / 1000);
        const oneHourAgo = now - 3600;
        const oneDayAgo = now - 86400;

        return {
            lastHour: this.countPublicationsByWallet(walletAddress, publicationType, oneHourAgo),
            last24Hours: this.countPublicationsByWallet(walletAddress, publicationType, oneDayAgo)
        };
    }
}

/**
 * Create a database instance.
 */
export function createDatabase(path: string): SpamDetectionDatabase {
    return new SpamDetectionDatabase({ path });
}

export { SCHEMA_SQL } from "./schema.js";
