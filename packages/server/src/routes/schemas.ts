import { z } from "zod";
import type { RefinementCtx } from "zod";
import type { DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor } from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";
import {
  DecryptedChallengeRequestSchema,
  SubplebbitAuthorSchema,
  derivePublicationFromChallengeRequest,
} from "../plebbit-js-internals.js";

const ChallengeRequestWithSubplebbitAuthorSchema =
  DecryptedChallengeRequestSchema.superRefine(
    (value: unknown, ctx: RefinementCtx) => {
      try {
        const publication = derivePublicationFromChallengeRequest(value);
        const subplebbitAuthor = publication?.author?.subplebbit;

        if (!subplebbitAuthor) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Missing subplebbit author data",
          });
          return;
        }

        const subplebbitResult =
          SubplebbitAuthorSchema.safeParse(subplebbitAuthor);
        if (!subplebbitResult.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid subplebbit author data",
          });
        }
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid challenge request: missing publication",
        });
      }
    }
  );

export const EvaluateRequestSchema = z.object({
  challengeRequest: ChallengeRequestWithSubplebbitAuthorSchema,
});

/**
 * Type for the evaluate request body.
 * Imported from plebbit-js.
 */
export type EvaluateRequest = {
  challengeRequest: DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
};

/**
 * Schema for the verify request body.
 */
export const VerifyRequestSchema = z.object({
  challengeId: z.string().min(1, "challengeId is required"),
  token: z.string().min(1, "token is required"),
  // TODO add signature by subplebbit so only subplebbits can see those verify responses
});

export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;

/**
 * Schema for the iframe route params.
 */
export const IframeParamsSchema = z.object({
  challengeId: z.string().min(1, "challengeId is required"), // TODO figure out how it should look like
});

export type IframeParams = z.infer<typeof IframeParamsSchema>;
