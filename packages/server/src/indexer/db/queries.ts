/**
 * Database queries for the indexer module.
 * Provides methods for managing indexed subplebbits, comments, and modqueue.
 */

import type { Database } from "better-sqlite3";
import type {
    AuthorNetworkStats,
    DiscoverySource,
    IndexedCommentIpfs,
    IndexedCommentUpdate,
    IndexedSubplebbit,
    ModQueueCommentIpfs,
    ModQueueCommentUpdate
} from "../types.js";

/**
 * Indexer database operations.
 */
export class IndexerQueries {
    constructor(private db: Database) {}

    // ============================================
    // Indexed Subplebbits
    // ============================================

    /**
     * Insert or update an indexed subplebbit.
     */
    upsertIndexedSubplebbit(params: { address: string; publicKey?: string; discoveredVia: DiscoverySource }): void {
        const now = Math.floor(Date.now() / 1000);
        this.db
            .prepare(
                `INSERT INTO indexed_subplebbits (address, publicKey, discoveredVia, discoveredAt)
                 VALUES (@address, @publicKey, @discoveredVia, @discoveredAt)
                 ON CONFLICT(address) DO UPDATE SET
                     publicKey = COALESCE(@publicKey, publicKey)`
            )
            .run({
                address: params.address,
                publicKey: params.publicKey ?? null,
                discoveredVia: params.discoveredVia,
                discoveredAt: now
            });
    }

    /**
     * Get all indexed subplebbits that are enabled for indexing.
     */
    getEnabledSubplebbits(): IndexedSubplebbit[] {
        return this.db.prepare(`SELECT * FROM indexed_subplebbits WHERE indexingEnabled = 1`).all() as IndexedSubplebbit[];
    }

    /**
     * Get an indexed subplebbit by address.
     */
    getIndexedSubplebbit(address: string): IndexedSubplebbit | undefined {
        return this.db.prepare(`SELECT * FROM indexed_subplebbits WHERE address = ?`).get(address) as IndexedSubplebbit | undefined;
    }

    /**
     * Update subplebbit cache markers (for change detection).
     */
    updateSubplebbitCacheMarkers(address: string, lastPostsPageCidNew: string | null, lastSubplebbitUpdatedAt: number | null): void {
        this.db
            .prepare(
                `UPDATE indexed_subplebbits
                 SET lastPostsPageCidNew = @lastPostsPageCidNew,
                     lastSubplebbitUpdatedAt = @lastSubplebbitUpdatedAt,
                     consecutiveErrors = 0,
                     lastError = NULL
                 WHERE address = @address`
            )
            .run({
                address,
                lastPostsPageCidNew,
                lastSubplebbitUpdatedAt
            });
    }

    /**
     * Record an error for a subplebbit and increment error count.
     */
    recordSubplebbitError(address: string, error: string): void {
        this.db
            .prepare(
                `UPDATE indexed_subplebbits
                 SET consecutiveErrors = consecutiveErrors + 1,
                     lastError = @error
                 WHERE address = @address`
            )
            .run({ address, error });
    }

    /**
     * Disable indexing for a subplebbit.
     */
    disableSubplebbitIndexing(address: string): void {
        this.db.prepare(`UPDATE indexed_subplebbits SET indexingEnabled = 0 WHERE address = ?`).run(address);
    }

    // ============================================
    // Indexed Comments (IPFS)
    // ============================================

    /**
     * Insert an indexed comment IPFS record if it doesn't exist.
     * CommentIpfs is immutable, so we only insert once and never update.
     */
    insertIndexedCommentIpfsIfNotExists(params: {
        cid: string;
        subplebbitAddress: string;
        author: unknown;
        signature: unknown;
        parentCid: string | null;
        content: string | null;
        title: string | null;
        link: string | null;
        timestamp: number;
        depth: number | null;
        protocolVersion: string | null;
    }): void {
        const now = Math.floor(Date.now() / 1000);
        this.db
            .prepare(
                `INSERT INTO indexed_comments_ipfs (
                    cid, subplebbitAddress, author, signature, parentCid, content, title, link,
                    timestamp, depth, protocolVersion, fetchedAt
                 ) VALUES (
                    @cid, @subplebbitAddress, @author, @signature, @parentCid, @content, @title, @link,
                    @timestamp, @depth, @protocolVersion, @fetchedAt
                 ) ON CONFLICT(cid) DO NOTHING`
            )
            .run({
                cid: params.cid,
                subplebbitAddress: params.subplebbitAddress,
                author: JSON.stringify(params.author),
                signature: JSON.stringify(params.signature),
                parentCid: params.parentCid,
                content: params.content,
                title: params.title,
                link: params.link,
                timestamp: params.timestamp,
                depth: params.depth,
                protocolVersion: params.protocolVersion,
                fetchedAt: now
            });
    }

    /**
     * Check if a comment IPFS record exists.
     */
    hasIndexedCommentIpfs(cid: string): boolean {
        const result = this.db.prepare(`SELECT 1 FROM indexed_comments_ipfs WHERE cid = ?`).get(cid);
        return result !== undefined;
    }

    /**
     * Get an indexed comment IPFS record.
     */
    getIndexedCommentIpfs(cid: string): IndexedCommentIpfs | undefined {
        return this.db.prepare(`SELECT * FROM indexed_comments_ipfs WHERE cid = ?`).get(cid) as IndexedCommentIpfs | undefined;
    }

    /**
     * Get author's previousCommentCid from a comment.
     */
    getAuthorPreviousCommentCid(cid: string): string | null {
        const result = this.db
            .prepare(`SELECT json_extract(author, '$.previousCommentCid') as previousCid FROM indexed_comments_ipfs WHERE cid = ?`)
            .get(cid) as { previousCid: string | null } | undefined;
        return result?.previousCid ?? null;
    }

    // ============================================
    // Indexed Comments (Update)
    // ============================================

    /**
     * Insert or update an indexed comment update record.
     */
    upsertIndexedCommentUpdate(params: {
        cid: string;
        author: unknown | null;
        upvoteCount: number | null;
        downvoteCount: number | null;
        replyCount: number | null;
        removed: boolean | null;
        deleted: boolean | null;
        locked: boolean | null;
        pinned: boolean | null;
        approved: boolean | null;
        updatedAt: number | null;
        lastRepliesPageCid?: string | null;
    }): void {
        const now = Math.floor(Date.now() / 1000);
        this.db
            .prepare(
                `INSERT INTO indexed_comments_update (
                    cid, author, upvoteCount, downvoteCount, replyCount, removed, deleted, locked,
                    pinned, approved, updatedAt, lastRepliesPageCid, fetchedAt, fetchFailureCount
                 ) VALUES (
                    @cid, @author, @upvoteCount, @downvoteCount, @replyCount, @removed, @deleted, @locked,
                    @pinned, @approved, @updatedAt, @lastRepliesPageCid, @fetchedAt, 0
                 ) ON CONFLICT(cid) DO UPDATE SET
                    author = @author,
                    upvoteCount = @upvoteCount,
                    downvoteCount = @downvoteCount,
                    replyCount = @replyCount,
                    removed = @removed,
                    deleted = @deleted,
                    locked = @locked,
                    pinned = @pinned,
                    approved = @approved,
                    updatedAt = @updatedAt,
                    lastRepliesPageCid = COALESCE(@lastRepliesPageCid, lastRepliesPageCid),
                    fetchedAt = @fetchedAt,
                    fetchFailureCount = 0`
            )
            .run({
                cid: params.cid,
                author: params.author ? JSON.stringify(params.author) : null,
                upvoteCount: params.upvoteCount,
                downvoteCount: params.downvoteCount,
                replyCount: params.replyCount,
                removed: params.removed === null ? null : params.removed ? 1 : 0,
                deleted: params.deleted === null ? null : params.deleted ? 1 : 0,
                locked: params.locked === null ? null : params.locked ? 1 : 0,
                pinned: params.pinned === null ? null : params.pinned ? 1 : 0,
                approved: params.approved === null ? null : params.approved ? 1 : 0,
                updatedAt: params.updatedAt,
                lastRepliesPageCid: params.lastRepliesPageCid ?? null,
                fetchedAt: now
            });
    }

    /**
     * Get the last indexed replies page CID for a comment.
     * Used to skip re-fetching replies if unchanged.
     */
    getLastRepliesPageCid(cid: string): string | null {
        const result = this.db.prepare(`SELECT lastRepliesPageCid FROM indexed_comments_update WHERE cid = ?`).get(cid) as
            | { lastRepliesPageCid: string | null }
            | undefined;
        return result?.lastRepliesPageCid ?? null;
    }

    /**
     * Update only the lastRepliesPageCid for a comment.
     * Called after successfully fetching replies.
     */
    updateLastRepliesPageCid(cid: string, lastRepliesPageCid: string): void {
        this.db
            .prepare(`UPDATE indexed_comments_update SET lastRepliesPageCid = @lastRepliesPageCid WHERE cid = @cid`)
            .run({ cid, lastRepliesPageCid });
    }

    /**
     * Record a failed CommentUpdate fetch.
     */
    recordCommentUpdateFetchFailure(cid: string): void {
        const now = Math.floor(Date.now() / 1000);
        // First ensure there's a row to update
        this.db
            .prepare(
                `INSERT INTO indexed_comments_update (cid, fetchFailureCount, lastFetchFailedAt)
                 VALUES (@cid, 1, @now)
                 ON CONFLICT(cid) DO UPDATE SET
                    fetchFailureCount = fetchFailureCount + 1,
                    lastFetchFailedAt = @now`
            )
            .run({ cid, now });
    }

    /**
     * Get an indexed comment update record.
     */
    getIndexedCommentUpdate(cid: string): IndexedCommentUpdate | undefined {
        return this.db.prepare(`SELECT * FROM indexed_comments_update WHERE cid = ?`).get(cid) as IndexedCommentUpdate | undefined;
    }

    // ============================================
    // ModQueue Comments (IPFS)
    // ============================================

    /**
     * Insert or update a modqueue comment IPFS record.
     */
    upsertModQueueCommentIpfs(params: {
        cid: string;
        subplebbitAddress: string;
        author: unknown;
        signature: unknown;
        parentCid: string | null;
        content: string | null;
        title: string | null;
        link: string | null;
        timestamp: number;
        depth: number | null;
        protocolVersion: string | null;
    }): void {
        const now = Math.floor(Date.now() / 1000);
        this.db
            .prepare(
                `INSERT INTO modqueue_comments_ipfs (
                    cid, subplebbitAddress, author, signature, parentCid, content, title, link,
                    timestamp, depth, protocolVersion, firstSeenAt
                 ) VALUES (
                    @cid, @subplebbitAddress, @author, @signature, @parentCid, @content, @title, @link,
                    @timestamp, @depth, @protocolVersion, @firstSeenAt
                 ) ON CONFLICT(cid) DO NOTHING`
            )
            .run({
                cid: params.cid,
                subplebbitAddress: params.subplebbitAddress,
                author: JSON.stringify(params.author),
                signature: JSON.stringify(params.signature),
                parentCid: params.parentCid,
                content: params.content,
                title: params.title,
                link: params.link,
                timestamp: params.timestamp,
                depth: params.depth,
                protocolVersion: params.protocolVersion,
                firstSeenAt: now
            });
    }

    // ============================================
    // ModQueue Comments (Update)
    // ============================================

    /**
     * Insert or update a modqueue comment update record.
     */
    upsertModQueueCommentUpdate(params: {
        cid: string;
        author: unknown | null;
        protocolVersion: string | null;
        number: number | null;
        postNumber: number | null;
    }): void {
        const now = Math.floor(Date.now() / 1000);
        this.db
            .prepare(
                `INSERT INTO modqueue_comments_update (
                    cid, author, protocolVersion, number, postNumber, pendingApproval, lastSeenAt
                 ) VALUES (
                    @cid, @author, @protocolVersion, @number, @postNumber, 1, @lastSeenAt
                 ) ON CONFLICT(cid) DO UPDATE SET
                    lastSeenAt = @lastSeenAt`
            )
            .run({
                cid: params.cid,
                author: params.author ? JSON.stringify(params.author) : null,
                protocolVersion: params.protocolVersion,
                number: params.number,
                postNumber: params.postNumber,
                lastSeenAt: now
            });
    }

    /**
     * Get all unresolved modqueue items for a subplebbit.
     */
    getUnresolvedModQueueItems(subplebbitAddress: string): ModQueueCommentUpdate[] {
        return this.db
            .prepare(
                `SELECT u.* FROM modqueue_comments_update u
                 JOIN modqueue_comments_ipfs i ON u.cid = i.cid
                 WHERE i.subplebbitAddress = ? AND u.resolved = 0`
            )
            .all(subplebbitAddress) as ModQueueCommentUpdate[];
    }

    /**
     * Mark a modqueue item as resolved.
     */
    resolveModQueueItem(cid: string, accepted: boolean): void {
        const now = Math.floor(Date.now() / 1000);
        this.db
            .prepare(
                `UPDATE modqueue_comments_update
                 SET resolved = 1, resolvedAt = @resolvedAt, accepted = @accepted
                 WHERE cid = @cid`
            )
            .run({
                cid,
                resolvedAt: now,
                accepted: accepted ? 1 : 0
            });
    }

    // ============================================
    // Author Network Stats (for risk scoring)
    // ============================================

    /**
     * Get network-wide stats for an author by their public key.
     * Used for risk scoring based on indexed data.
     */
    getAuthorNetworkStats(authorPublicKey: string): AuthorNetworkStats {
        // Count bans across subs
        const banResult = this.db
            .prepare(
                `SELECT COUNT(DISTINCT i.subplebbitAddress) as banCount
                 FROM indexed_comments_update u
                 JOIN indexed_comments_ipfs i ON u.cid = i.cid
                 WHERE json_extract(i.signature, '$.publicKey') = ?
                   AND json_extract(u.author, '$.subplebbit.banExpiresAt') IS NOT NULL`
            )
            .get(authorPublicKey) as { banCount: number };

        // Count removals
        const removalResult = this.db
            .prepare(
                `SELECT COUNT(*) as removalCount
                 FROM indexed_comments_update u
                 JOIN indexed_comments_ipfs i ON u.cid = i.cid
                 WHERE json_extract(i.signature, '$.publicKey') = ?
                   AND u.removed = 1`
            )
            .get(authorPublicKey) as { removalCount: number };

        // Count disapprovals
        const disapprovalResult = this.db
            .prepare(
                `SELECT COUNT(*) as disapprovalCount
                 FROM indexed_comments_update u
                 JOIN indexed_comments_ipfs i ON u.cid = i.cid
                 WHERE json_extract(i.signature, '$.publicKey') = ?
                   AND u.approved = 0`
            )
            .get(authorPublicKey) as { disapprovalCount: number };

        // Count unfetchable updates (likely purged)
        const unfetchableResult = this.db
            .prepare(
                `SELECT COUNT(*) as unfetchableCount
                 FROM indexed_comments_update u
                 JOIN indexed_comments_ipfs i ON u.cid = i.cid
                 WHERE json_extract(i.signature, '$.publicKey') = ?
                   AND u.fetchFailureCount > 0
                   AND (u.fetchedAt IS NULL OR u.lastFetchFailedAt > u.fetchedAt)`
            )
            .get(authorPublicKey) as { unfetchableCount: number };

        // ModQueue resolution stats
        const modqueueResult = this.db
            .prepare(
                `SELECT
                    COUNT(CASE WHEN u.accepted = 0 THEN 1 END) as rejected,
                    COUNT(CASE WHEN u.accepted = 1 THEN 1 END) as accepted
                 FROM modqueue_comments_update u
                 JOIN modqueue_comments_ipfs i ON u.cid = i.cid
                 WHERE json_extract(i.signature, '$.publicKey') = ?
                   AND u.resolved = 1`
            )
            .get(authorPublicKey) as { rejected: number; accepted: number };

        // Total indexed comments
        const totalResult = this.db
            .prepare(
                `SELECT COUNT(*) as total
                 FROM indexed_comments_ipfs
                 WHERE json_extract(signature, '$.publicKey') = ?`
            )
            .get(authorPublicKey) as { total: number };

        return {
            banCount: banResult.banCount,
            removalCount: removalResult.removalCount,
            disapprovalCount: disapprovalResult.disapprovalCount,
            unfetchableCount: unfetchableResult.unfetchableCount,
            modqueueRejected: modqueueResult.rejected,
            modqueueAccepted: modqueueResult.accepted,
            totalIndexedComments: totalResult.total
        };
    }

    /**
     * Get the earliest timestamp for an author across indexed comments.
     * Returns the true network-wide account age.
     */
    getAuthorFirstIndexedTimestamp(authorPublicKey: string): number | undefined {
        const result = this.db
            .prepare(
                `SELECT MIN(timestamp) as minTime
                 FROM indexed_comments_ipfs
                 WHERE json_extract(signature, '$.publicKey') = ?`
            )
            .get(authorPublicKey) as { minTime: number | null };

        return result.minTime ?? undefined;
    }

    /**
     * Get total indexed karma for an author across all subs.
     * Uses the latest CommentUpdate for each comment.
     */
    getAuthorIndexedKarma(authorPublicKey: string): { upvotes: number; downvotes: number } {
        const result = this.db
            .prepare(
                `SELECT
                    COALESCE(SUM(u.upvoteCount), 0) as upvotes,
                    COALESCE(SUM(u.downvoteCount), 0) as downvotes
                 FROM indexed_comments_update u
                 JOIN indexed_comments_ipfs i ON u.cid = i.cid
                 WHERE json_extract(i.signature, '$.publicKey') = ?`
            )
            .get(authorPublicKey) as { upvotes: number; downvotes: number };

        return result;
    }
}
