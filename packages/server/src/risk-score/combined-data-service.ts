/**
 * CombinedDataService - Queries both engine and indexer tables for risk factor calculations.
 *
 * Each factor has its own combination strategy:
 * - Account Age: Use the OLDEST timestamp from either source (MIN)
 * - Karma: Per-subplebbit, use the LATEST entry from either source
 * - Velocity: Combine counts from both sources (SUM)
 * - Content/Link Similarity: Query both sources (UNION)
 */

import type { SpamDetectionDatabase } from "../db/index.js";
import { IndexerQueries } from "../indexer/db/queries.js";

/**
 * Karma record with timestamp for recency comparison.
 */
export interface KarmaRecord {
    postScore: number;
    replyScore: number;
}

/**
 * Similar content match from either source.
 */
export interface SimilarContentMatch {
    /** Unique identifier - challengeId for engine, cid for indexer */
    id: string;
    /** Source of this match */
    source: "engine" | "indexer";
    authorPublicKey: string;
    content: string | null;
    title: string | null;
    subplebbitAddress: string;
    timestamp: number;
    contentSimilarity: number;
    titleSimilarity: number;
}

/**
 * Service that queries both engine and indexer databases for risk factor calculations.
 * Implements factor-specific combination strategies.
 */
export class CombinedDataService {
    private indexerQueries: IndexerQueries;

    constructor(private db: SpamDetectionDatabase) {
        this.indexerQueries = new IndexerQueries(db.getDb());
    }

    // ============================================
    // Account Age: Use the OLDEST timestamp (MIN)
    // ============================================

    /**
     * Get the earliest timestamp for an author from either source.
     * Uses the oldest timestamp to determine true account age.
     *
     * - Engine: Uses receivedAt (when we first saw the author)
     * - Indexer: Uses publication timestamp (actual post time)
     */
    getAuthorEarliestTimestamp(authorPublicKey: string): number | undefined {
        const engineFirstSeen = this.db.getAuthorFirstSeenTimestamp(authorPublicKey);
        const indexerFirstSeen = this.indexerQueries.getAuthorFirstIndexedTimestamp(authorPublicKey);

        if (engineFirstSeen !== undefined && indexerFirstSeen !== undefined) {
            return Math.min(engineFirstSeen, indexerFirstSeen);
        }
        return engineFirstSeen ?? indexerFirstSeen;
    }

    // ============================================
    // Karma: Per-subplebbit, use the LATEST entry
    // ============================================

    /**
     * Get karma per subplebbit, using the most recent data from either source.
     * For each subplebbit, if both sources have data, use the one with the more recent timestamp.
     */
    getAuthorKarmaBySubplebbit(authorPublicKey: string): Map<string, KarmaRecord> {
        const engineKarma = this.db.getAuthorKarmaBySubplebbit(authorPublicKey);
        const indexerKarma = this.indexerQueries.getAuthorKarmaBySubplebbitFromIndexer(authorPublicKey);

        const result = new Map<string, KarmaRecord>();

        // Collect all subplebbit addresses from both sources
        const allSubs = new Set([...engineKarma.keys(), ...indexerKarma.keys()]);

        for (const sub of allSubs) {
            const engine = engineKarma.get(sub);
            const indexer = indexerKarma.get(sub);

            if (engine && indexer) {
                // Both sources have data - use the one with higher updatedAt
                // Engine uses receivedAt (when we received the publication)
                // Indexer uses updatedAt (when subplebbit updated the comment metadata)
                if (engine.receivedAt >= indexer.updatedAt) {
                    result.set(sub, { postScore: engine.postScore, replyScore: engine.replyScore });
                } else {
                    result.set(sub, { postScore: indexer.postScore, replyScore: indexer.replyScore });
                }
            } else if (engine) {
                result.set(sub, { postScore: engine.postScore, replyScore: engine.replyScore });
            } else if (indexer) {
                result.set(sub, { postScore: indexer.postScore, replyScore: indexer.replyScore });
            }
        }

        return result;
    }

    // ============================================
    // Velocity: Combine counts from both sources (SUM)
    // ============================================

    /**
     * Get velocity stats combining both engine and indexer data.
     * The total posting rate across both sources indicates overall activity.
     *
     * Note: Indexer only tracks posts and replies. Votes, edits, and moderations
     * are only available from engine data.
     */
    getAuthorVelocityStats(
        authorPublicKey: string,
        publicationType: "post" | "reply" | "vote" | "commentEdit" | "commentModeration"
    ): { lastHour: number; last24Hours: number } {
        const engineStats = this.db.getAuthorVelocityStats(authorPublicKey, publicationType);

        // Indexer only tracks posts and replies (comments)
        if (publicationType === "post" || publicationType === "reply") {
            const indexerStats = this.indexerQueries.getAuthorVelocityFromIndexer(authorPublicKey, publicationType);
            return {
                lastHour: engineStats.lastHour + indexerStats.lastHour,
                last24Hours: engineStats.last24Hours + indexerStats.last24Hours
            };
        }

        // For votes, edits, moderations - indexer doesn't track these
        return engineStats;
    }

    /**
     * Get aggregate velocity stats across ALL publication types from both sources.
     */
    getAuthorAggregateVelocityStats(authorPublicKey: string): { lastHour: number; last24Hours: number } {
        const types: Array<"post" | "reply" | "vote" | "commentEdit" | "commentModeration"> = [
            "post",
            "reply",
            "vote",
            "commentEdit",
            "commentModeration"
        ];

        let lastHour = 0;
        let last24Hours = 0;

        for (const type of types) {
            const stats = this.getAuthorVelocityStats(authorPublicKey, type);
            lastHour += stats.lastHour;
            last24Hours += stats.last24Hours;
        }

        return { lastHour, last24Hours };
    }

    // ============================================
    // Content Similarity: Query both sources (UNION)
    // ============================================

    /**
     * Find exact matching content from both sources.
     * Used for detecting duplicate spam.
     */
    findExactContent(params: {
        content?: string;
        title?: string;
        sinceTimestamp: number;
        authorPublicKey?: string;
        excludeAuthorPublicKey?: string;
        limit?: number;
    }): Array<SimilarContentMatch> {
        const { content, title, sinceTimestamp, authorPublicKey, excludeAuthorPublicKey, limit = 50 } = params;

        const results: SimilarContentMatch[] = [];

        // Query engine (uses challengeId as identifier)
        if (authorPublicKey) {
            // Same author - exact matches
            const engineMatches = this.db.findSimilarComments({
                content,
                title,
                sinceTimestamp,
                limit
            });
            // Filter to same author
            for (const match of engineMatches) {
                if (match.authorPublicKey === authorPublicKey) {
                    results.push({
                        id: match.challengeId,
                        source: "engine",
                        authorPublicKey: match.authorPublicKey,
                        content: match.content,
                        title: match.title,
                        subplebbitAddress: match.subplebbitAddress,
                        timestamp: match.receivedAt,
                        contentSimilarity: 1.0,
                        titleSimilarity: 1.0
                    });
                }
            }
        } else if (excludeAuthorPublicKey) {
            // Other authors - exact matches
            const engineMatches = this.db.findSimilarComments({
                content,
                title,
                sinceTimestamp,
                limit
            });
            // Filter to other authors
            for (const match of engineMatches) {
                if (match.authorPublicKey !== excludeAuthorPublicKey) {
                    results.push({
                        id: match.challengeId,
                        source: "engine",
                        authorPublicKey: match.authorPublicKey,
                        content: match.content,
                        title: match.title,
                        subplebbitAddress: match.subplebbitAddress,
                        timestamp: match.receivedAt,
                        contentSimilarity: 1.0,
                        titleSimilarity: 1.0
                    });
                }
            }
        }

        // Query indexer (uses cid as identifier)
        const indexerMatches = this.indexerQueries.findExactContentFromIndexer({
            content,
            title,
            sinceTimestamp,
            authorPublicKey,
            excludeAuthorPublicKey,
            limit
        });

        for (const match of indexerMatches) {
            results.push({
                id: match.cid,
                source: "indexer",
                authorPublicKey: match.authorPublicKey,
                content: match.content,
                title: match.title,
                subplebbitAddress: match.subplebbitAddress,
                timestamp: match.timestamp,
                contentSimilarity: 1.0,
                titleSimilarity: 1.0
            });
        }

        // Sort by timestamp descending and limit
        results.sort((a, b) => b.timestamp - a.timestamp);
        return results.slice(0, limit);
    }

    /**
     * Find similar content by the same author from both sources.
     * Used for detecting self-spamming with variations.
     */
    findSimilarContentByAuthor(params: {
        authorPublicKey: string;
        content?: string;
        title?: string;
        sinceTimestamp: number;
        similarityThreshold?: number;
        limit?: number;
    }): Array<SimilarContentMatch> {
        const { authorPublicKey, content, title, sinceTimestamp, similarityThreshold = 0.6, limit = 100 } = params;

        const results: SimilarContentMatch[] = [];

        // Query engine
        const engineMatches = this.db.findSimilarContentByAuthor({
            authorPublicKey,
            content,
            title,
            sinceTimestamp,
            similarityThreshold,
            limit
        });

        for (const match of engineMatches) {
            results.push({
                id: match.challengeId,
                source: "engine",
                authorPublicKey,
                content: match.content,
                title: match.title,
                subplebbitAddress: match.subplebbitAddress,
                timestamp: match.receivedAt,
                contentSimilarity: match.contentSimilarity,
                titleSimilarity: match.titleSimilarity
            });
        }

        // Query indexer
        const indexerMatches = this.indexerQueries.findSimilarContentFromIndexer({
            authorPublicKey,
            content,
            title,
            sinceTimestamp,
            similarityThreshold,
            limit
        });

        for (const match of indexerMatches) {
            results.push({
                id: match.cid,
                source: "indexer",
                authorPublicKey: match.authorPublicKey,
                content: match.content,
                title: match.title,
                subplebbitAddress: match.subplebbitAddress,
                timestamp: match.timestamp,
                contentSimilarity: match.contentSimilarity,
                titleSimilarity: match.titleSimilarity
            });
        }

        // Sort by timestamp descending and limit
        results.sort((a, b) => b.timestamp - a.timestamp);
        return results.slice(0, limit);
    }

    /**
     * Find similar content by other authors from both sources.
     * Used for detecting coordinated spam campaigns.
     */
    findSimilarContentByOthers(params: {
        excludeAuthorPublicKey: string;
        content?: string;
        title?: string;
        sinceTimestamp: number;
        similarityThreshold?: number;
        limit?: number;
    }): Array<SimilarContentMatch> {
        const { excludeAuthorPublicKey, content, title, sinceTimestamp, similarityThreshold = 0.6, limit = 100 } = params;

        const results: SimilarContentMatch[] = [];

        // Query engine
        const engineMatches = this.db.findSimilarContentByOthers({
            authorPublicKey: excludeAuthorPublicKey,
            content,
            title,
            sinceTimestamp,
            similarityThreshold,
            limit
        });

        for (const match of engineMatches) {
            results.push({
                id: match.challengeId,
                source: "engine",
                authorPublicKey: match.authorPublicKey,
                content: match.content,
                title: match.title,
                subplebbitAddress: match.subplebbitAddress,
                timestamp: match.receivedAt,
                contentSimilarity: match.contentSimilarity,
                titleSimilarity: match.titleSimilarity
            });
        }

        // Query indexer
        const indexerMatches = this.indexerQueries.findSimilarContentFromIndexer({
            excludeAuthorPublicKey,
            content,
            title,
            sinceTimestamp,
            similarityThreshold,
            limit
        });

        for (const match of indexerMatches) {
            results.push({
                id: match.cid,
                source: "indexer",
                authorPublicKey: match.authorPublicKey,
                content: match.content,
                title: match.title,
                subplebbitAddress: match.subplebbitAddress,
                timestamp: match.timestamp,
                contentSimilarity: match.contentSimilarity,
                titleSimilarity: match.titleSimilarity
            });
        }

        // Sort by timestamp descending and limit
        results.sort((a, b) => b.timestamp - a.timestamp);
        return results.slice(0, limit);
    }

    // ============================================
    // Link Detection: Query both sources (UNION)
    // ============================================

    /**
     * Find links posted by a specific author from both sources.
     */
    findLinksByAuthor(params: { authorPublicKey: string; link: string; sinceTimestamp: number }): number {
        const engineCount = this.db.findLinksByAuthor(params);
        const indexerResult = this.indexerQueries.findLinksFromIndexer({
            link: params.link,
            sinceTimestamp: params.sinceTimestamp,
            authorPublicKey: params.authorPublicKey
        });

        return engineCount + indexerResult.count;
    }

    /**
     * Find links posted by other authors from both sources.
     * Returns total count and unique authors across both sources.
     */
    findLinksByOthers(params: { excludeAuthorPublicKey: string; link: string; sinceTimestamp: number }): {
        count: number;
        uniqueAuthors: number;
    } {
        const engineResult = this.db.findLinksByOthers({
            authorPublicKey: params.excludeAuthorPublicKey,
            link: params.link,
            sinceTimestamp: params.sinceTimestamp
        });
        const indexerResult = this.indexerQueries.findLinksFromIndexer({
            link: params.link,
            sinceTimestamp: params.sinceTimestamp,
            excludeAuthorPublicKey: params.excludeAuthorPublicKey
        });

        // Note: uniqueAuthors might be slightly inaccurate if the same author
        // appears in both sources. For a more accurate count, we'd need to
        // query and deduplicate, but this approximation is good enough for risk scoring.
        return {
            count: engineResult.count + indexerResult.count,
            uniqueAuthors: engineResult.uniqueAuthors + indexerResult.uniqueAuthors
        };
    }

    /**
     * Count links to a specific domain by an author from both sources.
     */
    countLinkDomainByAuthor(params: { authorPublicKey: string; domain: string; sinceTimestamp: number }): number {
        const engineCount = this.db.countLinkDomainByAuthor(params);
        const indexerCount = this.indexerQueries.countLinkDomainFromIndexer({
            domain: params.domain,
            sinceTimestamp: params.sinceTimestamp,
            authorPublicKey: params.authorPublicKey
        });

        return engineCount + indexerCount;
    }
}
