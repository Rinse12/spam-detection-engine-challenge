import type {
  ChallengeFileInput,
  ChallengeInput,
  ChallengeResultInput,
  SubplebbitChallengeSetting,
} from "@plebbit/plebbit-js/dist/node/subplebbit/types.js";
import type { DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor } from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";
import type { LocalSubplebbit } from "@plebbit/plebbit-js/dist/node/runtime/node/subplebbit/local-subplebbit.js";
import { signBufferEd25519 } from "./plebbit-js-signer.js";
import type {
  EvaluateResponse,
  VerifyResponse,
} from "@plebbit/spam-detection-shared";
import {
  EvaluateResponseSchema,
  VerifyResponseSchema,
} from "@plebbit/spam-detection-shared";
import { createOptionsSchema, type ParsedOptions } from "./schema.js";
import * as cborg from "cborg";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";

const DEFAULT_SERVER_URL = "https://spam.plebbit.org/api/v1"; // TODO once we have a server we will change this url

const optionInputs = [
  {
    option: "serverUrl",
    label: "Server URL",
    default: DEFAULT_SERVER_URL,
    description: "URL of the spam detection server",
    placeholder: "https://spam.plebbit.org/api/v1",
  },
  {
    option: "autoAcceptThreshold",
    label: "Auto-Accept Threshold",
    default: "0.2",
    description: "Auto-accept publications below this risk score",
    placeholder: "0.2",
  },
  {
    option: "autoRejectThreshold",
    label: "Auto-Reject Threshold",
    default: "0.8",
    description: "Auto-reject publications above this risk score",
    placeholder: "0.8",
  },
  {
    option: "countryBlacklist",
    label: "Country Blacklist",
    default: "",
    description: "Comma-separated ISO 3166-1 alpha-2 country codes to block",
    placeholder: "RU,CN,KP,US",
  },
  {
    option: "maxIpRisk",
    label: "Max IP Risk",
    default: "1.0",
    description:
      "Reject if ipRisk from /verify exceeds this threshold (estimation only, not 100% accurate)",
    placeholder: "1.0",
  },
  {
    option: "blockVpn",
    label: "Block VPN",
    default: "false",
    description:
      "Reject publications from VPN IPs (estimation only, not 100% accurate)",
    placeholder: "true",
  },
  {
    option: "blockProxy",
    label: "Block Proxy",
    default: "false",
    description:
      "Reject publications from proxy IPs (estimation only, not 100% accurate)",
    placeholder: "true",
  },
  {
    option: "blockTor",
    label: "Block Tor",
    default: "false",
    description:
      "Reject publications from Tor exit nodes (estimation only, not 100% accurate)",
    placeholder: "true",
  },
  {
    option: "blockDatacenter",
    label: "Block Datacenter",
    default: "false",
    description:
      "Reject publications from datacenter IPs (estimation only, not 100% accurate)",
    placeholder: "true",
  },
] as const satisfies NonNullable<ChallengeFileInput["optionInputs"]>;

const OptionsSchema = createOptionsSchema(optionInputs);

const type: ChallengeInput["type"] = "url/iframe";

const description: ChallengeFileInput["description"] =
  "Validate publications using the Plebbit spam detection engine.";

const parseOptions = (settings: SubplebbitChallengeSetting): ParsedOptions => {
  const parsed = OptionsSchema.safeParse(settings?.options);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => issue.message)
      .join("; ");
    throw new Error(`Invalid challenge options: ${message}`);
  }
  return parsed.data;
};

const CBORG_ENCODE_OPTIONS = {
  typeEncoders: {
    undefined: () => {
      throw new Error("Signed payload cannot include undefined values (cborg)");
    },
  },
};

const buildSignedPayload = (
  payload: Record<string, unknown>,
  signedPropertyNames: string[]
) => {
  const propsToSign: Record<string, unknown> = {};
  for (const propertyName of signedPropertyNames) {
    propsToSign[propertyName] = payload[propertyName];
  }
  return propsToSign;
};

const createRequestSignature = async (
  payload: Record<string, unknown>,
  signedPropertyNames: string[],
  signer: { privateKey?: string; publicKey?: string; type?: string }
) => {
  if (!signer.privateKey || !signer.publicKey || !signer.type) {
    throw new Error("Subplebbit signer is missing required fields");
  }
  const propsToSign = buildSignedPayload(payload, signedPropertyNames);
  const encoded = cborg.encode(propsToSign, CBORG_ENCODE_OPTIONS);
  const signatureBuffer = await signBufferEd25519(encoded, signer.privateKey);
  return {
    signature: uint8ArrayToString(signatureBuffer, "base64"),
    publicKey: signer.publicKey,
    type: signer.type,
    signedPropertyNames,
  };
};

const postJson = async (url: string, body: unknown): Promise<unknown> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  let responseBody: unknown;
  try {
    responseBody = (await response.json()) as unknown;
  } catch {
    responseBody = undefined;
  }

  if (!response.ok) {
    const details =
      responseBody !== undefined ? `: ${JSON.stringify(responseBody)}` : "";
    throw new Error(
      `Spam detection server error (${response.status})${details}`
    );
  }

  if (responseBody === undefined) {
    throw new Error("Invalid JSON response from spam detection server");
  }

  return responseBody;
};

const parseWithSchema = <T>(
  schema: { parse: (data: unknown) => T },
  data: unknown,
  context: string
): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const suffix = message ? `: ${message}` : "";
    throw new Error(
      `Invalid ${context} response from spam detection server${suffix}`
    );
  }
};

const formatRiskScore = (riskScore: number) => {
  if (!Number.isFinite(riskScore)) return String(riskScore);
  return riskScore.toFixed(2);
};

const getPostChallengeRejection = (
  verifyResponse: VerifyResponse,
  options: ParsedOptions
) => {
  if (
    typeof verifyResponse.ipRisk === "number" &&
    verifyResponse.ipRisk > options.maxIpRisk
  ) {
    return `Rejected by IP risk policy (ipRisk ${formatRiskScore(
      verifyResponse.ipRisk
    )}).`;
  }

  if (typeof verifyResponse.ipAddressCountry === "string") {
    const country = verifyResponse.ipAddressCountry.trim().toUpperCase();
    if (country && options.countryBlacklist.has(country)) {
      return `Rejected by country policy (${country}).`;
    }
  }

  if (typeof verifyResponse.ipTypeEstimation === "string") {
    const ipType = verifyResponse.ipTypeEstimation.trim().toLowerCase();
    if (ipType === "vpn" && options.blockVpn) {
      return "Rejected by IP policy (VPN).";
    }
    if (ipType === "proxy" && options.blockProxy) {
      return "Rejected by IP policy (proxy).";
    }
    if (ipType === "tor" && options.blockTor) {
      return "Rejected by IP policy (Tor).";
    }
    if (ipType === "datacenter" && options.blockDatacenter) {
      return "Rejected by IP policy (datacenter).";
    }
  }

  return undefined;
};

const getChallenge = async (
  subplebbitChallengeSettings: SubplebbitChallengeSetting,
  challengeRequestMessage: DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor,
  _challengeIndex: number,
  subplebbit: LocalSubplebbit
): Promise<ChallengeInput | ChallengeResultInput> => {
  const options = parseOptions(subplebbitChallengeSettings);
  const signer = subplebbit?.signer;

  if (!signer) {
    throw new Error("Subplebbit signer is required to call spam engine");
  }

  const evaluateTimestamp = Math.floor(Date.now() / 1000);
  const evaluatePayload = {
    challengeRequest: challengeRequestMessage,
    timestamp: evaluateTimestamp,
  };
  const evaluateSignature = await createRequestSignature(
    evaluatePayload,
    ["challengeRequest", "timestamp"],
    signer
  );

  const evaluateResponse = parseWithSchema<EvaluateResponse>(
    EvaluateResponseSchema,
    await postJson(`${options.serverUrl}/evaluate`, {
      ...evaluatePayload,
      signature: evaluateSignature,
    }),
    "evaluate"
  );
  const riskScore = evaluateResponse.riskScore;

  if (riskScore < options.autoAcceptThreshold) {
    return { success: true };
  }

  if (riskScore >= options.autoRejectThreshold) {
    const explanation = evaluateResponse.explanation
      ? ` ${evaluateResponse.explanation}`
      : "";
    return {
      success: false,
      // TODO find a better error message
      error: `Rejected by spam detection engine (riskScore ${formatRiskScore(
        riskScore
      )}).${explanation}`,
    };
  }

  const challengeId = evaluateResponse.challengeId;
  const challengeUrl = evaluateResponse.challengeUrl;

  const verify = async (answer: string): Promise<ChallengeResultInput> => {
    const token = typeof answer === "string" ? answer.trim() : "";
    if (!token) {
      return { success: false, error: "Missing challenge token." };
    }

    const verifyTimestamp = Math.floor(Date.now() / 1000);
    const verifyPayload = { challengeId, token, timestamp: verifyTimestamp };
    const verifySignature = await createRequestSignature(
      verifyPayload,
      ["challengeId", "token", "timestamp"],
      signer
    );

    const verifyResponse = parseWithSchema<VerifyResponse>(
      VerifyResponseSchema,
      await postJson(`${options.serverUrl}/challenge/verify`, {
        ...verifyPayload,
        signature: verifySignature,
      }),
      "verify"
    );

    if (!verifyResponse.success) {
      return {
        success: false,
        // TODO find a better error message
        error: verifyResponse.error || "Challenge verification failed.",
      };
    }

    const postChallengeRejection = getPostChallengeRejection(
      verifyResponse,
      options
    );
    if (postChallengeRejection) {
      return { success: false, error: postChallengeRejection };
    }

    return { success: true };
  };

  return { challenge: challengeUrl, verify, type };
};

function ChallengeFileFactory(
  subplebbitChallengeSettings: SubplebbitChallengeSetting
): ChallengeFileInput {
  return { getChallenge, optionInputs, type, description };
}

export default ChallengeFileFactory;
