import { z } from "zod";
import type { DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor } from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";

/**
 * Type for the evaluate request body.
 * Imported from plebbit-js.
 */
export type EvaluateRequest =
  DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;

/**
 * Schema for the verify request body.
 */
export const VerifyRequestSchema = z.object({
  challengeId: z.string().min(1, "challengeId is required"),
  token: z.string().min(1, "token is required"),
});

export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;

/**
 * Schema for the iframe route params.
 */
export const IframeParamsSchema = z.object({
  challengeId: z.string().min(1, "challengeId is required"), // TODO figure out how it should look like
});

export type IframeParams = z.infer<typeof IframeParamsSchema>;
