import type { RiskContext, RiskFactor } from "../types.js";
import { getAuthorPublicKeyFromChallengeRequest, getPublicationType } from "../utils.js";

/**
 * Content and title risk analysis for comments (posts and replies).
 *
 * This module analyzes comment.content and comment.title for spam indicators:
 * - Similar content from the same author (self-spamming)
 * - Similar content from different authors (coordinated spam)
 * - Similar titles (post spam)
 * - Excessive URLs in content
 * - Excessive capitalization (shouting)
 * - Repetitive patterns
 */

/**
 * Time window for similarity detection (24 hours in seconds).
 */
const SIMILARITY_WINDOW_SECONDS = 24 * 60 * 60; // TODO remove window

// TODO remove URLs handling from this file
/**
 * Minimum similarity ratio to consider content as similar.
 * 0.6 = 60% word overlap (Jaccard similarity)
 */
const SIMILARITY_THRESHOLD = 0.6;

/**
 * Threshold for considering content as near-exact match.
 * 0.95 = 95% word overlap
 */
const EXACT_MATCH_THRESHOLD = 0.95;

/**
 * Count URLs in text content.
 */
function countUrls(text: string): number {
    const urlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    const matches = text.match(urlPattern);
    return matches ? matches.length : 0;
}

/**
 * Check for excessive caps (shouting).
 */
function hasExcessiveCaps(text: string): boolean {
    if (text.length < 20) return false;
    const letters = text.replace(/[^a-zA-Z]/g, "");
    if (letters.length < 10) return false;
    const upperCount = (text.match(/[A-Z]/g) || []).length;
    return upperCount / letters.length > 0.5;
}

/**
 * Check for repetitive patterns (spam indicator).
 */
function hasRepetitivePatterns(text: string): boolean {
    // Check for repeated characters (e.g., "!!!!!!" or "aaaaa")
    if (/(.)\1{4,}/i.test(text)) return true;

    // Check for repeated words
    const words = text.toLowerCase().split(/\s+/);
    if (words.length >= 5) {
        const wordCounts = new Map<string, number>();
        for (const word of words) {
            if (word.length >= 3) {
                wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
            }
        }
        for (const count of wordCounts.values()) {
            if (count >= 5) return true;
        }
    }

    return false;
}

/**
 * Calculate risk score based on comment.content and comment.title analysis.
 *
 * Factors analyzed:
 * - Similar content from the same author (self-spamming)
 * - Similar content from different authors (coordinated spam campaigns)
 * - Similar titles from same/different authors
 * - Excessive URLs in content
 * - Excessive capitalization (shouting)
 * - Repetitive patterns
 *
 * Note: This factor only applies to comments (posts and replies).
 * For non-comment publications, returns a neutral score.
 */
export function calculateCommentContentTitleRisk(ctx: RiskContext, weight: number): RiskFactor {
    const { challengeRequest, combinedData, now } = ctx;

    // Check if this is a comment (post or reply)
    const publicationType = getPublicationType(challengeRequest);
    if (publicationType !== "post" && publicationType !== "reply") {
        // Content risk doesn't apply to non-comment publications - skip this factor
        return {
            name: "commentContentTitleRisk",
            score: 0,
            weight: 0, // Zero weight - this factor is skipped for non-comments
            explanation: "Content/title analysis: not applicable (non-comment publication)"
        };
    }

    const comment = challengeRequest.comment!;
    // Use the author's cryptographic public key for identity tracking
    // (author.address can be a domain and is not cryptographically tied to the author)
    const authorPublicKey = getAuthorPublicKeyFromChallengeRequest(challengeRequest);

    let score = 0.2; // Start at low risk for comments
    const issues: string[] = [];

    const content = comment.content;
    const title = comment.title;

    // Calculate time window for similarity detection
    const sinceTimestamp = now - SIMILARITY_WINDOW_SECONDS;

    // ============================================
    // Database queries for similarity detection
    // ============================================

    // Check for similar content from the same author (self-spamming)
    if (content && content.trim().length > 10) {
        // Query with lower threshold to get all candidates, then categorize by similarity level
        const similarFromAuthor = combinedData.findSimilarContentByAuthor({
            authorPublicKey,
            content,
            sinceTimestamp,
            similarityThreshold: SIMILARITY_THRESHOLD
        });

        // Count by similarity level using scores from database
        let exactMatchCount = 0;
        let highSimilarityCount = 0;

        for (const match of similarFromAuthor) {
            if (match.contentSimilarity >= EXACT_MATCH_THRESHOLD) {
                exactMatchCount++;
            } else if (match.contentSimilarity >= SIMILARITY_THRESHOLD) {
                highSimilarityCount++;
            }
        }

        // Score based on exact matches
        if (exactMatchCount >= 5) {
            score += 0.35;
            issues.push(`${exactMatchCount} duplicate comments from same author in 24h`);
        } else if (exactMatchCount >= 3) {
            score += 0.25;
            issues.push(`${exactMatchCount} duplicate comments from same author in 24h`);
        } else if (exactMatchCount >= 1) {
            score += 0.15;
            issues.push(`${exactMatchCount} duplicate comment(s) from same author in 24h`);
        }

        // Additional score for similar (but not exact) content
        if (highSimilarityCount >= 3) {
            score += 0.2;
            issues.push(`${highSimilarityCount} similar comments from same author in 24h`);
        } else if (highSimilarityCount >= 1) {
            score += 0.1;
            issues.push(`${highSimilarityCount} similar comment(s) from same author in 24h`);
        }

        // Check for similar content from different authors (coordinated spam)
        const similarFromOthers = combinedData.findSimilarContentByOthers({
            excludeAuthorPublicKey: authorPublicKey,
            content,
            sinceTimestamp,
            similarityThreshold: SIMILARITY_THRESHOLD
        });

        let othersExactMatchCount = 0;
        let othersHighSimilarityCount = 0;
        const uniqueOtherAuthors = new Set<string>();

        for (const match of similarFromOthers) {
            if (match.contentSimilarity >= EXACT_MATCH_THRESHOLD) {
                othersExactMatchCount++;
                uniqueOtherAuthors.add(match.authorPublicKey);
            } else if (match.contentSimilarity >= SIMILARITY_THRESHOLD) {
                othersHighSimilarityCount++;
                uniqueOtherAuthors.add(match.authorPublicKey);
            }
        }

        if (othersExactMatchCount >= 5) {
            score += 0.4;
            issues.push(
                `${othersExactMatchCount} identical comments from ${uniqueOtherAuthors.size} other author(s) (possible coordinated spam)`
            );
        } else if (othersExactMatchCount >= 2) {
            score += 0.25;
            issues.push(`${othersExactMatchCount} identical comments from other authors`);
        } else if (othersExactMatchCount >= 1) {
            score += 0.1;
            issues.push(`content seen from another author`);
        }

        if (othersHighSimilarityCount >= 3) {
            score += 0.2;
            issues.push(`${othersHighSimilarityCount} similar comments from other authors`);
        } else if (othersHighSimilarityCount >= 1) {
            score += 0.08;
            issues.push(`similar content seen from another author`);
        }
    }

    // Check for similar titles from the same author (post title spam)
    if (title && title.trim().length > 5) {
        const similarTitlesFromAuthor = combinedData.findSimilarContentByAuthor({
            authorPublicKey,
            title,
            sinceTimestamp,
            similarityThreshold: SIMILARITY_THRESHOLD
        });

        let titleMatchCount = 0;
        let titleSimilarCount = 0;

        for (const match of similarTitlesFromAuthor) {
            if (match.titleSimilarity >= EXACT_MATCH_THRESHOLD) {
                titleMatchCount++;
            } else if (match.titleSimilarity >= SIMILARITY_THRESHOLD) {
                titleSimilarCount++;
            }
        }

        if (titleMatchCount >= 3) {
            score += 0.3;
            issues.push(`${titleMatchCount} posts with same title from author in 24h`);
        } else if (titleMatchCount >= 1) {
            score += 0.15;
            issues.push(`${titleMatchCount} post(s) with same title from author in 24h`);
        }

        if (titleSimilarCount >= 2) {
            score += 0.15;
            issues.push(`${titleSimilarCount} posts with similar title from author in 24h`);
        }

        // Check for similar titles from different authors
        const similarTitlesFromOthers = combinedData.findSimilarContentByOthers({
            excludeAuthorPublicKey: authorPublicKey,
            title,
            sinceTimestamp,
            similarityThreshold: SIMILARITY_THRESHOLD
        });

        let othersTitleMatchCount = 0;
        let othersTitleSimilarCount = 0;

        for (const match of similarTitlesFromOthers) {
            if (match.titleSimilarity >= EXACT_MATCH_THRESHOLD) {
                othersTitleMatchCount++;
            } else if (match.titleSimilarity >= SIMILARITY_THRESHOLD) {
                othersTitleSimilarCount++;
            }
        }

        if (othersTitleMatchCount >= 3) {
            score += 0.25;
            issues.push(`${othersTitleMatchCount} posts with same title from other authors`);
        } else if (othersTitleMatchCount >= 1) {
            score += 0.1;
            issues.push(`title seen from another author`);
        }

        if (othersTitleSimilarCount >= 2) {
            score += 0.1;
            issues.push(`similar titles from other authors`);
        }
    }

    // ============================================
    // Static content analysis (no DB)
    // ============================================

    // Analyze content text
    if (content && content.length > 0) {
        const urlCount = countUrls(content);

        // Too many URLs is suspicious
        if (urlCount >= 5) {
            score += 0.15;
            issues.push(`contains ${urlCount} URLs`);
        } else if (urlCount >= 3) {
            score += 0.08;
            issues.push(`contains ${urlCount} URLs`);
        }

        // Check for excessive caps
        if (hasExcessiveCaps(content)) {
            score += 0.08;
            issues.push("excessive capitalization");
        }

        // Check for repetitive patterns
        if (hasRepetitivePatterns(content)) {
            score += 0.1;
            issues.push("repetitive patterns detected");
        }
    }

    // Clamp score to [0, 1]
    score = Math.max(0, Math.min(1, score));

    const explanation =
        issues.length > 0 ? `Content/title analysis: ${issues.join(", ")}` : "Content/title analysis: no suspicious patterns detected";

    return {
        name: "commentContentTitleRisk",
        score,
        weight,
        explanation
    };
}
