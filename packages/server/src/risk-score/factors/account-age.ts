import type { RiskContext, RiskFactor } from "../types.js";
import { getAuthorFromChallengeRequest, getAuthorPublicKeyFromChallengeRequest } from "../utils.js";

/**
 * Time thresholds in days for account age scoring.
 */
const THRESHOLDS = {
    /** Accounts older than this are considered very trustworthy */
    VERY_OLD: 365,
    /** Accounts older than this are considered trustworthy */
    OLD: 90,
    /** Accounts older than this are considered established */
    ESTABLISHED: 30,
    /** Accounts younger than this are considered new */
    NEW: 7,
    /** Accounts younger than this are considered very new */
    VERY_NEW: 1
};

/**
 * Risk scores for different account age brackets.
 * Lower values = lower risk.
 */
const SCORES = {
    VERY_OLD: 0.1,
    OLD: 0.2,
    ESTABLISHED: 0.35,
    MODERATE: 0.5,
    NEW: 0.7,
    VERY_NEW: 0.85,
    NO_HISTORY: 0.9
};

/**
 * Calculate risk score based on account age.
 * Uses the older of:
 * 1. firstCommentTimestamp from author.subplebbit (TRUSTED - from subplebbit)
 * 2. First seen timestamp from our own database
 *
 * Scoring logic:
 * - Older accounts are considered more trustworthy (lower risk)
 * - New accounts are higher risk as they haven't built a reputation
 * - Accounts with no timestamp are treated as brand new (highest risk)
 */
export function calculateAccountAge(ctx: RiskContext, weight: number): RiskFactor {
    const { challengeRequest, now, db } = ctx;
    const author = getAuthorFromChallengeRequest(challengeRequest);
    const authorPublicKey = getAuthorPublicKeyFromChallengeRequest(challengeRequest);
    const subplebbitAuthor = author.subplebbit;

    // Get first seen timestamp from our own database using the author's public key
    // (author.address can be a domain and is not cryptographically tied to the author)
    const dbFirstSeen = db.getAuthorFirstSeenTimestamp(authorPublicKey);
    const subplebbitFirstComment = subplebbitAuthor?.firstCommentTimestamp;

    // Determine the effective first activity timestamp (use the older one)
    let firstActivityTimestamp: number | undefined;
    if (subplebbitFirstComment && dbFirstSeen) {
        firstActivityTimestamp = Math.min(subplebbitFirstComment, dbFirstSeen);
    } else {
        firstActivityTimestamp = subplebbitFirstComment ?? dbFirstSeen;
    }

    // No first activity timestamp means new account or first interaction
    if (!firstActivityTimestamp) {
        return {
            name: "accountAge",
            score: SCORES.NO_HISTORY,
            weight,
            explanation: "No account history in this subplebbit"
        };
    }

    const accountAgeSeconds = now - firstActivityTimestamp;
    const accountAgeDays = accountAgeSeconds / (24 * 60 * 60);

    let score: number;
    let explanation: string;

    if (accountAgeDays > THRESHOLDS.VERY_OLD) {
        score = SCORES.VERY_OLD;
        explanation = `Account is ${Math.floor(accountAgeDays)} days old (very established)`;
    } else if (accountAgeDays > THRESHOLDS.OLD) {
        score = SCORES.OLD;
        explanation = `Account is ${Math.floor(accountAgeDays)} days old (established)`;
    } else if (accountAgeDays > THRESHOLDS.ESTABLISHED) {
        score = SCORES.ESTABLISHED;
        explanation = `Account is ${Math.floor(accountAgeDays)} days old (moderately established)`;
    } else if (accountAgeDays > THRESHOLDS.NEW) {
        score = SCORES.MODERATE;
        explanation = `Account is ${Math.floor(accountAgeDays)} days old`;
    } else if (accountAgeDays > THRESHOLDS.VERY_NEW) {
        score = SCORES.NEW;
        explanation = `Account is ${Math.floor(accountAgeDays)} days old (new)`;
    } else {
        score = SCORES.VERY_NEW;
        explanation = `Account is less than 1 day old (very new)`;
    }

    return {
        name: "accountAge",
        score,
        weight,
        explanation
    };
}
