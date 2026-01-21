import { DecryptedChallengeRequestSchema } from "@plebbit/plebbit-js/dist/node/pubsub-messages/schema.js";
import { JsonSignatureSchema, PlebbitTimestampSchema, SubplebbitAuthorSchema } from "@plebbit/plebbit-js/dist/node/schema/schema.js";
import {
    derivePublicationFromChallengeRequest as _derivePublicationFromChallengeRequest,
    isStringDomain
} from "@plebbit/plebbit-js/dist/node/util.js";
import type { PublicationWithSubplebbitAuthorFromDecryptedChallengeRequest } from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";

const derivePublicationFromChallengeRequest = _derivePublicationFromChallengeRequest as (
    request: unknown
) => PublicationWithSubplebbitAuthorFromDecryptedChallengeRequest;

export {
    DecryptedChallengeRequestSchema,
    JsonSignatureSchema,
    PlebbitTimestampSchema,
    SubplebbitAuthorSchema,
    derivePublicationFromChallengeRequest,
    isStringDomain
};
