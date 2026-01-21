/**
 * URL utilities for spam detection.
 *
 * Provides functions for extracting, normalizing, and analyzing URLs
 * for spam pattern detection.
 */

/**
 * Common tracking parameters to remove during URL normalization.
 */
const TRACKING_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "ref", "source"];

/**
 * Domains where similarity detection is skipped.
 * These are popular platforms where URL paths naturally vary (different tweets, videos, etc.)
 * We still do exact URL matching on these domains, just not prefix-based similarity.
 */
const SIMILARITY_ALLOWLISTED_DOMAINS = new Set([
    // Social media
    "x.com",
    "twitter.com",
    "youtube.com",
    "youtu.be",
    "reddit.com",
    "old.reddit.com",
    "facebook.com",
    "fb.com",
    "instagram.com",
    "tiktok.com",
    "linkedin.com",

    // Developer platforms
    "github.com",
    "gitlab.com",
    "stackoverflow.com",
    "stackexchange.com",

    // News/content platforms
    "medium.com",
    "substack.com",
    "mirror.xyz",

    // Crypto block explorers
    "etherscan.io",
    "arbiscan.io",
    "basescan.org",
    "polygonscan.com",
    "optimistic.etherscan.io",
    "bscscan.com",
    "snowtrace.io",
    "ftmscan.com",
    "solscan.io",
    "explorer.solana.com",

    // Other common platforms
    "docs.google.com",
    "drive.google.com",
    "notion.so",
    "discord.com",
    "discord.gg",
    "t.me",
    "telegram.me"
]);

/**
 * Extract domain from a URL string.
 * Returns lowercase domain without www. prefix.
 */
export function extractDomain(url: string): string | null {
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
export function normalizeUrl(url: string): string | null {
    try {
        const parsed = new URL(url);

        // Remove common tracking parameters
        for (const param of TRACKING_PARAMS) {
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
 * Extract URL prefix for similarity matching.
 * Returns "domain/path1/path2" (first 2 path segments) for grouping similar URLs.
 *
 * Examples:
 * - https://spam.com/promo/deal1?ref=abc → spam.com/promo/deal1
 * - https://spam.com/promo/deal2?ref=xyz → spam.com/promo/deal2 (same prefix)
 * - https://spam.com/page → spam.com/page
 * - https://spam.com/ → spam.com
 */
export function extractUrlPrefix(url: string): string | null {
    try {
        const parsed = new URL(url);

        // Normalize domain
        let host = parsed.hostname.toLowerCase();
        if (host.startsWith("www.")) {
            host = host.substring(4);
        }

        // Include port if non-standard
        if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
            host += `:${parsed.port}`;
        }

        // Get path segments (filter empty strings from leading/trailing slashes)
        const pathSegments = parsed.pathname.split("/").filter((s) => s.length > 0);

        // Take first 2 path segments for prefix
        const prefixSegments = pathSegments.slice(0, 2);

        if (prefixSegments.length === 0) {
            return host;
        }

        return `${host}/${prefixSegments.join("/")}`;
    } catch {
        return null;
    }
}

/**
 * Check if a URL uses an IP address instead of a domain name.
 * This is often a spam indicator.
 */
export function isIpAddressUrl(url: string): boolean {
    const domain = extractDomain(url);
    if (!domain) return false;
    return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain);
}

/**
 * Check if a domain is in the similarity allowlist.
 * Allowlisted domains skip prefix-based similarity detection but still
 * undergo exact URL matching.
 */
export function isSimilarityAllowlistedDomain(domain: string): boolean {
    if (!domain) return false;
    const normalized = domain.toLowerCase().replace(/^www\./, "");
    return SIMILARITY_ALLOWLISTED_DOMAINS.has(normalized);
}

/**
 * Check if a URL is on a similarity-allowlisted domain.
 */
export function isUrlSimilarityAllowlisted(url: string): boolean {
    const domain = extractDomain(url);
    return domain !== null && isSimilarityAllowlistedDomain(domain);
}

/**
 * Extract all URLs from text content.
 * Returns an array of URL strings found in the text.
 */
export function extractUrlsFromText(text: string | null | undefined): string[] {
    if (!text || typeof text !== "string") {
        return [];
    }

    // URL regex pattern - matches http:// and https:// URLs
    // Stops at whitespace, quotes, or common punctuation that ends URLs
    const urlPattern = /https?:\/\/[^\s<>"'`\[\]{}|\\^]+/gi;
    const matches = text.match(urlPattern);

    if (!matches) {
        return [];
    }

    // Clean up URLs - remove trailing punctuation that might have been captured
    return matches.map((url) => {
        // Remove trailing punctuation like ), ., ,, etc. that are often not part of the URL
        // But be careful with parentheses - only remove if unbalanced
        let cleaned = url;

        // Remove trailing punctuation (but not if it's part of query string)
        const trailingPunctuation = /[.,;:!?)]+$/;
        const match = cleaned.match(trailingPunctuation);
        if (match) {
            // Check if this is actually part of the URL or just trailing punctuation
            // If there's no query string or fragment, remove trailing punctuation
            const hasQueryOrFragment = cleaned.includes("?") || cleaned.includes("#");
            if (!hasQueryOrFragment) {
                cleaned = cleaned.replace(trailingPunctuation, "");
            } else {
                // For URLs with query/fragment, only remove obvious trailing punctuation
                cleaned = cleaned.replace(/[.,;:!]+$/, "");
                // Handle trailing ) only if unbalanced
                const openParens = (cleaned.match(/\(/g) || []).length;
                const closeParens = (cleaned.match(/\)/g) || []).length;
                while (cleaned.endsWith(")") && closeParens > openParens) {
                    cleaned = cleaned.slice(0, -1);
                }
            }
        }

        return cleaned;
    });
}

/**
 * Collect all URLs from a comment (link field, content, and title).
 * Returns normalized, deduplicated URLs.
 */
export function collectAllUrls(params: { link?: string | null; content?: string | null; title?: string | null }): string[] {
    const { link, content, title } = params;
    const urls = new Set<string>();

    // Add link field if present
    if (link) {
        const normalized = normalizeUrl(link);
        if (normalized) {
            urls.add(normalized);
        }
    }

    // Extract URLs from content
    for (const url of extractUrlsFromText(content)) {
        const normalized = normalizeUrl(url);
        if (normalized) {
            urls.add(normalized);
        }
    }

    // Extract URLs from title
    for (const url of extractUrlsFromText(title)) {
        const normalized = normalizeUrl(url);
        if (normalized) {
            urls.add(normalized);
        }
    }

    return Array.from(urls);
}

/**
 * Collect all URL prefixes from a comment for similarity matching.
 * Returns deduplicated prefixes, excluding allowlisted domains.
 */
export function collectUrlPrefixesForSimilarity(params: {
    link?: string | null;
    content?: string | null;
    title?: string | null;
}): string[] {
    const urls = collectAllUrls(params);
    const prefixes = new Set<string>();

    for (const url of urls) {
        // Skip allowlisted domains for similarity matching
        if (isUrlSimilarityAllowlisted(url)) {
            continue;
        }

        const prefix = extractUrlPrefix(url);
        if (prefix) {
            prefixes.add(prefix);
        }
    }

    return Array.from(prefixes);
}

// ============================================
// Time Clustering Analysis
// ============================================

/**
 * Calculate the standard deviation of timestamps (in seconds).
 * Lower stddev means more clustered (suspicious), higher means spread out (organic).
 *
 * @param timestamps - Array of timestamps in seconds
 * @returns Standard deviation in seconds, or null if less than 2 timestamps
 */
export function calculateTimestampStdDev(timestamps: number[]): number | null {
    if (timestamps.length < 2) return null;

    const mean = timestamps.reduce((a, b) => a + b, 0) / timestamps.length;
    const squaredDiffs = timestamps.map((t) => Math.pow(t - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / timestamps.length;

    return Math.sqrt(variance);
}

/**
 * Determine clustering risk based on timestamp standard deviation.
 * Used to distinguish coordinated spam bursts from organic sharing spread over time.
 *
 * @param stddev - Standard deviation in seconds
 * @param count - Number of posts (minimum 3 required for meaningful clustering)
 * @returns Risk score adjustment (0-0.3)
 */
export function getTimeClusteringRisk(stddev: number | null, count: number): number {
    if (stddev === null || count < 3) return 0;

    // Convert stddev to hours for easier reasoning
    const stddevHours = stddev / 3600;

    if (stddevHours < 1) {
        // Very tight clustering (< 1 hour stddev) - likely bot/coordinated
        return 0.3;
    } else if (stddevHours < 3) {
        // Moderate clustering (1-3 hours stddev) - suspicious
        return 0.2;
    } else if (stddevHours < 6) {
        // Some clustering (3-6 hours stddev)
        return 0.1;
    }

    // Well spread out (> 6 hours stddev) - likely organic sharing
    return 0;
}
