import type { RiskContext, RiskFactor } from "../types.js";
import { getAuthorFromChallengeRequest, getPublicationType } from "../utils.js";

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
const SIMILARITY_WINDOW_SECONDS = 24 * 60 * 60;

/**
 * Minimum similarity ratio to consider content as similar.
 * 0.6 = 60% word overlap (Jaccard similarity)
 */
const SIMILARITY_THRESHOLD = 0.6;

/**
 * Calculate text similarity using Jaccard similarity on word sets.
 * Returns a value between 0 (no similarity) and 1 (identical).
 *
 * Note: This runs in JavaScript after SQL returns candidate matches.
 * The SQL uses substring LIKE matching to find potential matches,
 * then this function calculates actual similarity.
 */
function calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;

    // Normalize and tokenize
    const normalize = (s: string) =>
        s
            .toLowerCase()
            .replace(/[^\w\s]/g, " ")
            .split(/\s+/)
            .filter((w) => w.length > 2);

    const words1 = new Set(normalize(text1));
    const words2 = new Set(normalize(text2));

    if (words1.size === 0 || words2.size === 0) return 0;

    // Calculate Jaccard similarity
    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
}

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
    const { challengeRequest, db, now } = ctx;

    // Check if this is a comment (post or reply)
    const publicationType = getPublicationType(challengeRequest);
    if (publicationType !== "post" && publicationType !== "reply") {
        // Content risk doesn't apply to non-comment publications
        return {
            name: "commentContentTitleRisk",
            score: 0.5, // Neutral score
            weight,
            explanation: "Content/title analysis: not applicable (non-comment publication)"
        };
    }

    const comment = challengeRequest.comment!;
    const author = getAuthorFromChallengeRequest(challengeRequest);
    const authorAddress = author.address;

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
        const similarFromAuthor = db.findSimilarContentByAuthor({
            authorAddress,
            content,
            sinceTimestamp
        });

        // Calculate similarity scores and count truly similar content
        let highSimilarityCount = 0;
        let exactMatchCount = 0;

        for (const match of similarFromAuthor) {
            if (match.content) {
                const similarity = calculateTextSimilarity(content, match.content);
                if (similarity >= 0.95) {
                    exactMatchCount++;
                } else if (similarity >= SIMILARITY_THRESHOLD) {
                    highSimilarityCount++;
                }
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
        const similarFromOthers = db.findSimilarContentByOthers({
            authorAddress,
            content,
            sinceTimestamp
        });

        let othersHighSimilarityCount = 0;
        let othersExactMatchCount = 0;
        const uniqueOtherAuthors = new Set<string>();

        for (const match of similarFromOthers) {
            if (match.content) {
                const similarity = calculateTextSimilarity(content, match.content);
                if (similarity >= 0.95) {
                    othersExactMatchCount++;
                    uniqueOtherAuthors.add(match.authorAddress);
                } else if (similarity >= SIMILARITY_THRESHOLD) {
                    othersHighSimilarityCount++;
                    uniqueOtherAuthors.add(match.authorAddress);
                }
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
        const similarTitlesFromAuthor = db.findSimilarContentByAuthor({
            authorAddress,
            title,
            sinceTimestamp
        });

        let titleMatchCount = 0;
        let titleSimilarCount = 0;

        for (const match of similarTitlesFromAuthor) {
            if (match.title) {
                const similarity = calculateTextSimilarity(title, match.title);
                if (similarity >= 0.95) {
                    titleMatchCount++;
                } else if (similarity >= SIMILARITY_THRESHOLD) {
                    titleSimilarCount++;
                }
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
        const similarTitlesFromOthers = db.findSimilarContentByOthers({
            authorAddress,
            title,
            sinceTimestamp
        });

        let othersTitleMatchCount = 0;
        let othersTitleSimilarCount = 0;

        for (const match of similarTitlesFromOthers) {
            if (match.title) {
                const similarity = calculateTextSimilarity(title, match.title);
                if (similarity >= 0.95) {
                    othersTitleMatchCount++;
                } else if (similarity >= SIMILARITY_THRESHOLD) {
                    othersTitleSimilarCount++;
                }
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
