import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveSubplebbitPublicKey, resetPlebbitLoaderForTest } from "../src/subplebbit-resolver.js";

afterEach(() => {
    resetPlebbitLoaderForTest();
    vi.useRealTimers();
});

describe("subplebbit resolver cache", () => {
    it("caches subplebbit public keys for 12 hours", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

        const getSubplebbit = vi.fn().mockResolvedValue({ signature: { publicKey: "pk-1" } });
        const mockPlebbit = { getSubplebbit } as never;

        const first = await resolveSubplebbitPublicKey("sub.eth", mockPlebbit);
        expect(first).toBe("pk-1");
        expect(getSubplebbit).toHaveBeenCalledTimes(1);

        const second = await resolveSubplebbitPublicKey("sub.eth", mockPlebbit);
        expect(second).toBe("pk-1");
        expect(getSubplebbit).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(11 * 60 * 60 * 1000);
        const third = await resolveSubplebbitPublicKey("sub.eth", mockPlebbit);
        expect(third).toBe("pk-1");
        expect(getSubplebbit).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(60 * 60 * 1000 + 1);
        const fourth = await resolveSubplebbitPublicKey("sub.eth", mockPlebbit);
        expect(fourth).toBe("pk-1");
        expect(getSubplebbit).toHaveBeenCalledTimes(2);
    });

    it("does not cache missing public keys", async () => {
        const getSubplebbit = vi
            .fn()
            .mockResolvedValueOnce({ signature: {} })
            .mockResolvedValueOnce({ signature: { publicKey: "pk-2" } });
        const mockPlebbit = { getSubplebbit } as never;

        await expect(resolveSubplebbitPublicKey("sub.eth", mockPlebbit)).rejects.toThrow("Subplebbit signature public key is unavailable");
        expect(getSubplebbit).toHaveBeenCalledTimes(1);

        const result = await resolveSubplebbitPublicKey("sub.eth", mockPlebbit);
        expect(result).toBe("pk-2");
        expect(getSubplebbit).toHaveBeenCalledTimes(2);
    });
});
