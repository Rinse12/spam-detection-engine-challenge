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

    // ============================================
    // Account Age Query Methods
    // ============================================

    /**
     * Get the latest karma (postScore + replyScore) per subplebbit for an author.
     * Only counts the most recent karma from each subplebbit to avoid summing duplicates.
     * Returns a map of subplebbitAddress -> { postScore, replyScore, receivedAt }
     */
    getAuthorKarmaBySubplebbit(authorAddress: string): Map<string, { postScore: number; replyScore: number; receivedAt: number }> {
        const karmaMap = new Map<string, { postScore: number; replyScore: number; receivedAt: number }>();

        // Helper to update karma map with newer data only
        const updateKarmaMap = (subplebbitAddress: string, postScore: number, replyScore: number, receivedAt: number) => {
            const existing = karmaMap.get(subplebbitAddress);
            if (!existing || receivedAt > existing.receivedAt) {
                karmaMap.set(subplebbitAddress, { postScore, replyScore, receivedAt });
            }
        };

        // Query comments for karma data
        const commentRows = this.db
            .prepare(
                `SELECT
                    subplebbitAddress,
                    COALESCE(json_extract(author, '$.subplebbit.postScore'), 0) as postScore,
                    COALESCE(json_extract(author, '$.subplebbit.replyScore'), 0) as replyScore,
                    receivedAt
                 FROM comments
                 WHERE json_extract(author, '$.address') = ?
                 ORDER BY receivedAt DESC`
            )
            .all(authorAddress) as Array<{ subplebbitAddress: string; postScore: number; replyScore: number; receivedAt: number }>;

        for (const row of commentRows) {
            updateKarmaMap(row.subplebbitAddress, row.postScore, row.replyScore, row.receivedAt);
        }

        // Query votes for karma data
        const voteRows = this.db
            .prepare(
                `SELECT
                    subplebbitAddress,
                    COALESCE(json_extract(author, '$.subplebbit.postScore'), 0) as postScore,
                    COALESCE(json_extract(author, '$.subplebbit.replyScore'), 0) as replyScore,
                    receivedAt
                 FROM votes
                 WHERE json_extract(author, '$.address') = ?
                 ORDER BY receivedAt DESC`
            )
            .all(authorAddress) as Array<{ subplebbitAddress: string; postScore: number; replyScore: number; receivedAt: number }>;

        for (const row of voteRows) {
            updateKarmaMap(row.subplebbitAddress, row.postScore, row.replyScore, row.receivedAt);
        }

        // Query comment edits for karma data
        const editRows = this.db
            .prepare(
                `SELECT
                    subplebbitAddress,
                    COALESCE(json_extract(author, '$.subplebbit.postScore'), 0) as postScore,
                    COALESCE(json_extract(author, '$.subplebbit.replyScore'), 0) as replyScore,
                    receivedAt
                 FROM commentEdits
                 WHERE json_extract(author, '$.address') = ?
                 ORDER BY receivedAt DESC`
            )
            .all(authorAddress) as Array<{ subplebbitAddress: string; postScore: number; replyScore: number; receivedAt: number }>;

        for (const row of editRows) {
            updateKarmaMap(row.subplebbitAddress, row.postScore, row.replyScore, row.receivedAt);
        }

        // Query comment moderations for karma data
        const moderationRows = this.db
            .prepare(
                `SELECT
                    subplebbitAddress,
                    COALESCE(json_extract(author, '$.subplebbit.postScore'), 0) as postScore,
                    COALESCE(json_extract(author, '$.subplebbit.replyScore'), 0) as replyScore,
                    receivedAt
                 FROM commentModerations
                 WHERE json_extract(author, '$.address') = ?
                 ORDER BY receivedAt DESC`
            )
            .all(authorAddress) as Array<{ subplebbitAddress: string; postScore: number; replyScore: number; receivedAt: number }>;

        for (const row of moderationRows) {
            updateKarmaMap(row.subplebbitAddress, row.postScore, row.replyScore, row.receivedAt);
        }

        return karmaMap;
    }

    /**
     * Get the total aggregated karma for an author across all subplebbits in our database.
     * Only counts the latest karma from each subplebbit to avoid summing duplicates.
     * Returns { totalPostScore, totalReplyScore, subplebbitCount }
     */
    getAuthorAggregatedKarma(authorAddress: string): { totalPostScore: number; totalReplyScore: number; subplebbitCount: number } {
        const karmaMap = this.getAuthorKarmaBySubplebbit(authorAddress);

        let totalPostScore = 0;
        let totalReplyScore = 0;

        for (const karma of karmaMap.values()) {
            totalPostScore += karma.postScore;
            totalReplyScore += karma.replyScore;
        }

        return {
            totalPostScore,
            totalReplyScore,
            subplebbitCount: karmaMap.size
        };
    }

    // ============================================
    // Similar Content Query Methods
    // ============================================

    /**
     * Find comments with similar or identical content and/or title.
     * Used for detecting duplicate/spam content.
     *
     * @param params.content - The content to search for similarity
     * @param params.title - The title to search for similarity
     * @param params.excludeChallengeId - Challenge ID to exclude from results (current publication)
     * @param params.sinceTimestamp - Only search comments after this timestamp
     * @param params.limit - Maximum number of results to return
     * @returns Array of similar comments with their content/title and author info
     */
    findSimilarComments(params: {
        content?: string;
        title?: string;
        excludeChallengeId?: string;
        sinceTimestamp?: number;
        limit?: number;
    }): Array<{
        challengeId: string;
        authorAddress: string;
        content: string | null;
        title: string | null;
        subplebbitAddress: string;
        receivedAt: number;
    }> {
        const { content, title, excludeChallengeId, sinceTimestamp, limit = 50 } = params;

        // Build query conditions
        const conditions: string[] = [];
        const queryParams: Record<string, unknown> = {};

        if (excludeChallengeId) {
            conditions.push("challengeId != @excludeChallengeId");
            queryParams.excludeChallengeId = excludeChallengeId;
        }

        if (sinceTimestamp) {
            conditions.push("receivedAt >= @sinceTimestamp");
            queryParams.sinceTimestamp = sinceTimestamp;
        }

        // Build content/title matching conditions
        const contentConditions: string[] = [];

        if (content && content.trim().length > 0) {
            // Exact match or very similar (normalized whitespace, case-insensitive)
            contentConditions.push("LOWER(TRIM(content)) = LOWER(TRIM(@content))");
            queryParams.content = content;
        }

        if (title && title.trim().length > 0) {
            // Exact match on title (normalized)
            contentConditions.push("LOWER(TRIM(title)) = LOWER(TRIM(@title))");
            queryParams.title = title;
        }

        if (contentConditions.length === 0) {
            return [];
        }

        // We want comments that match content OR title
        conditions.push(`(${contentConditions.join(" OR ")})`);

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const query = `
            SELECT
                challengeId,
                json_extract(author, '$.address') as authorAddress,
                content,
                title,
                subplebbitAddress,
                receivedAt
            FROM comments
            ${whereClause}
            ORDER BY receivedAt DESC
            LIMIT @limit
        `;

        queryParams.limit = limit;

        return this.db.prepare(query).all(queryParams) as Array<{
            challengeId: string;
            authorAddress: string;
            content: string | null;
            title: string | null;
            subplebbitAddress: string;
            receivedAt: number;
        }>;
    }

    /**
     * Find similar comments by content or title from the same author.
     * Returns comments that have:
     * - Exact match (case-insensitive, trimmed)
     * - Content that contains the search content as a substring (or vice versa)
     *
     * Used to detect self-spamming with slight variations.
     */
    findSimilarContentByAuthor(params: {
        authorAddress: string;
        content?: string;
        title?: string;
        sinceTimestamp?: number;
        limit?: number;
    }): Array<{
        challengeId: string;
        content: string | null;
        title: string | null;
        subplebbitAddress: string;
        receivedAt: number;
    }> {
        const { authorAddress, content, title, sinceTimestamp, limit = 100 } = params;

        const conditions: string[] = ["json_extract(author, '$.address') = @authorAddress"];
        const queryParams: Record<string, unknown> = { authorAddress, limit };

        if (sinceTimestamp) {
            conditions.push("receivedAt >= @sinceTimestamp");
            queryParams.sinceTimestamp = sinceTimestamp;
        }

        // Build content/title matching conditions
        // Match if: exact match OR one contains the other
        const matchConditions: string[] = [];

        if (content && content.trim().length > 10) {
            const normalizedContent = content.trim().toLowerCase();
            queryParams.content = normalizedContent;
            queryParams.contentLike = `%${normalizedContent}%`;
            matchConditions.push(`(
                LOWER(TRIM(content)) = @content
                OR LOWER(TRIM(content)) LIKE @contentLike
                OR @content LIKE '%' || LOWER(TRIM(content)) || '%'
            )`);
        }

        if (title && title.trim().length > 5) {
            const normalizedTitle = title.trim().toLowerCase();
            queryParams.title = normalizedTitle;
            queryParams.titleLike = `%${normalizedTitle}%`;
            matchConditions.push(`(
                LOWER(TRIM(title)) = @title
                OR LOWER(TRIM(title)) LIKE @titleLike
                OR @title LIKE '%' || LOWER(TRIM(title)) || '%'
            )`);
        }

        if (matchConditions.length === 0) {
            return [];
        }

        conditions.push(`(${matchConditions.join(" OR ")})`);

        const query = `
            SELECT challengeId, content, title, subplebbitAddress, receivedAt
            FROM comments
            WHERE ${conditions.join(" AND ")}
            ORDER BY receivedAt DESC
            LIMIT @limit
        `;

        return this.db.prepare(query).all(queryParams) as Array<{
            challengeId: string;
            content: string | null;
            title: string | null;
            subplebbitAddress: string;
            receivedAt: number;
        }>;
    }

    /**
     * Find similar comments by content or title from different authors.
     * Returns comments that have:
     * - Exact match (case-insensitive, trimmed)
     * - Content that contains the search content as a substring (or vice versa)
     *
     * Used to detect coordinated spam campaigns.
     */
    findSimilarContentByOthers(params: {
        authorAddress: string;
        content?: string;
        title?: string;
        sinceTimestamp?: number;
        limit?: number;
    }): Array<{
        challengeId: string;
        authorAddress: string;
        content: string | null;
        title: string | null;
        subplebbitAddress: string;
        receivedAt: number;
    }> {
        const { authorAddress, content, title, sinceTimestamp, limit = 100 } = params;

        const conditions: string[] = ["json_extract(author, '$.address') != @authorAddress"];
        const queryParams: Record<string, unknown> = { authorAddress, limit };

        if (sinceTimestamp) {
            conditions.push("receivedAt >= @sinceTimestamp");
            queryParams.sinceTimestamp = sinceTimestamp;
        }

        // Build content/title matching conditions
        const matchConditions: string[] = [];

        if (content && content.trim().length > 10) {
            const normalizedContent = content.trim().toLowerCase();
            queryParams.content = normalizedContent;
            queryParams.contentLike = `%${normalizedContent}%`;
            matchConditions.push(`(
                LOWER(TRIM(content)) = @content
                OR LOWER(TRIM(content)) LIKE @contentLike
                OR @content LIKE '%' || LOWER(TRIM(content)) || '%'
            )`);
        }

        if (title && title.trim().length > 5) {
            const normalizedTitle = title.trim().toLowerCase();
            queryParams.title = normalizedTitle;
            queryParams.titleLike = `%${normalizedTitle}%`;
            matchConditions.push(`(
                LOWER(TRIM(title)) = @title
                OR LOWER(TRIM(title)) LIKE @titleLike
                OR @title LIKE '%' || LOWER(TRIM(title)) || '%'
            )`);
        }

        if (matchConditions.length === 0) {
            return [];
        }

        conditions.push(`(${matchConditions.join(" OR ")})`);

        const query = `
            SELECT
                challengeId,
                json_extract(author, '$.address') as authorAddress,
                content,
                title,
                subplebbitAddress,
                receivedAt
            FROM comments
            WHERE ${conditions.join(" AND ")}
            ORDER BY receivedAt DESC
            LIMIT @limit
        `;

        return this.db.prepare(query).all(queryParams) as Array<{
            challengeId: string;
            authorAddress: string;
            content: string | null;
            title: string | null;
            subplebbitAddress: string;
            receivedAt: number;
        }>;
    }

    /**
     * Get the earliest receivedAt timestamp for an author across all publication types.
     * This represents when we first saw this author in our own database.
     * Returns undefined if the author has no publications in our database.
     */
    getAuthorFirstSeenTimestamp(authorAddress: string): number | undefined {
        // Query each publication type for the minimum receivedAt
        const commentMin = this.db
            .prepare(
                `SELECT MIN(receivedAt) as minTime FROM comments
                 WHERE json_extract(author, '$.address') = ?`
            )
            .get(authorAddress) as { minTime: number | null };

        const voteMin = this.db
            .prepare(
                `SELECT MIN(receivedAt) as minTime FROM votes
                 WHERE json_extract(author, '$.address') = ?`
            )
            .get(authorAddress) as { minTime: number | null };

        const editMin = this.db
            .prepare(
                `SELECT MIN(receivedAt) as minTime FROM commentEdits
                 WHERE json_extract(author, '$.address') = ?`
            )
            .get(authorAddress) as { minTime: number | null };

        const moderationMin = this.db
            .prepare(
                `SELECT MIN(receivedAt) as minTime FROM commentModerations
                 WHERE json_extract(author, '$.address') = ?`
            )
            .get(authorAddress) as { minTime: number | null };

        // Collect all non-null timestamps
        const timestamps = [commentMin.minTime, voteMin.minTime, editMin.minTime, moderationMin.minTime].filter(
            (t): t is number => t !== null
        );

        if (timestamps.length === 0) {
            return undefined;
        }

        return Math.min(...timestamps);
    }
}

/**
 * Create a database instance.
 */
export function createDatabase(path: string): SpamDetectionDatabase {
    return new SpamDetectionDatabase({ path });
}

export { SCHEMA_SQL } from "./schema.js";
