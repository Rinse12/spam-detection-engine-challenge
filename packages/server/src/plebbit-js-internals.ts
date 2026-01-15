import path from "path";
import { createRequire } from "module";
import { pathToFileURL } from "url";
import type { PublicationWithSubplebbitAuthorFromDecryptedChallengeRequest } from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";

const require = createRequire(import.meta.url);
const plebbitEntry = require.resolve("@plebbit/plebbit-js");
const plebbitRoot = path.resolve(path.dirname(plebbitEntry), "..", "..");

const pubsubSchemaUrl = pathToFileURL(path.join(plebbitRoot, "dist/node/pubsub-messages/schema.js")).href;
const schemaUrl = pathToFileURL(path.join(plebbitRoot, "dist/node/schema/schema.js")).href;
const utilUrl = pathToFileURL(path.join(plebbitRoot, "dist/node/util.js")).href;

const [
    { DecryptedChallengeRequestSchema },
    { JsonSignatureSchema, PlebbitTimestampSchema, SubplebbitAuthorSchema },
    { derivePublicationFromChallengeRequest: _derivePublicationFromChallengeRequest, isStringDomain }
] = await Promise.all([import(pubsubSchemaUrl), import(schemaUrl), import(utilUrl)]);

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
