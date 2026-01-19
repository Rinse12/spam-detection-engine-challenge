import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabase } from "../src/db/index.js";
import { refreshIpIntelIfNeeded } from "../src/ip-intel/index.js";

describe("IP intelligence", () => {
    let db: ReturnType<typeof createDatabase>;
    let originalFetch: typeof fetch;
    const subplebbitPublicKey = "test-public-key";

    beforeEach(() => {
        db = createDatabase(":memory:");
        originalFetch = globalThis.fetch;
    });

    afterEach(() => {
        db.close();
        globalThis.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it("stores ipinfo results and updates timestamp", async () => {
        // First create a challenge session
        db.insertChallengeSession({
            sessionId: "challenge",
            subplebbitPublicKey,
            expiresAt: Math.floor(Date.now() / 1000) + 3600
        });

        // Then create an IP record
        const now = Math.floor(Date.now() / 1000);
        db.insertIpRecord({
            sessionId: "challenge",
            ipAddress: "1.1.1.1",
            timestamp: now
        });

        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    country: "DE",
                    privacy: { vpn: true, proxy: false, tor: true, hosting: false }
                }),
                { status: 200, headers: { "content-type": "application/json" } }
            )
        );
        globalThis.fetch = fetchMock as unknown as typeof fetch;

        await refreshIpIntelIfNeeded({
            db,
            sessionId: "challenge",
            token: "test-token"
        });

        const record = db.getIpRecordBySessionId("challenge");
        expect(record?.countryCode).toBe("DE");
        expect(record?.isVpn).toBe(1);
        expect(record?.isProxy).toBe(0);
        expect(record?.isTor).toBe(1);
        expect(record?.isDatacenter).toBe(0);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const url = String(fetchMock.mock.calls[0]?.[0]);
        expect(url).toContain("https://ipinfo.io/1.1.1.1/json");
        expect(url).toContain("token=test-token");
    });

    it("skips lookup when intel data already exists", async () => {
        // First create a challenge session
        db.insertChallengeSession({
            sessionId: "challenge2",
            subplebbitPublicKey,
            expiresAt: Math.floor(Date.now() / 1000) + 3600
        });

        // Create an IP record with intel data already populated
        const now = Math.floor(Date.now() / 1000);
        db.insertIpRecord({
            sessionId: "challenge2",
            ipAddress: "2.2.2.2",
            isVpn: false,
            timestamp: now
        });

        const fetchMock = vi.fn();
        globalThis.fetch = fetchMock as unknown as typeof fetch;

        await refreshIpIntelIfNeeded({
            db,
            sessionId: "challenge2",
            token: "test-token"
        });

        // Should not call fetch because intel data already exists
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
