import { z } from "zod";
import type { RefinementCtx } from "zod";
import {
    DecryptedChallengeRequestSchema,
    JsonSignatureSchema,
    PlebbitTimestampSchema,
    SubplebbitAuthorSchema,
    derivePublicationFromChallengeRequest
} from "../plebbit-js-internals.js";

const ChallengeRequestWithSubplebbitAuthorSchema = DecryptedChallengeRequestSchema.superRefine((value: unknown, ctx: RefinementCtx) => {
    try {
        const publication = derivePublicationFromChallengeRequest(value);
        const subplebbitAuthor = publication?.author?.subplebbit;

        if (!subplebbitAuthor) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Missing subplebbit author data"
            });
            return;
        }

        const subplebbitResult = SubplebbitAuthorSchema.safeParse(subplebbitAuthor);
        if (!subplebbitResult.success) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid subplebbit author data"
            });
        }
    } catch (error) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid challenge request: missing publication"
        });
    }
});

export const EvaluateRequestSchema = z
    .object({
        challengeRequest: ChallengeRequestWithSubplebbitAuthorSchema,
        timestamp: PlebbitTimestampSchema,
        signature: JsonSignatureSchema
    })
    .strict();

/**
 * Type for the evaluate request body.
 * Imported from plebbit-js.
 */
export type EvaluateRequest = z.infer<typeof EvaluateRequestSchema>;

/**
 * Schema for the verify request body.
 */
export const VerifyRequestSchema = z
    .object({
        challengeId: z.string().min(1, "challengeId is required"),
        token: z.string().min(1, "token is required"),
        timestamp: PlebbitTimestampSchema,
        signature: JsonSignatureSchema
    })
    .strict();

export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;

/**
 * Schema for the iframe route params.
 */
export const IframeParamsSchema = z.object({
    challengeId: z.string().min(1, "challengeId is required") // TODO figure out how it should look like
});

export type IframeParams = z.infer<typeof IframeParamsSchema>;

/**
 * Schema for the challenge complete request body.
 * Called by the iframe after user completes a challenge (CAPTCHA, OAuth, etc.).
 */
export const CompleteRequestSchema = z
    .object({
        challengeId: z.string().min(1, "challengeId is required"),
        /** The response token from the challenge provider (Turnstile, hCaptcha, OAuth code, etc.) */
        challengeResponse: z.string().min(1, "challengeResponse is required"),
        /** The type of challenge that was completed (e.g., "turnstile", "hcaptcha", "github") */
        challengeType: z.string().optional()
    })
    .strict();

export type CompleteRequest = z.infer<typeof CompleteRequestSchema>;
