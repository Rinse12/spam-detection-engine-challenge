import { z } from "zod";

export const EvaluateResponseSchema = z.object({
  riskScore: z.number(),
  explanation: z.string().optional(),
  challengeId: z.string(),
  challengeUrl: z.string(),
  challengeExpiresAt: z.number().optional(),
});

export const VerifyResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  ipRisk: z.number().optional(),
  ipAddressCountry: z.string().optional(), // TODO this should be ISO 3166-1 alpha-2 country code
  challengeType: z.string().optional(),
  ipTypeEstimation: z.string().optional(),
});

export type EvaluateResponse = z.infer<typeof EvaluateResponseSchema>;
export type VerifyResponse = z.infer<typeof VerifyResponseSchema>;
