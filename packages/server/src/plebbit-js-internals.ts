import path from "path";
import { createRequire } from "module";
import { pathToFileURL } from "url";

const require = createRequire(import.meta.url);
const plebbitEntry = require.resolve("@plebbit/plebbit-js");
const plebbitRoot = path.resolve(path.dirname(plebbitEntry), "..", "..");

const pubsubSchemaUrl = pathToFileURL(
  path.join(plebbitRoot, "dist/node/pubsub-messages/schema.js")
).href;
const schemaUrl = pathToFileURL(
  path.join(plebbitRoot, "dist/node/schema/schema.js")
).href;
const utilUrl = pathToFileURL(path.join(plebbitRoot, "dist/node/util.js")).href;

const [
  { DecryptedChallengeRequestSchema },
  { JsonSignatureSchema, PlebbitTimestampSchema, SubplebbitAuthorSchema },
  { derivePublicationFromChallengeRequest, isStringDomain },
] = await Promise.all([
  import(pubsubSchemaUrl),
  import(schemaUrl),
  import(utilUrl),
]);

export {
  DecryptedChallengeRequestSchema,
  JsonSignatureSchema,
  PlebbitTimestampSchema,
  SubplebbitAuthorSchema,
  derivePublicationFromChallengeRequest,
  isStringDomain,
};
