import * as countries from "i18n-iso-countries";
import { z } from "zod";

const ISO_COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;


const isIsoCountryCode = (value: string) =>
  ISO_COUNTRY_CODE_REGEX.test(value) && countries.isValid(value);

export const IsoCountryCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => isIsoCountryCode(value), {
    message: "Unknown ISO 3166-1 alpha-2 country code",
  });

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
  ipAddressCountry: IsoCountryCodeSchema.optional(),
  challengeType: z.string().optional(),
  ipTypeEstimation: z.string().optional(),
});

export type EvaluateResponse = z.infer<typeof EvaluateResponseSchema>;
export type VerifyResponse = z.infer<typeof VerifyResponseSchema>;
