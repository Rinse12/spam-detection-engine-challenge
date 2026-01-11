import type {
  ChallengeFileInput,
  ChallengeInput,
  ChallengeResultInput,
  SubplebbitChallengeSetting,
} from "@plebbit/plebbit-js/dist/node/subplebbit/types.js";
import type { DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor } from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";
import type {
  EvaluateResponse,
  VerifyResponse,
} from "@plebbit/spam-detection-shared";
import {
  EvaluateResponseSchema,
  VerifyResponseSchema,
} from "@plebbit/spam-detection-shared";
import { createOptionsSchema, type ParsedOptions } from "./schema.js";

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

const getPublicationFromRequest = (
  challengeRequestMessage: DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor
) => {
  // TODO need to type this up properly
  const publicationKeys = [
    "comment",
    "vote",
    "commentEdit",
    "commentModeration",
    "subplebbitEdit",
  ] as const;
  for (const key of publicationKeys) {
    const maybePublication = challengeRequestMessage[key];
    if (maybePublication && typeof maybePublication === "object") {
      return maybePublication as { author?: { address?: string } };
    }
  }
  const genericPublication = (
    challengeRequestMessage as { publication?: unknown }
  ).publication;
  if (genericPublication && typeof genericPublication === "object") {
    return genericPublication as { author?: { address?: string } };
  }
  return undefined; // TODO it should not return undefined, there's no sceneario where publication is undefined
};

const getAuthorAddress = (
  challengeRequestMessage: DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor
) => {
  const publication = getPublicationFromRequest(challengeRequestMessage);
  const authorAddress = publication?.author?.address;
  if (typeof authorAddress === "string" && authorAddress.length > 0) {
    return authorAddress;
  }
  return undefined;
};

const readResponseText = async (response: Response) => {
  try {
    return await response.text();
  } catch {
    return "";
  }
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

  if (!response.ok) {
    const responseText = await readResponseText(response);
    const details = responseText ? `: ${responseText}` : "";
    throw new Error(
      `Spam detection server error (${response.status})${details}`
    );
  }

  try {
    return (await response.json()) as unknown;
  } catch (error) {
    throw new Error("Invalid JSON response from spam detection server");
  }
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
  _challengeIndex: number
): Promise<ChallengeInput | ChallengeResultInput> => {
  const options = parseOptions(subplebbitChallengeSettings);
  const authorAddress = getAuthorAddress(challengeRequestMessage);
  if (!authorAddress) {
    throw new Error("Author address is required for spam detection challenge");
  }

  const evaluateResponse = parseWithSchema<EvaluateResponse>(
    EvaluateResponseSchema,
    await postJson(`${options.serverUrl}/evaluate`, challengeRequestMessage),
    "evaluate"
  );
  const riskScore = evaluateResponse.riskScore;
  
  if (!Number.isFinite(riskScore)) {
    throw new Error("Spam detection server returned invalid riskScore");
  }
  if (
    typeof evaluateResponse.challengeId !== "string" ||
    !evaluateResponse.challengeId
  ) {
    throw new Error("Spam detection server returned invalid challengeId");
  }
  if (
    typeof evaluateResponse.challengeUrl !== "string" ||
    !evaluateResponse.challengeUrl
  ) {
    throw new Error("Spam detection server returned invalid challengeUrl");
  }

  if (riskScore < options.autoAcceptThreshold) {
    return { success: true };
  }

  if (riskScore >= options.autoRejectThreshold) {
    const explanation = evaluateResponse.explanation
      ? ` ${evaluateResponse.explanation}`
      : "";
    return {
      success: false,
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

    const verifyResponse = parseWithSchema<VerifyResponse>(
      VerifyResponseSchema,
      await postJson(`${options.serverUrl}/challenge/verify`, {
        challengeId,
        token,
        authorAddress,
      }),
      "verify"
    );

    if (typeof verifyResponse.success !== "boolean") {
      throw new Error("Spam detection server returned invalid verify response");
    }

    if (!verifyResponse.success) {
      return {
        success: false,
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
