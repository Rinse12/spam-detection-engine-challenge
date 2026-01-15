import type { RiskContext, RiskFactor } from "../types.js";
import { getAuthorFromChallengeRequest, getPublicationType } from "../utils.js";

/**
 * URL/link risk analysis for comments (posts and replies).
 *
 * This module analyzes comment.link for spam indicators:
 * - Same link posted multiple times by the same author
 * - Same link posted by multiple different authors (coordinated spam)
 * - Suspicious URL patterns (link shorteners, excessive query params, etc.)
 *
 * Note: comment.link is different from URLs in comment.content.
 * comment.link is the dedicated link field for link posts.
 */

/**
 * Time window for link spam detection (24 hours in seconds).
 */
const LINK_SPAM_WINDOW_SECONDS = 24 * 60 * 60;

/**
 * Common URL shortener domains that are often used to mask spam links.
 */
const URL_SHORTENERS = new Set([
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "ow.ly",
    "is.gd",
    "buff.ly",
    "adf.ly",
    "j.mp",
    "rb.gy",
    "shorturl.at",
    "cutt.ly",
    "t.ly",
    "tiny.cc",
    "v.gd",
    "x.co",
    "soo.gd",
    "s.id",
    "clck.ru",
    "rebrand.ly"
]);

/**
 * Extract domain from a URL string.
 * Returns lowercase domain without www. prefix.
 */
function extractDomain(url: string): string | null {
    try {
        const parsed = new URL(url);
        return parsed.hostname.toLowerCase().replace(/^www\./, "");
    } catch {
        return null;
    }
}

/**
 * Normalize a URL for comparison purposes.
 * - Lowercase the whole URL
 * - Remove tracking parameters (utm_*, fbclid, etc.)
 * - Remove trailing slashes
 * - Remove www. prefix from domain
 */
function normalizeUrl(url: string): string | null {
    try {
        const parsed = new URL(url);

        // Remove common tracking parameters
        const trackingParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "ref", "source"];
        for (const param of trackingParams) {
            parsed.searchParams.delete(param);
        }

        // Normalize domain (lowercase, remove www.)
        let host = parsed.hostname.toLowerCase();
        if (host.startsWith("www.")) {
            host = host.substring(4);
        }

        // Rebuild URL with normalized components
        let normalized = `${parsed.protocol}//${host}`;
        if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
            normalized += `:${parsed.port}`;
        }
        normalized += parsed.pathname.replace(/\/+$/, "") || "/"; // Remove trailing slashes

        // Add remaining query params (sorted for consistency)
        const sortedParams = new URLSearchParams([...parsed.searchParams.entries()].sort());
        const queryString = sortedParams.toString();
        if (queryString) {
            normalized += `?${queryString}`;
        }

        // Add hash if present
        if (parsed.hash) {
            normalized += parsed.hash;
        }

        return normalized.toLowerCase();
    } catch {
        return null;
    }
}

/**
 * Check if a URL uses a known URL shortener service.
 */
function isUrlShortener(url: string): boolean {
    const domain = extractDomain(url);
    return domain !== null && URL_SHORTENERS.has(domain);
}

/**
 * Count query parameters in a URL.
 * Many query params can indicate tracking/affiliate links.
 */
function countQueryParams(url: string): number {
    try {
        const parsed = new URL(url);
        return parsed.searchParams.size;
    } catch {
        return 0;
    }
}

/**
 * Check if URL has suspicious patterns.
 * Returns an array of detected issues.
 */
function detectSuspiciousUrlPatterns(url: string): string[] {
    const issues: string[] = [];

    // Check for URL shortener
    if (isUrlShortener(url)) {
        issues.push("uses URL shortener");
    }

    // Check for excessive query parameters (common in affiliate/tracking links)
    const paramCount = countQueryParams(url);
    if (paramCount > 5) {
        issues.push(`${paramCount} query parameters`);
    }

    // Check for IP address instead of domain
    const domain = extractDomain(url);
    if (domain && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
        issues.push("uses IP address instead of domain");
    }

    // Check for very long URLs (often obfuscated spam)
    if (url.length > 500) {
        issues.push("unusually long URL");
    }

    return issues;
}

/**
 * Calculate risk score based on comment.link analysis.
 *
 * Factors analyzed:
 * - Same link posted multiple times by the same author (link spam)
 * - Same link posted by different authors (coordinated link spam)
 * - Suspicious URL patterns (shorteners, IP addresses, etc.)
 *
 * Note: This factor only applies to comments (posts and replies) that have a link.
 * For non-comment publications or comments without links, returns a neutral score.
 */
export function calculateCommentUrlRisk(ctx: RiskContext, weight: number): RiskFactor {
    const { challengeRequest, db, now } = ctx;

    // Check if this is a comment (post or reply)
    const publicationType = getPublicationType(challengeRequest);
    if (publicationType !== "post" && publicationType !== "reply") {
        // URL risk doesn't apply to non-comment publications
        return {
            name: "commentUrlRisk",
            score: 0.5, // Neutral score
            weight,
            explanation: "Link analysis: not applicable (non-comment publication)"
        };
    }

    const comment = challengeRequest.comment!;
    const link = comment.link;

    // No link provided - neutral score
    if (!link || link.trim().length === 0) {
        return {
            name: "commentUrlRisk",
            score: 0.5, // Neutral score
            weight,
            explanation: "Link analysis: no link provided"
        };
    }

    const author = getAuthorFromChallengeRequest(challengeRequest);
    const authorAddress = author.address;

    let score = 0.2; // Start at low risk for comments with links
    const issues: string[] = [];

    // Normalize the link for comparison
    const normalizedLink = normalizeUrl(link);

    if (!normalizedLink) {
        // Invalid URL format
        score += 0.1;
        issues.push("invalid URL format");
    } else {
        // Calculate time window for spam detection
        const sinceTimestamp = now - LINK_SPAM_WINDOW_SECONDS;

        // ============================================
        // Database queries for duplicate link detection
        // ============================================

        // Check for same link from the same author
        const sameAuthorLinks = db.findLinksByAuthor({
            authorAddress,
            link: normalizedLink,
            sinceTimestamp
        });

        if (sameAuthorLinks >= 5) {
            score += 0.4;
            issues.push(`${sameAuthorLinks} posts with same link from author in 24h`);
        } else if (sameAuthorLinks >= 3) {
            score += 0.25;
            issues.push(`${sameAuthorLinks} posts with same link from author in 24h`);
        } else if (sameAuthorLinks >= 1) {
            score += 0.15;
            issues.push(`${sameAuthorLinks} post(s) with same link from author in 24h`);
        }

        // Check for same link from different authors (coordinated spam)
        const otherAuthorsResult = db.findLinksByOthers({
            authorAddress,
            link: normalizedLink,
            sinceTimestamp
        });

        if (otherAuthorsResult.count >= 10) {
            score += 0.5;
            issues.push(`${otherAuthorsResult.count} posts with same link from ${otherAuthorsResult.uniqueAuthors} other authors (likely coordinated spam)`);
        } else if (otherAuthorsResult.count >= 5) {
            score += 0.35;
            issues.push(`${otherAuthorsResult.count} posts with same link from ${otherAuthorsResult.uniqueAuthors} other authors (possible coordinated spam)`);
        } else if (otherAuthorsResult.count >= 2) {
            score += 0.2;
            issues.push(`${otherAuthorsResult.count} posts with same link from other authors`);
        } else if (otherAuthorsResult.count >= 1) {
            score += 0.1;
            issues.push("link seen from another author");
        }

        // ============================================
        // Static URL analysis
        // ============================================

        const urlIssues = detectSuspiciousUrlPatterns(link);
        for (const issue of urlIssues) {
            if (issue === "uses URL shortener") {
                score += 0.15;
            } else if (issue === "uses IP address instead of domain") {
                score += 0.2;
            } else if (issue === "unusually long URL") {
                score += 0.1;
            } else if (issue.includes("query parameters")) {
                score += 0.05;
            }
            issues.push(issue);
        }

        // Check domain diversity - same domain posted repeatedly is suspicious
        const domainCount = db.countLinkDomainByAuthor({
            authorAddress,
            domain: extractDomain(link)!,
            sinceTimestamp
        });

        if (domainCount >= 10) {
            score += 0.25;
            issues.push(`${domainCount} links to same domain from author in 24h`);
        } else if (domainCount >= 5) {
            score += 0.15;
            issues.push(`${domainCount} links to same domain from author in 24h`);
        }
    }

    // Clamp score to [0, 1]
    score = Math.max(0, Math.min(1, score));

    const explanation = issues.length > 0 ? `Link analysis: ${issues.join(", ")}` : "Link analysis: no suspicious patterns detected";

    return {
        name: "commentUrlRisk",
        score,
        weight,
        explanation
    };
}
