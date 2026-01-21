import {
    verifyCommentPubsubMessage,
    verifyVote,
    verifyCommentEdit,
    verifyCommentModeration,
    verifySubplebbitEdit
} from "@plebbit/plebbit-js/dist/node/signer/signatures.js";
import type { DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor } from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";
import type Plebbit from "@plebbit/plebbit-js";

type PlebbitInstance = Awaited<ReturnType<typeof Plebbit>>;

/**
 * Verify a publication's signature using plebbit-js verify functions.
 * We pass resolveAuthorAddresses=false to skip domain resolution.
 */
export async function verifyPublicationSignature({
    challengeRequest,
    plebbit
}: {
    challengeRequest: DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
    plebbit: PlebbitInstance;
}) {
    const clientsManager = plebbit._clientsManager;
    const resolveAuthorAddresses = true;
    const overrideAuthorAddressIfInvalid = false;

    if (challengeRequest.comment) {
        return verifyCommentPubsubMessage(challengeRequest.comment, resolveAuthorAddresses, clientsManager, overrideAuthorAddressIfInvalid);
    } else if (challengeRequest.vote) {
        return verifyVote(challengeRequest.vote, resolveAuthorAddresses, clientsManager, overrideAuthorAddressIfInvalid);
    } else if (challengeRequest.commentEdit) {
        return verifyCommentEdit(challengeRequest.commentEdit, resolveAuthorAddresses, clientsManager, overrideAuthorAddressIfInvalid);
    } else if (challengeRequest.commentModeration) {
        return verifyCommentModeration(
            challengeRequest.commentModeration,
            resolveAuthorAddresses,
            clientsManager,
            overrideAuthorAddressIfInvalid
        );
    } else if (challengeRequest.subplebbitEdit) {
        return verifySubplebbitEdit(
            challengeRequest.subplebbitEdit,
            resolveAuthorAddresses,
            clientsManager,
            overrideAuthorAddressIfInvalid
        );
    }

    return { valid: false, reason: "Unknown publication type" };
}
