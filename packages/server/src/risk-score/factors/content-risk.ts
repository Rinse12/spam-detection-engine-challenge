import type { RiskContext, RiskFactor } from "../types.js";
import { getPublicationFromChallengeRequest } from "../utils.js";

/**
 * Common URL shortener domains.
 * These are often used to hide spam/phishing links.
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
    "cutt.ly",
    "shorturl.at",
    "tiny.cc",
    "s.id",
    "v.gd",
    "clck.ru"
]);

/**
 * Suspicious TLDs commonly associated with spam.
 */
const SUSPICIOUS_TLDS = new Set([".xyz", ".top", ".click", ".loan", ".work", ".gq", ".cf", ".tk", ".ml", ".ga"]);

/**
 * Extract hostname from a URL safely.
 */
function extractHostname(url: string): string | null {
    try {
        const parsed = new URL(url);
        return parsed.hostname.toLowerCase();
    } catch {
        return null;
    }
}

/**
 * Check if a URL uses a known shortener.
 */
function isUrlShortener(url: string): boolean {
    const hostname = extractHostname(url);
    if (!hostname) return false;
    return URL_SHORTENERS.has(hostname);
}

/**
 * Check if a URL uses a suspicious TLD.
 */
function hasSuspiciousTld(url: string): boolean {
    const hostname = extractHostname(url);
    if (!hostname) return false;
    return Array.from(SUSPICIOUS_TLDS).some((tld) => hostname.endsWith(tld));
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
 * Calculate risk score based on content analysis.
 *
 * Factors analyzed:
 * - URL shorteners (often used to hide malicious links)
 * - Suspicious TLDs
 * - Excessive URLs in content
 * - Excessive capitalization (shouting)
 * - Repetitive patterns
 */
export function calculateContentRisk(ctx: RiskContext, weight: number): RiskFactor {
    const publication = getPublicationFromChallengeRequest(ctx.challengeRequest);

    let score = 0.3; // Start at low-moderate risk
    const issues: string[] = [];

    // Get content text if available (for comments)
    const content = "content" in publication ? (publication as { content?: string }).content : undefined;

    // Get link if available
    const link = "link" in publication ? (publication as { link?: string }).link : undefined;

    // Check link for issues
    if (link) {
        if (isUrlShortener(link)) {
            score += 0.25;
            issues.push("uses URL shortener");
        }
        if (hasSuspiciousTld(link)) {
            score += 0.2;
            issues.push("suspicious TLD in link");
        }
    }

    // Analyze content text
    if (content && content.length > 0) {
        const urlCount = countUrls(content);

        // Too many URLs is suspicious
        if (urlCount >= 5) {
            score += 0.2;
            issues.push(`contains ${urlCount} URLs`);
        } else if (urlCount >= 3) {
            score += 0.1;
            issues.push(`contains ${urlCount} URLs`);
        }

        // Check for URL shorteners in content
        const urlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
        const urls = content.match(urlPattern) || [];
        const shortenerCount = urls.filter(isUrlShortener).length;
        if (shortenerCount > 0) {
            score += 0.15 * shortenerCount;
            issues.push(`${shortenerCount} URL shortener(s) in content`);
        }

        // Check for excessive caps
        if (hasExcessiveCaps(content)) {
            score += 0.1;
            issues.push("excessive capitalization");
        }

        // Check for repetitive patterns
        if (hasRepetitivePatterns(content)) {
            score += 0.15;
            issues.push("repetitive patterns detected");
        }
    }

    // Clamp score to [0, 1]
    score = Math.max(0, Math.min(1, score));

    const explanation =
        issues.length > 0
            ? `Content analysis: ${issues.join(", ")}`
            : "Content analysis: no suspicious patterns detected";

    return {
        name: "contentRisk",
        score,
        weight,
        explanation
    };
}
