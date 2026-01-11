import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabase } from "../src/db/index.js";
import {
  DEFAULT_TTL_SECONDS,
  refreshIpIntelIfNeeded,
} from "../src/ip-intel/index.js";

describe("IP intelligence", () => {
  let db: ReturnType<typeof createDatabase>;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    db = createDatabase(":memory:");
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    db.close();
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("stores ipinfo results and updates intelUpdatedAt", async () => {
    db.upsertIpRecord({
      ipAddress: "1.1.1.1",
      author: "author",
      challengeId: "challenge",
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          country: "DE",
          privacy: { vpn: true, proxy: false, tor: true, hosting: false },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await refreshIpIntelIfNeeded({
      db,
      ipAddress: "1.1.1.1",
      author: "author",
      token: "test-token",
      now: 1000,
      ttlSeconds: DEFAULT_TTL_SECONDS,
    });

    const record = db.getIpRecordByIpAndAuthor("1.1.1.1", "author");
    expect(record?.countryCode).toBe("DE");
    expect(record?.isVpn).toBe(1);
    expect(record?.isProxy).toBe(0);
    expect(record?.isTor).toBe(1);
    expect(record?.isDatacenter).toBe(0);
    expect(record?.intelUpdatedAt).toBe(1000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("https://ipinfo.io/1.1.1.1/json");
    expect(url).toContain("token=test-token");
  });

  it("skips lookup when cached", async () => {
    db.upsertIpRecord({
      ipAddress: "2.2.2.2",
      author: "author",
      challengeId: "challenge",
      intelUpdatedAt: 1000,
    });

    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await refreshIpIntelIfNeeded({
      db,
      ipAddress: "2.2.2.2",
      author: "author",
      token: "test-token",
      now: 1060,
      ttlSeconds: DEFAULT_TTL_SECONDS,
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
