/**
 * Risk Score Scenario Generator
 *
 * Generates a markdown file with worked examples showing risk scores
 * across all configuration combinations for various scenarios.
 *
 * Usage: npm run generate-scenarios
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { SpamDetectionDatabase } from "../src/db/index.js";
import { calculateRiskScore, type CalculateRiskScoreOptions } from "../src/risk-score/index.js";
import { determineChallengeTier, type ChallengeTier } from "../src/risk-score/challenge-tier.js";
import type { IpIntelligence } from "../src/risk-score/factors/ip-risk.js";
import type { DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor } from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Types
// ============================================================================

type IpType = "disabled" | "residential" | "datacenter" | "vpn" | "tor";
type OAuthConfig = "disabled" | "enabled-unverified" | "google-verified" | "google+github-verified";
type PublicationType = "post" | "reply" | "vote";

interface ScenarioConfig {
    name: string;
    description: string;
    publicationType: PublicationType;
    accountAge: "no_history" | "<1_day" | "7_days" | "30_days" | "90_days" | "365+_days";
    karma: "no_data" | "-5" | "0" | "+3" | "+5";
    velocity: "normal" | "elevated" | "suspicious" | "bot_like";
    banCount: 0 | 1 | 3;
    modqueueRejection: "no_data" | "0%" | "50%" | "80%";
    removalRate: "no_data" | "0%" | "30%" | "60%";
    contentDuplicates: "none" | "3" | "5+";
    urlSpam: "no_urls" | "1_unique" | "5+_same";
    hasOAuthVerification?: string[]; // Provider names, empty means unverified
}

interface ScenarioResult {
    riskScore: number;
    tier: ChallengeTier;
    factors: Array<{
        name: string;
        score: number;
        weight: number;
        effectiveWeight: number;
        contribution: number;
        explanation: string;
    }>;
}

// ============================================================================
// Configuration Dimensions
// ============================================================================

const IP_TYPES: IpType[] = ["disabled", "residential", "datacenter", "vpn", "tor"];

const OAUTH_CONFIGS: OAuthConfig[] = ["disabled", "enabled-unverified", "google-verified", "google+github-verified"];

const PUBLICATION_TYPES: PublicationType[] = ["post", "reply", "vote"];

// ============================================================================
// Scenarios
// ============================================================================

const SCENARIOS: ScenarioConfig[] = [
    {
        name: "Brand New User",
        description: "A completely new user making their first post with no history.",
        publicationType: "post",
        accountAge: "no_history",
        karma: "no_data",
        velocity: "normal",
        banCount: 0,
        modqueueRejection: "no_data",
        removalRate: "no_data",
        contentDuplicates: "none",
        urlSpam: "no_urls"
    },
    {
        name: "Established Trusted User",
        description: "A well-established user with 90+ days history, positive karma, and Google verification.",
        publicationType: "post",
        accountAge: "90_days",
        karma: "+5",
        velocity: "normal",
        banCount: 0,
        modqueueRejection: "0%",
        removalRate: "0%",
        contentDuplicates: "none",
        urlSpam: "no_urls",
        hasOAuthVerification: ["google"]
    },
    {
        name: "New User with Link",
        description: "A very new user (<1 day) posting with a single URL.",
        publicationType: "post",
        accountAge: "<1_day",
        karma: "no_data",
        velocity: "normal",
        banCount: 0,
        modqueueRejection: "no_data",
        removalRate: "no_data",
        contentDuplicates: "none",
        urlSpam: "1_unique"
    },
    {
        name: "Repeat Link Spammer",
        description: "A user with negative karma, 1 ban, posting the same link repeatedly.",
        publicationType: "post",
        accountAge: "7_days",
        karma: "-5",
        velocity: "elevated",
        banCount: 1,
        modqueueRejection: "50%",
        removalRate: "30%",
        contentDuplicates: "none",
        urlSpam: "5+_same"
    },
    {
        name: "Content Duplicator",
        description: "A user spamming the same content across multiple posts.",
        publicationType: "post",
        accountAge: "30_days",
        karma: "0",
        velocity: "elevated",
        banCount: 0,
        modqueueRejection: "no_data",
        removalRate: "no_data",
        contentDuplicates: "5+",
        urlSpam: "no_urls"
    },
    {
        name: "Bot-like Velocity",
        description: "A very new user posting at automated/bot-like rates.",
        publicationType: "post",
        accountAge: "<1_day",
        karma: "no_data",
        velocity: "bot_like",
        banCount: 0,
        modqueueRejection: "no_data",
        removalRate: "no_data",
        contentDuplicates: "none",
        urlSpam: "no_urls"
    },
    {
        name: "Serial Offender",
        description: "A known bad actor with 3+ bans, negative karma, and moderate spam history.",
        publicationType: "post",
        accountAge: "90_days",
        karma: "-5",
        velocity: "elevated",
        banCount: 3,
        modqueueRejection: "80%",
        removalRate: "60%",
        contentDuplicates: "3",
        urlSpam: "1_unique"
    },
    {
        name: "New User, Dual OAuth",
        description: "A brand new user verified via both Google and GitHub OAuth.",
        publicationType: "post",
        accountAge: "no_history",
        karma: "no_data",
        velocity: "normal",
        banCount: 0,
        modqueueRejection: "no_data",
        removalRate: "no_data",
        contentDuplicates: "none",
        urlSpam: "no_urls",
        hasOAuthVerification: ["google", "github"]
    },
    {
        name: "Vote Spammer",
        description: "A user with bot-like voting velocity.",
        publicationType: "vote",
        accountAge: "7_days",
        karma: "0",
        velocity: "bot_like",
        banCount: 0,
        modqueueRejection: "no_data",
        removalRate: "no_data",
        contentDuplicates: "none",
        urlSpam: "no_urls"
    },
    {
        name: "Trusted Reply Author",
        description: "An established user making a reply with positive karma.",
        publicationType: "reply",
        accountAge: "365+_days",
        karma: "+3",
        velocity: "normal",
        banCount: 0,
        modqueueRejection: "0%",
        removalRate: "0%",
        contentDuplicates: "none",
        urlSpam: "no_urls"
    },
    {
        name: "Borderline Modqueue",
        description: "A moderately established user with 50% modqueue rejection rate.",
        publicationType: "post",
        accountAge: "30_days",
        karma: "0",
        velocity: "normal",
        banCount: 0,
        modqueueRejection: "50%",
        removalRate: "0%",
        contentDuplicates: "none",
        urlSpam: "no_urls"
    },
    {
        name: "High Removal Rate",
        description: "An established user whose content is frequently removed (60%).",
        publicationType: "post",
        accountAge: "90_days",
        karma: "0",
        velocity: "normal",
        banCount: 0,
        modqueueRejection: "no_data",
        removalRate: "60%",
        contentDuplicates: "none",
        urlSpam: "no_urls"
    },
    {
        name: "New, OAuth Unverified",
        description: "A new user where OAuth is enabled but they haven't verified.",
        publicationType: "post",
        accountAge: "no_history",
        karma: "no_data",
        velocity: "normal",
        banCount: 0,
        modqueueRejection: "no_data",
        removalRate: "no_data",
        contentDuplicates: "none",
        urlSpam: "no_urls",
        hasOAuthVerification: [] // OAuth enabled but unverified
    },
    {
        name: "Moderate Content Spam",
        description: "A user with 3 duplicate content posts.",
        publicationType: "post",
        accountAge: "7_days",
        karma: "0",
        velocity: "normal",
        banCount: 0,
        modqueueRejection: "no_data",
        removalRate: "no_data",
        contentDuplicates: "3",
        urlSpam: "no_urls"
    },
    {
        name: "Perfect User",
        description: "An ideal user with 365+ days history, +5 karma, dual OAuth, and clean record.",
        publicationType: "post",
        accountAge: "365+_days",
        karma: "+5",
        velocity: "normal",
        banCount: 0,
        modqueueRejection: "0%",
        removalRate: "0%",
        contentDuplicates: "none",
        urlSpam: "no_urls",
        hasOAuthVerification: ["google", "github"]
    }
];

// ============================================================================
// Helper Functions
// ============================================================================

function getIpIntelligence(ipType: IpType): IpIntelligence | undefined {
    switch (ipType) {
        case "disabled":
            return undefined;
        case "residential":
            return { isVpn: false, isProxy: false, isTor: false, isDatacenter: false };
        case "datacenter":
            return { isVpn: false, isProxy: false, isTor: false, isDatacenter: true };
        case "vpn":
            return { isVpn: true, isProxy: false, isTor: false, isDatacenter: false };
        case "tor":
            return { isVpn: false, isProxy: false, isTor: true, isDatacenter: false };
    }
}

function getEnabledOAuthProviders(oauthConfig: OAuthConfig): string[] {
    switch (oauthConfig) {
        case "disabled":
            return [];
        case "enabled-unverified":
            return ["google", "github"];
        case "google-verified":
            return ["google", "github"];
        case "google+github-verified":
            return ["google", "github"];
    }
}

function getAccountAgeTimestamp(accountAge: ScenarioConfig["accountAge"], now: number): number | undefined {
    const DAY = 86400;
    switch (accountAge) {
        case "no_history":
            return undefined;
        case "<1_day":
            return now - DAY * 0.5;
        case "7_days":
            return now - DAY * 10;
        case "30_days":
            return now - DAY * 45;
        case "90_days":
            return now - DAY * 120;
        case "365+_days":
            return now - DAY * 400;
    }
}

function generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 15);
}

// ============================================================================
// Database Seeding
// ============================================================================

function seedDatabase(
    db: SpamDetectionDatabase,
    scenario: ScenarioConfig,
    authorPublicKey: string,
    now: number,
    oauthConfig: OAuthConfig
): void {
    const nowMs = now * 1000;
    const subplebbitAddress = "test-sub.eth";

    // Helper to create sessions and publications
    const createSession = (sessionId: string) => {
        db.insertChallengeSession({
            sessionId,
            subplebbitPublicKey: "test-subplebbit-pubkey",
            expiresAt: nowMs + 3600000
        });
    };

    // Seed account age by adding historical comments
    const accountAgeTimestamp = getAccountAgeTimestamp(scenario.accountAge, now);
    if (accountAgeTimestamp !== undefined) {
        const sessionId = `seed-age-${generateUniqueId()}`;
        createSession(sessionId);

        const db_raw = db.getDb();
        db_raw
            .prepare(
                `
            INSERT INTO comments (sessionId, author, subplebbitAddress, content, signature, timestamp, protocolVersion, receivedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
            )
            .run(
                sessionId,
                JSON.stringify({ address: "seed-author" }),
                subplebbitAddress,
                "Historical comment for account age",
                JSON.stringify({ publicKey: authorPublicKey, signature: "dummy", type: "ed25519" }),
                accountAgeTimestamp,
                "1",
                accountAgeTimestamp * 1000
            );
    }

    // Seed karma by adding historical karma data in indexed tables
    if (scenario.karma !== "no_data") {
        const karmaValue = scenario.karma === "+5" ? 5 : scenario.karma === "+3" ? 3 : scenario.karma === "-5" ? -5 : 0;

        // Add karma to multiple domain-addressed subplebbits
        const karmaSubsCount = Math.abs(karmaValue) > 0 ? Math.abs(karmaValue) : 1;
        for (let i = 0; i < karmaSubsCount; i++) {
            const subAddr = `karma-sub-${i}.eth`;
            const db_raw = db.getDb();

            // Insert indexed subplebbit
            db_raw
                .prepare(
                    `
                INSERT OR IGNORE INTO indexed_subplebbits (address, discoveredVia, discoveredAt, indexingEnabled)
                VALUES (?, 'manual', ?, 1)
            `
                )
                .run(subAddr, nowMs);

            // Insert indexed comment IPFS
            const cid = `Qm${generateUniqueId()}`;
            db_raw
                .prepare(
                    `
                INSERT INTO indexed_comments_ipfs (cid, subplebbitAddress, author, signature, timestamp, fetchedAt, protocolVersion)
                VALUES (?, ?, ?, ?, ?, ?, '1')
            `
                )
                .run(
                    cid,
                    subAddr,
                    JSON.stringify({ address: "seed-author" }),
                    JSON.stringify({ publicKey: authorPublicKey, signature: "dummy", type: "ed25519" }),
                    now - 86400 * 30,
                    nowMs - 86400000 * 30
                );

            // Insert indexed comment update with karma
            const postScore = karmaValue > 0 ? 10 : karmaValue < 0 ? -10 : 0;
            db_raw
                .prepare(
                    `
                INSERT INTO indexed_comments_update (cid, author, updatedAt, fetchedAt)
                VALUES (?, ?, ?, ?)
            `
                )
                .run(cid, JSON.stringify({ subplebbit: { postScore, replyScore: 0 } }), now - 86400, nowMs - 86400000);
        }
    }

    // Seed velocity by adding recent publications
    if (scenario.velocity !== "normal") {
        const pubType = scenario.publicationType;
        let count = 0;
        switch (scenario.velocity) {
            case "elevated":
                count = pubType === "vote" ? 30 : pubType === "reply" ? 8 : 4;
                break;
            case "suspicious":
                count = pubType === "vote" ? 50 : pubType === "reply" ? 12 : 7;
                break;
            case "bot_like":
                count = pubType === "vote" ? 110 : pubType === "reply" ? 30 : 15;
                break;
        }

        for (let i = 0; i < count; i++) {
            const sessionId = `seed-vel-${generateUniqueId()}`;
            createSession(sessionId);

            const receivedAt = nowMs - (3600000 * i) / count; // Spread across last hour

            if (pubType === "vote") {
                db.insertVote({
                    sessionId,
                    publication: {
                        author: { address: "seed-author" },
                        subplebbitAddress,
                        commentCid: `Qm${generateUniqueId()}`,
                        signature: { publicKey: authorPublicKey, signature: "dummy", type: "ed25519" },
                        protocolVersion: "1",
                        vote: 1,
                        timestamp: Math.floor(receivedAt / 1000)
                    }
                });
                // Update receivedAt
                db.getDb().prepare("UPDATE votes SET receivedAt = ? WHERE sessionId = ?").run(receivedAt, sessionId);
            } else {
                const publication: Parameters<typeof db.insertComment>[0]["publication"] = {
                    author: { address: "seed-author" },
                    subplebbitAddress,
                    signature: { publicKey: authorPublicKey, signature: "dummy", type: "ed25519" },
                    protocolVersion: "1",
                    content: `Velocity test content ${i}`,
                    timestamp: Math.floor(receivedAt / 1000)
                };
                if (pubType === "reply") {
                    publication.parentCid = `QmParent${generateUniqueId()}`;
                }
                db.insertComment({ sessionId, publication });
                // Update receivedAt
                db.getDb().prepare("UPDATE comments SET receivedAt = ? WHERE sessionId = ?").run(receivedAt, sessionId);
            }
        }
    }

    // Seed ban history
    if (scenario.banCount > 0) {
        const db_raw = db.getDb();
        for (let i = 0; i < scenario.banCount; i++) {
            const subAddr = `ban-sub-${i}.eth`;

            // Insert indexed subplebbit
            db_raw
                .prepare(
                    `
                INSERT OR IGNORE INTO indexed_subplebbits (address, discoveredVia, discoveredAt, indexingEnabled)
                VALUES (?, 'manual', ?, 1)
            `
                )
                .run(subAddr, nowMs);

            // Insert indexed comment with ban
            const cid = `QmBan${generateUniqueId()}`;
            db_raw
                .prepare(
                    `
                INSERT INTO indexed_comments_ipfs (cid, subplebbitAddress, author, signature, timestamp, fetchedAt, protocolVersion)
                VALUES (?, ?, ?, ?, ?, ?, '1')
            `
                )
                .run(
                    cid,
                    subAddr,
                    JSON.stringify({ address: "seed-author" }),
                    JSON.stringify({ publicKey: authorPublicKey, signature: "dummy", type: "ed25519" }),
                    now - 86400 * 30,
                    nowMs - 86400000 * 30
                );

            db_raw
                .prepare(
                    `
                INSERT INTO indexed_comments_update (cid, author, updatedAt, fetchedAt)
                VALUES (?, ?, ?, ?)
            `
                )
                .run(cid, JSON.stringify({ subplebbit: { banExpiresAt: now + 86400 * 365 } }), now - 86400, nowMs - 86400000);
        }
    }

    // Seed modqueue rejection rate
    if (scenario.modqueueRejection !== "no_data") {
        const db_raw = db.getDb();
        const totalSubmissions = 10;
        let rejectedCount = 0;
        switch (scenario.modqueueRejection) {
            case "0%":
                rejectedCount = 0;
                break;
            case "50%":
                rejectedCount = 5;
                break;
            case "80%":
                rejectedCount = 8;
                break;
        }

        const modqueueSubAddr = "modqueue-sub.eth";
        db_raw
            .prepare(
                `
            INSERT OR IGNORE INTO indexed_subplebbits (address, discoveredVia, discoveredAt, indexingEnabled)
            VALUES (?, 'manual', ?, 1)
        `
            )
            .run(modqueueSubAddr, nowMs);

        for (let i = 0; i < totalSubmissions; i++) {
            const cid = `QmMod${generateUniqueId()}`;
            const accepted = i >= rejectedCount;

            db_raw
                .prepare(
                    `
                INSERT INTO modqueue_comments_ipfs (cid, subplebbitAddress, author, signature, timestamp, firstSeenAt, protocolVersion)
                VALUES (?, ?, ?, ?, ?, ?, '1')
            `
                )
                .run(
                    cid,
                    modqueueSubAddr,
                    JSON.stringify({ address: "seed-author" }),
                    JSON.stringify({ publicKey: authorPublicKey, signature: "dummy", type: "ed25519" }),
                    now - 86400 * 10,
                    nowMs - 86400000 * 10
                );

            db_raw
                .prepare(
                    `
                INSERT INTO modqueue_comments_update (cid, pendingApproval, lastSeenAt, resolved, resolvedAt, accepted)
                VALUES (?, 1, ?, 1, ?, ?)
            `
                )
                .run(cid, nowMs - 86400000 * 5, nowMs - 86400000, accepted ? 1 : 0);
        }
    }

    // Seed removal rate
    if (scenario.removalRate !== "no_data") {
        const db_raw = db.getDb();
        const totalComments = 10;
        let removedCount = 0;
        switch (scenario.removalRate) {
            case "0%":
                removedCount = 0;
                break;
            case "30%":
                removedCount = 3;
                break;
            case "60%":
                removedCount = 6;
                break;
        }

        const removalSubAddr = "removal-sub.eth";
        db_raw
            .prepare(
                `
            INSERT OR IGNORE INTO indexed_subplebbits (address, discoveredVia, discoveredAt, indexingEnabled)
            VALUES (?, 'manual', ?, 1)
        `
            )
            .run(removalSubAddr, nowMs);

        for (let i = 0; i < totalComments; i++) {
            const cid = `QmRemove${generateUniqueId()}`;
            const removed = i < removedCount;

            db_raw
                .prepare(
                    `
                INSERT INTO indexed_comments_ipfs (cid, subplebbitAddress, author, signature, timestamp, fetchedAt, protocolVersion)
                VALUES (?, ?, ?, ?, ?, ?, '1')
            `
                )
                .run(
                    cid,
                    removalSubAddr,
                    JSON.stringify({ address: "seed-author" }),
                    JSON.stringify({ publicKey: authorPublicKey, signature: "dummy", type: "ed25519" }),
                    now - 86400 * 10,
                    nowMs - 86400000 * 10
                );

            db_raw
                .prepare(
                    `
                INSERT INTO indexed_comments_update (cid, removed, updatedAt, fetchedAt)
                VALUES (?, ?, ?, ?)
            `
                )
                .run(cid, removed ? 1 : 0, now - 86400, nowMs - 86400000);
        }
    }

    // Seed content duplicates
    if (scenario.contentDuplicates !== "none") {
        const dupContent = "This is duplicate spam content that appears multiple times.";
        const dupCount = scenario.contentDuplicates === "3" ? 3 : 6;

        for (let i = 0; i < dupCount; i++) {
            const sessionId = `seed-dup-${generateUniqueId()}`;
            createSession(sessionId);

            db.insertComment({
                sessionId,
                publication: {
                    author: { address: "seed-author" },
                    subplebbitAddress,
                    signature: { publicKey: authorPublicKey, signature: `dup-${i}`, type: "ed25519" },
                    protocolVersion: "1",
                    content: dupContent,
                    timestamp: now - 3600 * (i + 1)
                }
            });
            // Update receivedAt to be within 24 hours
            db.getDb()
                .prepare("UPDATE comments SET receivedAt = ? WHERE sessionId = ?")
                .run(nowMs - 3600000 * (i + 1), sessionId);
        }
    }

    // Seed URL spam
    if (scenario.urlSpam !== "no_urls") {
        const spamUrl = "https://spam.example.com/buy-now";

        if (scenario.urlSpam === "1_unique") {
            // Just one unique URL - no seeding needed, the test publication will have it
        } else if (scenario.urlSpam === "5+_same") {
            // Add 5 previous posts with the same URL
            for (let i = 0; i < 5; i++) {
                const sessionId = `seed-url-${generateUniqueId()}`;
                createSession(sessionId);

                db.insertComment({
                    sessionId,
                    publication: {
                        author: { address: "seed-author" },
                        subplebbitAddress,
                        signature: { publicKey: authorPublicKey, signature: `url-${i}`, type: "ed25519" },
                        protocolVersion: "1",
                        content: "Check out this link",
                        link: spamUrl,
                        timestamp: now - 3600 * (i + 1)
                    }
                });
                // Update receivedAt
                db.getDb()
                    .prepare("UPDATE comments SET receivedAt = ? WHERE sessionId = ?")
                    .run(nowMs - 3600000 * (i + 1), sessionId);
            }
        }
    }

    // Seed OAuth verification based on oauthConfig parameter
    // This determines what OAuth verification the author has for this test configuration
    let providersToSeed: string[] = [];

    if (oauthConfig === "google-verified") {
        providersToSeed = ["google"];
    } else if (oauthConfig === "google+github-verified") {
        providersToSeed = ["google", "github"];
    }
    // For "disabled" and "enabled-unverified", don't seed any OAuth

    // Also consider scenario-specific OAuth verification (for scenarios that explicitly define it)
    // If scenario has explicit hasOAuthVerification, use it instead (takes precedence)
    if (scenario.hasOAuthVerification !== undefined) {
        providersToSeed = scenario.hasOAuthVerification;
    }

    for (const provider of providersToSeed) {
        const sessionId = `seed-oauth-${generateUniqueId()}`;
        createSession(sessionId);

        // Insert a comment linked to this session
        db.insertComment({
            sessionId,
            publication: {
                author: { address: "seed-author" },
                subplebbitAddress,
                signature: { publicKey: authorPublicKey, signature: `oauth-${provider}`, type: "ed25519" },
                protocolVersion: "1",
                content: "OAuth verified comment",
                timestamp: now - 86400
            }
        });

        // Mark session as completed with OAuth identity
        db.updateChallengeSessionStatus(sessionId, "completed", nowMs - 86400000, `${provider}:user123`);
    }
}

// ============================================================================
// Challenge Request Creation
// ============================================================================

function createMockChallengeRequest(
    scenario: ScenarioConfig,
    authorPublicKey: string,
    now: number
): DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor {
    const subplebbitAddress = "test-sub.eth";

    // Build author object
    const author: Record<string, unknown> = {
        address: "12D3KooWAuthorAddress"
    };

    // Add subplebbit author data for karma
    if (scenario.karma !== "no_data") {
        const karmaValue = scenario.karma === "+5" ? 10 : scenario.karma === "+3" ? 5 : scenario.karma === "-5" ? -10 : 0;
        author.subplebbit = {
            postScore: karmaValue,
            replyScore: 0
        };
    } else {
        author.subplebbit = {
            postScore: 0,
            replyScore: 0
        };
    }

    const signature = {
        publicKey: authorPublicKey,
        signature: "mock-signature",
        type: "ed25519",
        signedPropertyNames: ["author", "subplebbitAddress", "timestamp", "protocolVersion", "content"]
    };

    const basePublication = {
        author,
        subplebbitAddress,
        timestamp: now,
        protocolVersion: "1",
        signature
    };

    // Create the appropriate publication type
    if (scenario.publicationType === "vote") {
        return {
            vote: {
                ...basePublication,
                commentCid: "QmVoteTarget",
                vote: 1
            }
        } as unknown as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
    }

    // Comment (post or reply)
    const comment: Record<string, unknown> = {
        ...basePublication,
        content:
            scenario.contentDuplicates !== "none" ? "This is duplicate spam content that appears multiple times." : "Test comment content"
    };

    if (scenario.publicationType === "reply") {
        comment.parentCid = "QmParentComment";
    }

    if (scenario.urlSpam === "1_unique") {
        comment.link = "https://unique-blog.example.com/article";
    } else if (scenario.urlSpam === "5+_same") {
        comment.link = "https://spam.example.com/buy-now";
    }

    return {
        comment
    } as unknown as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
}

// ============================================================================
// Scenario Execution
// ============================================================================

function runScenario(scenario: ScenarioConfig, ipType: IpType, oauthConfig: OAuthConfig): ScenarioResult {
    // Create fresh in-memory database for this scenario
    const db = new SpamDetectionDatabase({ path: ":memory:" });
    const now = Math.floor(Date.now() / 1000);
    const authorPublicKey = `scenario-author-${generateUniqueId()}`;

    try {
        // Seed the database with appropriate historical data
        seedDatabase(db, scenario, authorPublicKey, now, oauthConfig);

        // Create the mock challenge request
        const challengeRequest = createMockChallengeRequest(scenario, authorPublicKey, now);

        // Get IP intelligence
        const ipIntelligence = getIpIntelligence(ipType);

        // Get enabled OAuth providers
        let enabledOAuthProviders = getEnabledOAuthProviders(oauthConfig);

        // If scenario has explicit hasOAuthVerification = [] (meaning oauth enabled but not verified),
        // we still need providers enabled
        if (scenario.hasOAuthVerification !== undefined && scenario.hasOAuthVerification.length === 0) {
            enabledOAuthProviders = ["google", "github"];
        }

        // Calculate risk score
        const options: CalculateRiskScoreOptions = {
            challengeRequest,
            db,
            ipIntelligence,
            enabledOAuthProviders,
            now
        };

        const result = calculateRiskScore(options);
        const tier = determineChallengeTier(result.score);

        // Build factor breakdown
        const factors = result.factors.map((f) => ({
            name: f.name,
            score: f.score,
            weight: f.weight,
            effectiveWeight: f.effectiveWeight ?? 0,
            contribution: f.score * (f.effectiveWeight ?? 0),
            explanation: f.explanation
        }));

        return {
            riskScore: result.score,
            tier,
            factors
        };
    } finally {
        db.close();
    }
}

// ============================================================================
// Markdown Generation
// ============================================================================

function formatScore(score: number): string {
    return score.toFixed(2);
}

function formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
}

function getTopFactors(factors: ScenarioResult["factors"], count: number = 3): string {
    const sorted = [...factors]
        .filter((f) => f.weight > 0)
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, count);

    return sorted.map((f) => `${f.name} (${formatScore(f.score)})`).join(", ");
}

function generateMarkdown(): string {
    const lines: string[] = [];
    const generatedDate = new Date().toISOString().split("T")[0];

    lines.push("# Risk Score Scenarios");
    lines.push("");
    lines.push(`Generated: ${generatedDate}`);
    lines.push("");
    lines.push("This document shows risk scores across different configuration combinations for various user scenarios.");
    lines.push("Each scenario is tested against all combinations of:");
    lines.push("");
    lines.push("- **IP Types**: disabled (no IP check), residential, datacenter, vpn, tor");
    lines.push("- **OAuth Configs**: disabled, enabled-unverified, google-verified, google+github-verified");
    lines.push("- **Publication Types**: post, reply, vote");
    lines.push("");
    lines.push(
        `**Total: ${IP_TYPES.length} x ${OAUTH_CONFIGS.length} x ${PUBLICATION_TYPES.length} = ${IP_TYPES.length * OAUTH_CONFIGS.length * PUBLICATION_TYPES.length} configurations per scenario**`
    );
    lines.push("");
    lines.push("---");
    lines.push("");

    // Process each scenario
    for (let scenarioIdx = 0; scenarioIdx < SCENARIOS.length; scenarioIdx++) {
        const scenario = SCENARIOS[scenarioIdx];

        lines.push(`## Scenario ${scenarioIdx + 1}: ${scenario.name}`);
        lines.push("");
        lines.push(`**Description:** ${scenario.description}`);
        lines.push("");
        lines.push("**Author State:**");
        lines.push(`- Account Age: ${scenario.accountAge.replace(/_/g, " ")}`);
        lines.push(`- Karma: ${scenario.karma.replace(/_/g, " ")}`);
        lines.push(`- Bans: ${scenario.banCount}`);
        lines.push(`- Velocity: ${scenario.velocity}`);
        lines.push(`- Modqueue Rejection: ${scenario.modqueueRejection}`);
        lines.push(`- Removal Rate: ${scenario.removalRate}`);
        lines.push(`- Content Duplicates: ${scenario.contentDuplicates}`);
        lines.push(`- URL Spam: ${scenario.urlSpam.replace(/_/g, " ")}`);
        if (scenario.hasOAuthVerification !== undefined) {
            lines.push(
                `- OAuth Verification: ${scenario.hasOAuthVerification.length > 0 ? scenario.hasOAuthVerification.join(", ") : "none (but enabled)"}`
            );
        }
        lines.push("");
        lines.push("### Full Configuration Matrix");
        lines.push("");
        lines.push("| Pub Type | IP Type | OAuth Config | Risk Score | Tier | Top Factors |");
        lines.push("|----------|---------|--------------|------------|------|-------------|");

        // Store results for detailed breakdown later
        const scenarioResults: Array<{
            pubType: PublicationType;
            ipType: IpType;
            oauthConfig: OAuthConfig;
            result: ScenarioResult;
        }> = [];

        // Run all configurations
        for (const pubType of PUBLICATION_TYPES) {
            // Override publication type for this iteration
            const modifiedScenario = { ...scenario, publicationType: pubType };

            for (const ipType of IP_TYPES) {
                for (const oauthConfig of OAUTH_CONFIGS) {
                    const result = runScenario(modifiedScenario, ipType, oauthConfig);

                    scenarioResults.push({ pubType, ipType, oauthConfig, result });

                    const topFactors = getTopFactors(result.factors);
                    lines.push(
                        `| ${pubType} | ${ipType} | ${oauthConfig} | ${formatScore(result.riskScore)} | ${result.tier} | ${topFactors} |`
                    );
                }
            }
        }

        lines.push("");

        // Add a detailed factor breakdown for the first configuration (post / disabled / disabled)
        const baseResult = scenarioResults.find(
            (r) => r.pubType === scenario.publicationType && r.ipType === "disabled" && r.oauthConfig === "disabled"
        );

        if (baseResult) {
            lines.push(`### Factor Breakdown: ${scenario.publicationType} / disabled / disabled`);
            lines.push("");
            lines.push("| Factor | Score | Orig Weight | Eff Weight | Contribution |");
            lines.push("|--------|-------|-------------|------------|--------------|");

            for (const factor of baseResult.result.factors) {
                const skipped = factor.weight === 0 ? "(skipped)" : formatScore(factor.contribution);
                lines.push(
                    `| ${factor.name} | ${formatScore(factor.score)} | ${formatPercentage(factor.weight)} | ${formatPercentage(factor.effectiveWeight)} | ${skipped} |`
                );
            }

            lines.push(`| **Total** | | | 100% | **${formatScore(baseResult.result.riskScore)}** |`);
            lines.push("");
        }

        lines.push("---");
        lines.push("");
    }

    // Summary table
    lines.push("## Summary");
    lines.push("");
    lines.push("Risk score ranges across all configurations for each scenario:");
    lines.push("");
    lines.push("| Scenario | Min Score | Max Score | Tier Range |");
    lines.push("|----------|-----------|-----------|------------|");

    for (let scenarioIdx = 0; scenarioIdx < SCENARIOS.length; scenarioIdx++) {
        const scenario = SCENARIOS[scenarioIdx];

        let minScore = 1;
        let maxScore = 0;
        const tiers = new Set<ChallengeTier>();

        for (const pubType of PUBLICATION_TYPES) {
            const modifiedScenario = { ...scenario, publicationType: pubType };
            for (const ipType of IP_TYPES) {
                for (const oauthConfig of OAUTH_CONFIGS) {
                    const result = runScenario(modifiedScenario, ipType, oauthConfig);
                    minScore = Math.min(minScore, result.riskScore);
                    maxScore = Math.max(maxScore, result.riskScore);
                    tiers.add(result.tier);
                }
            }
        }

        const tierList = Array.from(tiers).join(", ");
        lines.push(`| ${scenarioIdx + 1}. ${scenario.name} | ${formatScore(minScore)} | ${formatScore(maxScore)} | ${tierList} |`);
    }

    lines.push("");

    return lines.join("\n");
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
    console.log("Generating risk score scenarios...");
    console.log(
        `Processing ${SCENARIOS.length} scenarios x ${IP_TYPES.length * OAUTH_CONFIGS.length * PUBLICATION_TYPES.length} configurations each`
    );
    console.log("");

    const markdown = generateMarkdown();

    const outputPath = path.join(__dirname, "..", "src", "risk-score", "RISK_SCORE_SCENARIOS.md");
    fs.writeFileSync(outputPath, markdown, "utf-8");

    console.log(`Generated: ${outputPath}`);
    console.log("Done!");
}

main().catch((err) => {
    console.error("Error generating scenarios:", err);
    process.exit(1);
});
