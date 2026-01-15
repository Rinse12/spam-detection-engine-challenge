import type { DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor } from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";

/**
 * Extract the publication from a decrypted challenge request.
 * The challenge request can contain different publication types:
 * - comment
 * - vote
 * - commentEdit
 * - commentModeration
 * - subplebbitEdit
 *
 * This helper returns the publication object regardless of type.
 */
export function getPublicationFromChallengeRequest(challengeRequest: DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor): {
    author: DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor["comment"] extends { author: infer A } ? A : never;
    subplebbitAddress: string;
    timestamp?: number;
    content?: string;
    link?: string;
    title?: string;
} {
    // The challenge request contains one of these publication types
    const publication =
        challengeRequest.comment ??
        challengeRequest.vote ??
        challengeRequest.commentEdit ??
        challengeRequest.commentModeration ??
        challengeRequest.subplebbitEdit;

    if (!publication) {
        throw new Error("No publication found in challenge request");
    }

    return publication as ReturnType<typeof getPublicationFromChallengeRequest>;
}

/**
 * Get the author from a challenge request.
 */
export function getAuthorFromChallengeRequest(challengeRequest: DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor) {
    const publication = getPublicationFromChallengeRequest(challengeRequest);
    return publication.author;
}

/**
 * Publication types for velocity tracking.
 */
export type PublicationType = "post" | "reply" | "vote" | "commentEdit" | "commentModeration" | "subplebbitEdit";

/**
 * Get the publication type from a challenge request.
 * - post: comment without parentCid
 * - reply: comment with parentCid
 * - vote: vote publication
 * - commentEdit: comment edit
 * - commentModeration: moderation action
 * - subplebbitEdit: subplebbit settings edit
 */
export function getPublicationType(challengeRequest: DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor): PublicationType {
    if (challengeRequest.comment) {
        // Check if it's a post (no parentCid) or reply (has parentCid)
        return challengeRequest.comment.parentCid ? "reply" : "post";
    }
    if (challengeRequest.vote) {
        return "vote";
    }
    if (challengeRequest.commentEdit) {
        return "commentEdit";
    }
    if (challengeRequest.commentModeration) {
        return "commentModeration";
    }
    if (challengeRequest.subplebbitEdit) {
        return "subplebbitEdit";
    }
    throw new Error("Unknown publication type in challenge request");
}

/**
 * Wallet address with chain information.
 */
export interface WalletInfo {
    address: string;
    chainTicker: string;
}

/**
 * Extract all wallet addresses from an author object.
 * Includes wallets from author.wallets and author.avatar.
 *
 * Note: author.wallets and author.avatar are user-provided but the signatures
 * are verified by plebbit-js, proving wallet ownership.
 */
export function getWalletAddresses(author: {
    wallets?: Record<string, { address: string; timestamp: number; signature: { signature: string; type: string } }>;
    avatar?: { chainTicker: string; address: string; id: string; timestamp: number; signature: { signature: string; type: string } };
}): WalletInfo[] {
    const wallets: WalletInfo[] = [];

    // Extract from author.wallets (keyed by chain ticker)
    if (author.wallets) {
        for (const [chainTicker, walletData] of Object.entries(author.wallets)) {
            if (walletData?.address) {
                wallets.push({
                    address: walletData.address,
                    chainTicker
                });
            }
        }
    }

    // Extract from author.avatar
    // The avatar contains NFT info, and we need to find the wallet that owns it
    // The wallet address for the avatar is in author.wallets[avatar.chainTicker]
    // However, since we already iterate over all wallets above, we don't need
    // to add it again. The avatar's wallet should be in author.wallets.

    return wallets;
}
