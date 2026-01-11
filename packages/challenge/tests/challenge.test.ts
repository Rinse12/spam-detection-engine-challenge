import type { SubplebbitChallengeSetting } from "@plebbit/plebbit-js/dist/node/subplebbit/types.js";
import type { DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor } from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";
import type {
  EvaluateResponse,
  VerifyResponse,
} from "@plebbit/spam-detection-shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import ChallengeFileFactory from "../src/index.js";

type MockResponseOptions = {
  ok?: boolean;
  status?: number;
  jsonThrows?: boolean;
};

const createResponse = (body: unknown, options: MockResponseOptions = {}) => {
  const { ok = true, status = 200, jsonThrows = false } = options;
  return {
    ok,
    status,
    json: jsonThrows
      ? vi.fn().mockRejectedValue(new Error("bad json"))
      : vi.fn().mockResolvedValue(body),
  };
};

const stubFetch = (...responses: Array<ReturnType<typeof createResponse>>) => {
  const fetchMock = vi.fn();
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const createEvaluateResponse = (
  overrides: Partial<EvaluateResponse> = {}
): EvaluateResponse => ({
  riskScore: 0.5,
  explanation: "OK",
  challengeId: "challenge-123",
  challengeUrl: "https://spam.plebbit.org/api/v1/iframe/challenge-123",
  challengeExpiresAt: 1710000000,
  ...overrides,
});

const createVerifyResponse = (
  overrides: Partial<VerifyResponse> = {}
): VerifyResponse => ({
  success: true,
  ...overrides,
});

const request =
  {} as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("spam-detection challenge package", () => {
  it("exposes metadata and option inputs", () => {
    const challengeFile = ChallengeFileFactory(
      {} as SubplebbitChallengeSetting
    );

    expect(challengeFile.type).toBe("url/iframe");
    expect(challengeFile.description).toMatch(/spam detection engine/i);
    expect(
      challengeFile.optionInputs.some((input) => input.option === "serverUrl")
    ).toBe(true);
  });

  it("auto-accepts low risk scores using the default serverUrl", async () => {
    const fetchMock = stubFetch(
      createResponse(createEvaluateResponse({ riskScore: 0.1 }))
    );
    const challengeFile = ChallengeFileFactory(
      {} as SubplebbitChallengeSetting
    );

    const result = await challengeFile.getChallenge(
      { options: {} } as SubplebbitChallengeSetting,
      request,
      0
    );

    expect(result).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://spam.plebbit.org/api/v1/evaluate",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("auto-rejects when riskScore meets the reject threshold", async () => {
    const fetchMock = stubFetch(
      createResponse(
        createEvaluateResponse({ riskScore: 0.8, explanation: "Too risky" })
      )
    );
    const challengeFile = ChallengeFileFactory(
      {} as SubplebbitChallengeSetting
    );

    const result = await challengeFile.getChallenge(
      { options: {} } as SubplebbitChallengeSetting,
      request,
      0
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: false,
      error:
        "Rejected by spam detection engine (riskScore 0.80). Too risky",
    });
  });

  it("returns a challenge and rejects missing tokens", async () => {
    const fetchMock = stubFetch(
      createResponse(createEvaluateResponse({ riskScore: 0.5 }))
    );
    const challengeFile = ChallengeFileFactory(
      {} as SubplebbitChallengeSetting
    );

    const result = await challengeFile.getChallenge(
      { options: {} } as SubplebbitChallengeSetting,
      request,
      0
    );

    if (!("verify" in result)) {
      throw new Error("Expected a challenge response");
    }

    const verifyResult = await result.verify("   ");
    expect(verifyResult).toEqual({
      success: false,
      error: "Missing challenge token.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("passes the trimmed token to the verify endpoint", async () => {
    const evaluateResponse = createEvaluateResponse({ riskScore: 0.5 });
    const fetchMock = stubFetch(
      createResponse(evaluateResponse),
      createResponse(createVerifyResponse({ success: false }))
    );
    const challengeFile = ChallengeFileFactory(
      {} as SubplebbitChallengeSetting
    );

    const result = await challengeFile.getChallenge(
      { options: {} } as SubplebbitChallengeSetting,
      request,
      0
    );

    if (!("verify" in result)) {
      throw new Error("Expected a challenge response");
    }

    await result.verify("  token-value  ");
    const verifyBody = JSON.parse(
      (fetchMock.mock.calls[1]?.[1]?.body ?? "{}") as string
    );
    expect(verifyBody).toEqual({
      challengeId: evaluateResponse.challengeId,
      token: "token-value",
    });
  });

  it("surfaces verification failures from the server", async () => {
    const fetchMock = stubFetch(
      createResponse(createEvaluateResponse({ riskScore: 0.5 })),
      createResponse(
        createVerifyResponse({ success: false, error: "Nope" })
      )
    );
    const challengeFile = ChallengeFileFactory(
      {} as SubplebbitChallengeSetting
    );

    const result = await challengeFile.getChallenge(
      { options: {} } as SubplebbitChallengeSetting,
      request,
      0
    );

    if (!("verify" in result)) {
      throw new Error("Expected a challenge response");
    }

    const verifyResult = await result.verify("token");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(verifyResult).toEqual({ success: false, error: "Nope" });
  });

  it("rejects by IP risk policy when configured", async () => {
    stubFetch(
      createResponse(createEvaluateResponse({ riskScore: 0.5 })),
      createResponse(createVerifyResponse({ ipRisk: 0.7 }))
    );
    const challengeFile = ChallengeFileFactory(
      {} as SubplebbitChallengeSetting
    );

    const result = await challengeFile.getChallenge(
      { options: { maxIpRisk: "0.4" } } as SubplebbitChallengeSetting,
      request,
      0
    );

    if (!("verify" in result)) {
      throw new Error("Expected a challenge response");
    }

    const verifyResult = await result.verify("token");
    expect(verifyResult).toEqual({
      success: false,
      error: "Rejected by IP risk policy (ipRisk 0.70).",
    });
  });

  it("rejects by country blacklist when configured", async () => {
    stubFetch(
      createResponse(createEvaluateResponse({ riskScore: 0.5 })),
      createResponse(createVerifyResponse({ ipAddressCountry: "us" }))
    );
    const challengeFile = ChallengeFileFactory(
      {} as SubplebbitChallengeSetting
    );

    const result = await challengeFile.getChallenge(
      { options: { countryBlacklist: "us, ca" } } as SubplebbitChallengeSetting,
      request,
      0
    );

    if (!("verify" in result)) {
      throw new Error("Expected a challenge response");
    }

    const verifyResult = await result.verify("token");
    expect(verifyResult).toEqual({
      success: false,
      error: "Rejected by country policy (US).",
    });
  });

  it.each([
    [
      "vpn",
      { blockVpn: "true" },
      "Rejected by IP policy (VPN).",
    ],
    [
      "proxy",
      { blockProxy: "true" },
      "Rejected by IP policy (proxy).",
    ],
    ["tor", { blockTor: "true" }, "Rejected by IP policy (Tor)."],
    [
      "datacenter",
      { blockDatacenter: "true" },
      "Rejected by IP policy (datacenter).",
    ],
  ])(
    "rejects by ipTypeEstimation '%s' when configured",
    async (ipType, options, expected) => {
      stubFetch(
        createResponse(createEvaluateResponse({ riskScore: 0.5 })),
        createResponse(createVerifyResponse({ ipTypeEstimation: ipType }))
      );
      const challengeFile = ChallengeFileFactory(
        {} as SubplebbitChallengeSetting
      );

      const result = await challengeFile.getChallenge(
        { options } as SubplebbitChallengeSetting,
        request,
        0
      );

      if (!("verify" in result)) {
        throw new Error("Expected a challenge response");
      }

      const verifyResult = await result.verify("token");
      expect(verifyResult).toEqual({ success: false, error: expected });
    }
  );

  it("accepts verification when no post-challenge policy triggers", async () => {
    stubFetch(
      createResponse(createEvaluateResponse({ riskScore: 0.5 })),
      createResponse(
        createVerifyResponse({
          ipRisk: 0.2,
          ipAddressCountry: "US",
          ipTypeEstimation: "vpn",
        })
      )
    );
    const challengeFile = ChallengeFileFactory(
      {} as SubplebbitChallengeSetting
    );

    const result = await challengeFile.getChallenge(
      { options: {} } as SubplebbitChallengeSetting,
      request,
      0
    );

    if (!("verify" in result)) {
      throw new Error("Expected a challenge response");
    }

    const verifyResult = await result.verify("token");
    expect(verifyResult).toEqual({ success: true });
  });

  it("normalizes serverUrl before calling the API", async () => {
    const fetchMock = stubFetch(
      createResponse(createEvaluateResponse({ riskScore: 0.1 }))
    );
    const challengeFile = ChallengeFileFactory(
      {} as SubplebbitChallengeSetting
    );

    await challengeFile.getChallenge(
      { options: { serverUrl: "https://example.com/api///" } } as SubplebbitChallengeSetting,
      request,
      0
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/api/evaluate",
      expect.any(Object)
    );
  });

  it("throws on invalid evaluate responses", async () => {
    stubFetch(
      createResponse(
        createEvaluateResponse({ riskScore: 2 }) as unknown as EvaluateResponse
      )
    );
    const challengeFile = ChallengeFileFactory(
      {} as SubplebbitChallengeSetting
    );

    await expect(
      challengeFile.getChallenge(
        { options: {} } as SubplebbitChallengeSetting,
        request,
        0
      )
    ).rejects.toThrow(/Invalid evaluate response/i);
  });

  it("throws on invalid verify responses", async () => {
    stubFetch(
      createResponse(createEvaluateResponse({ riskScore: 0.5 })),
      createResponse({})
    );
    const challengeFile = ChallengeFileFactory(
      {} as SubplebbitChallengeSetting
    );

    const result = await challengeFile.getChallenge(
      { options: {} } as SubplebbitChallengeSetting,
      request,
      0
    );

    if (!("verify" in result)) {
      throw new Error("Expected a challenge response");
    }

    await expect(result.verify("token")).rejects.toThrow(
      /Invalid verify response/i
    );
  });

  it("throws on server errors with JSON details", async () => {
    stubFetch(
      createResponse({ error: "boom" }, { ok: false, status: 500 })
    );
    const challengeFile = ChallengeFileFactory(
      {} as SubplebbitChallengeSetting
    );

    await expect(
      challengeFile.getChallenge(
        { options: {} } as SubplebbitChallengeSetting,
        request,
        0
      )
    ).rejects.toThrow(/Spam detection server error \(500\).*boom/i);
  });

  it("throws when the server returns invalid JSON", async () => {
    stubFetch(
      createResponse(undefined, { ok: true, jsonThrows: true })
    );
    const challengeFile = ChallengeFileFactory(
      {} as SubplebbitChallengeSetting
    );

    await expect(
      challengeFile.getChallenge(
        { options: {} } as SubplebbitChallengeSetting,
        request,
        0
      )
    ).rejects.toThrow(/Invalid JSON response/i);
  });
});
