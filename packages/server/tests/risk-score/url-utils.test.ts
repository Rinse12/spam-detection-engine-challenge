import { describe, it, expect } from "vitest";
import {
    calculateTimestampStdDev,
    extractDomain,
    normalizeUrl,
    extractUrlPrefix,
    getTimeClusteringRisk,
    isIpAddressUrl,
    isSimilarityAllowlistedDomain,
    isUrlSimilarityAllowlisted,
    extractUrlsFromText,
    collectAllUrls,
    collectUrlPrefixesForSimilarity
} from "../../src/risk-score/url-utils.js";

describe("extractDomain", () => {
    it("should extract domain from simple URL", () => {
        expect(extractDomain("https://example.com/path")).toBe("example.com");
    });

    it("should remove www prefix", () => {
        expect(extractDomain("https://www.example.com/path")).toBe("example.com");
    });

    it("should lowercase domain", () => {
        expect(extractDomain("https://EXAMPLE.COM/path")).toBe("example.com");
    });

    it("should handle subdomains", () => {
        expect(extractDomain("https://sub.example.com/path")).toBe("sub.example.com");
    });

    it("should return null for invalid URL", () => {
        expect(extractDomain("not a url")).toBeNull();
    });
});

describe("normalizeUrl", () => {
    it("should lowercase URL", () => {
        expect(normalizeUrl("https://EXAMPLE.COM/Path")).toBe("https://example.com/path");
    });

    it("should remove www prefix", () => {
        expect(normalizeUrl("https://www.example.com/path")).toBe("https://example.com/path");
    });

    it("should remove trailing slashes", () => {
        expect(normalizeUrl("https://example.com/path/")).toBe("https://example.com/path");
    });

    it("should remove tracking parameters", () => {
        expect(normalizeUrl("https://example.com/path?utm_source=test&id=123")).toBe("https://example.com/path?id=123");
    });

    it("should remove fbclid parameter", () => {
        expect(normalizeUrl("https://example.com/path?fbclid=abc123")).toBe("https://example.com/path");
    });

    it("should sort remaining query params", () => {
        expect(normalizeUrl("https://example.com/path?z=1&a=2")).toBe("https://example.com/path?a=2&z=1");
    });

    it("should preserve hash", () => {
        expect(normalizeUrl("https://example.com/path#section")).toBe("https://example.com/path#section");
    });

    it("should handle root path", () => {
        expect(normalizeUrl("https://example.com")).toBe("https://example.com/");
    });

    it("should return null for invalid URL", () => {
        expect(normalizeUrl("not a url")).toBeNull();
    });
});

describe("extractUrlPrefix", () => {
    it("should extract domain and first 2 path segments", () => {
        expect(extractUrlPrefix("https://spam.com/promo/deal1?ref=abc")).toBe("spam.com/promo/deal1");
    });

    it("should match similar URLs with different query params", () => {
        const prefix1 = extractUrlPrefix("https://spam.com/promo/deal1?ref=abc");
        const prefix2 = extractUrlPrefix("https://spam.com/promo/deal1?ref=xyz");
        expect(prefix1).toBe(prefix2);
    });

    it("should differentiate different paths", () => {
        const prefix1 = extractUrlPrefix("https://spam.com/promo/deal1");
        const prefix2 = extractUrlPrefix("https://spam.com/other/page");
        expect(prefix1).not.toBe(prefix2);
    });

    it("should handle short paths (single segment)", () => {
        expect(extractUrlPrefix("https://spam.com/page")).toBe("spam.com/page");
    });

    it("should handle root path", () => {
        expect(extractUrlPrefix("https://spam.com/")).toBe("spam.com");
        expect(extractUrlPrefix("https://spam.com")).toBe("spam.com");
    });

    it("should include port if non-standard", () => {
        expect(extractUrlPrefix("https://spam.com:8080/path")).toBe("spam.com:8080/path");
    });

    it("should remove www prefix", () => {
        expect(extractUrlPrefix("https://www.spam.com/path")).toBe("spam.com/path");
    });

    it("should only take first 2 path segments", () => {
        expect(extractUrlPrefix("https://spam.com/a/b/c/d/e")).toBe("spam.com/a/b");
    });

    it("should return null for invalid URL", () => {
        expect(extractUrlPrefix("not a url")).toBeNull();
    });
});

describe("isIpAddressUrl", () => {
    it("should detect IPv4 address URL", () => {
        expect(isIpAddressUrl("http://192.168.1.1/malware")).toBe(true);
    });

    it("should not flag domain URLs", () => {
        expect(isIpAddressUrl("https://example.com/path")).toBe(false);
    });

    it("should not flag URLs with IP-like substrings", () => {
        expect(isIpAddressUrl("https://example192.168.1.1.com/path")).toBe(false);
    });

    it("should return false for invalid URL", () => {
        expect(isIpAddressUrl("not a url")).toBe(false);
    });
});

describe("isSimilarityAllowlistedDomain", () => {
    it("should allowlist twitter.com", () => {
        expect(isSimilarityAllowlistedDomain("twitter.com")).toBe(true);
    });

    it("should allowlist x.com", () => {
        expect(isSimilarityAllowlistedDomain("x.com")).toBe(true);
    });

    it("should allowlist youtube.com", () => {
        expect(isSimilarityAllowlistedDomain("youtube.com")).toBe(true);
    });

    it("should allowlist reddit.com", () => {
        expect(isSimilarityAllowlistedDomain("reddit.com")).toBe(true);
    });

    it("should allowlist github.com", () => {
        expect(isSimilarityAllowlistedDomain("github.com")).toBe(true);
    });

    it("should allowlist etherscan.io", () => {
        expect(isSimilarityAllowlistedDomain("etherscan.io")).toBe(true);
    });

    it("should not allowlist random domains", () => {
        expect(isSimilarityAllowlistedDomain("spam-site.com")).toBe(false);
    });

    it("should handle www prefix", () => {
        expect(isSimilarityAllowlistedDomain("www.twitter.com")).toBe(true);
    });

    it("should be case insensitive", () => {
        expect(isSimilarityAllowlistedDomain("TWITTER.COM")).toBe(true);
    });

    it("should return false for empty/null", () => {
        expect(isSimilarityAllowlistedDomain("")).toBe(false);
    });
});

describe("isUrlSimilarityAllowlisted", () => {
    it("should allowlist Twitter URLs", () => {
        expect(isUrlSimilarityAllowlisted("https://x.com/user/status/123")).toBe(true);
        expect(isUrlSimilarityAllowlisted("https://twitter.com/user/status/456")).toBe(true);
    });

    it("should allowlist YouTube URLs", () => {
        expect(isUrlSimilarityAllowlisted("https://youtube.com/watch?v=abc123")).toBe(true);
        expect(isUrlSimilarityAllowlisted("https://youtu.be/abc123")).toBe(true);
    });

    it("should allowlist Reddit URLs", () => {
        expect(isUrlSimilarityAllowlisted("https://reddit.com/r/ethereum/comments/abc")).toBe(true);
    });

    it("should allowlist GitHub URLs", () => {
        expect(isUrlSimilarityAllowlisted("https://github.com/user/repo/issues/1")).toBe(true);
    });

    it("should not allowlist random URLs", () => {
        expect(isUrlSimilarityAllowlisted("https://spam-site.com/promo")).toBe(false);
    });

    it("should return false for invalid URL", () => {
        expect(isUrlSimilarityAllowlisted("not a url")).toBe(false);
    });
});

describe("extractUrlsFromText", () => {
    it("should extract single URL", () => {
        expect(extractUrlsFromText("Check out https://example.com/page")).toEqual(["https://example.com/page"]);
    });

    it("should extract multiple URLs", () => {
        const text = "Visit https://example.com and also https://other.com/path";
        expect(extractUrlsFromText(text)).toEqual(["https://example.com", "https://other.com/path"]);
    });

    it("should extract URL from title", () => {
        expect(extractUrlsFromText("My post about https://crypto.com")).toEqual(["https://crypto.com"]);
    });

    it("should handle http URLs", () => {
        expect(extractUrlsFromText("Visit http://example.com")).toEqual(["http://example.com"]);
    });

    it("should return empty array for no URLs", () => {
        expect(extractUrlsFromText("Just some text without URLs")).toEqual([]);
    });

    it("should return empty array for null/undefined", () => {
        expect(extractUrlsFromText(null)).toEqual([]);
        expect(extractUrlsFromText(undefined)).toEqual([]);
    });

    it("should handle URLs with query params", () => {
        expect(extractUrlsFromText("Link: https://example.com/path?a=1&b=2")).toEqual(["https://example.com/path?a=1&b=2"]);
    });

    it("should handle URLs with hash", () => {
        expect(extractUrlsFromText("See https://example.com/path#section")).toEqual(["https://example.com/path#section"]);
    });

    it("should strip trailing punctuation", () => {
        expect(extractUrlsFromText("Check https://example.com.")).toEqual(["https://example.com"]);
        expect(extractUrlsFromText("Visit https://example.com, then")).toEqual(["https://example.com"]);
    });

    it("should handle URLs in parentheses", () => {
        expect(extractUrlsFromText("(see https://example.com)")).toEqual(["https://example.com"]);
    });
});

describe("collectAllUrls", () => {
    it("should collect URL from link field", () => {
        const urls = collectAllUrls({ link: "https://example.com/page" });
        expect(urls).toContain("https://example.com/page");
    });

    it("should collect URLs from content", () => {
        const urls = collectAllUrls({ content: "Check out https://example.com" });
        expect(urls.length).toBe(1);
    });

    it("should collect URLs from title", () => {
        const urls = collectAllUrls({ title: "My post about https://crypto.com" });
        expect(urls.length).toBe(1);
    });

    it("should deduplicate URLs", () => {
        const urls = collectAllUrls({
            link: "https://example.com/page",
            content: "Check https://example.com/page again"
        });
        expect(urls.length).toBe(1);
    });

    it("should normalize URLs before deduplication", () => {
        const urls = collectAllUrls({
            link: "https://example.com/page",
            content: "Also https://EXAMPLE.COM/page"
        });
        expect(urls.length).toBe(1);
    });

    it("should return empty array for no URLs", () => {
        const urls = collectAllUrls({ content: "Just text" });
        expect(urls).toEqual([]);
    });

    it("should handle all null/undefined fields", () => {
        const urls = collectAllUrls({});
        expect(urls).toEqual([]);
    });
});

describe("collectUrlPrefixesForSimilarity", () => {
    it("should collect prefix from link field", () => {
        const prefixes = collectUrlPrefixesForSimilarity({ link: "https://spam.com/promo/deal1" });
        expect(prefixes).toContain("spam.com/promo/deal1");
    });

    it("should skip allowlisted domains", () => {
        const prefixes = collectUrlPrefixesForSimilarity({ link: "https://twitter.com/user/status/123" });
        expect(prefixes).toEqual([]);
    });

    it("should skip YouTube URLs", () => {
        const prefixes = collectUrlPrefixesForSimilarity({ link: "https://youtube.com/watch?v=abc" });
        expect(prefixes).toEqual([]);
    });

    it("should skip Reddit URLs", () => {
        const prefixes = collectUrlPrefixesForSimilarity({ link: "https://reddit.com/r/sub/comments/abc" });
        expect(prefixes).toEqual([]);
    });

    it("should skip GitHub URLs", () => {
        const prefixes = collectUrlPrefixesForSimilarity({ link: "https://github.com/user/repo/issues/1" });
        expect(prefixes).toEqual([]);
    });

    it("should include non-allowlisted URLs", () => {
        const prefixes = collectUrlPrefixesForSimilarity({ link: "https://spam-site.com/promo/offer" });
        expect(prefixes).toContain("spam-site.com/promo/offer");
    });

    it("should deduplicate prefixes", () => {
        const prefixes = collectUrlPrefixesForSimilarity({
            link: "https://spam.com/promo/deal1",
            content: "Also https://spam.com/promo/deal2"
        });
        // Both have same prefix: spam.com/promo
        expect(prefixes.filter((p) => p === "spam.com/promo/deal1" || p === "spam.com/promo/deal2").length).toBeLessThanOrEqual(2);
    });

    it("should return empty array for null/undefined fields", () => {
        const prefixes = collectUrlPrefixesForSimilarity({});
        expect(prefixes).toEqual([]);
    });
});

describe("URL similarity edge cases", () => {
    describe("Twitter URL variations should NOT trigger similarity", () => {
        it("different tweets from same user", () => {
            const prefix1 = isUrlSimilarityAllowlisted("https://x.com/VitalikButerin/status/111");
            const prefix2 = isUrlSimilarityAllowlisted("https://x.com/VitalikButerin/status/222");
            expect(prefix1).toBe(true);
            expect(prefix2).toBe(true);
        });
    });

    describe("YouTube URL variations should NOT trigger similarity", () => {
        it("different videos", () => {
            expect(isUrlSimilarityAllowlisted("https://youtube.com/watch?v=abc123")).toBe(true);
            expect(isUrlSimilarityAllowlisted("https://youtube.com/watch?v=xyz789")).toBe(true);
        });
    });

    describe("Spam site URL variations SHOULD trigger similarity", () => {
        it("same domain different query params should have same prefix", () => {
            const prefix1 = extractUrlPrefix("https://spam-site.com/promo/deal?ref=1");
            const prefix2 = extractUrlPrefix("https://spam-site.com/promo/deal?ref=2");
            expect(prefix1).toBe(prefix2);
            expect(prefix1).toBe("spam-site.com/promo/deal");
        });
    });

    describe("internationalized domain names", () => {
        it("should handle IDN domains", () => {
            // Punycode encoded IDN
            expect(extractDomain("https://xn--n3h.com/path")).toBe("xn--n3h.com");
        });
    });

    describe("special characters in URLs", () => {
        it("should handle encoded characters", () => {
            expect(extractUrlsFromText("Visit https://example.com/path%20with%20spaces")).toEqual([
                "https://example.com/path%20with%20spaces"
            ]);
        });
    });
});

describe("calculateTimestampStdDev", () => {
    it("should return null for empty array", () => {
        expect(calculateTimestampStdDev([])).toBeNull();
    });

    it("should return null for single timestamp", () => {
        expect(calculateTimestampStdDev([1000])).toBeNull();
    });

    it("should return 0 for identical timestamps", () => {
        expect(calculateTimestampStdDev([1000, 1000, 1000])).toBe(0);
    });

    it("should calculate correct stddev for two timestamps", () => {
        // Timestamps: 100, 200 → mean=150, variance=2500, stddev=50
        expect(calculateTimestampStdDev([100, 200])).toBe(50);
    });

    it("should calculate correct stddev for known values", () => {
        // Timestamps: 100, 200, 300 → mean=200, variance=6666.67, stddev≈81.65
        const stddev = calculateTimestampStdDev([100, 200, 300]);
        expect(stddev).toBeCloseTo(81.65, 1);
    });

    it("should handle large timestamps (realistic Unix timestamps)", () => {
        // 5 posts within 5 minutes (300 seconds apart)
        const base = 1700000000;
        const timestamps = [base, base + 60, base + 120, base + 180, base + 240];
        const stddev = calculateTimestampStdDev(timestamps);
        // stddev for evenly spaced 0,60,120,180,240 ≈ 84.85 seconds
        expect(stddev).toBeCloseTo(84.85, 1);
    });

    it("should handle posts spread over 24 hours", () => {
        // 5 posts evenly spread over 24 hours
        const base = 1700000000;
        const hour = 3600;
        const timestamps = [base, base + 6 * hour, base + 12 * hour, base + 18 * hour, base + 24 * hour];
        const stddev = calculateTimestampStdDev(timestamps);
        // stddev ≈ 30558 seconds (~8.5 hours)
        expect(stddev).toBeGreaterThan(8 * hour);
    });
});

describe("getTimeClusteringRisk", () => {
    it("should return 0 for null stddev", () => {
        expect(getTimeClusteringRisk(null, 5)).toBe(0);
    });

    it("should return 0 for count less than 3", () => {
        expect(getTimeClusteringRisk(100, 2)).toBe(0);
        expect(getTimeClusteringRisk(100, 1)).toBe(0);
    });

    it("should return 0.3 for very tight clustering (< 1 hour stddev)", () => {
        expect(getTimeClusteringRisk(1800, 5)).toBe(0.3); // 30 min stddev
        expect(getTimeClusteringRisk(60, 5)).toBe(0.3); // 1 min stddev
        expect(getTimeClusteringRisk(3599, 5)).toBe(0.3); // just under 1 hour
    });

    it("should return 0.2 for moderate clustering (1-3 hours stddev)", () => {
        expect(getTimeClusteringRisk(3600, 5)).toBe(0.2); // exactly 1 hour
        expect(getTimeClusteringRisk(7200, 5)).toBe(0.2); // 2 hours
        expect(getTimeClusteringRisk(10799, 5)).toBe(0.2); // just under 3 hours
    });

    it("should return 0.1 for some clustering (3-6 hours stddev)", () => {
        expect(getTimeClusteringRisk(10800, 5)).toBe(0.1); // exactly 3 hours
        expect(getTimeClusteringRisk(18000, 5)).toBe(0.1); // 5 hours
        expect(getTimeClusteringRisk(21599, 5)).toBe(0.1); // just under 6 hours
    });

    it("should return 0 for spread out posts (>= 6 hours stddev)", () => {
        expect(getTimeClusteringRisk(21600, 5)).toBe(0); // exactly 6 hours
        expect(getTimeClusteringRisk(28800, 5)).toBe(0); // 8 hours
        expect(getTimeClusteringRisk(86400, 5)).toBe(0); // 24 hours
    });

    it("should handle exactly 3 posts (minimum for meaningful clustering)", () => {
        expect(getTimeClusteringRisk(100, 3)).toBe(0.3); // tight clustering
        expect(getTimeClusteringRisk(25000, 3)).toBe(0); // spread out
    });
});
