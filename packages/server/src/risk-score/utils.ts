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
