import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveSubplebbitPublicKey, resetPlebbitLoaderForTest, setPlebbitLoaderForTest } from "../src/subplebbit-resolver.js";

const createMockLoader = (getSubplebbit: ReturnType<typeof vi.fn>) => {
    return async () => ({
        getSubplebbit,
        destroy: vi.fn().mockResolvedValue(undefined)
    });
};

afterEach(() => {
    resetPlebbitLoaderForTest();
    vi.useRealTimers();
});

describe("subplebbit resolver cache", () => {
    it("caches subplebbit public keys for 12 hours", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
        const getSubplebbit = vi.fn().mockResolvedValue({ signature: { publicKey: "pk-1" } });
        setPlebbitLoaderForTest(createMockLoader(getSubplebbit));

        const first = await resolveSubplebbitPublicKey("sub.eth");
        expect(first).toBe("pk-1");
        expect(getSubplebbit).toHaveBeenCalledTimes(1);

        const second = await resolveSubplebbitPublicKey("sub.eth");
        expect(second).toBe("pk-1");
        expect(getSubplebbit).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(11 * 60 * 60 * 1000);
        const third = await resolveSubplebbitPublicKey("sub.eth");
        expect(third).toBe("pk-1");
        expect(getSubplebbit).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(60 * 60 * 1000 + 1);
        const fourth = await resolveSubplebbitPublicKey("sub.eth");
        expect(fourth).toBe("pk-1");
        expect(getSubplebbit).toHaveBeenCalledTimes(2);
    });

    it("does not cache missing public keys", async () => {
        const getSubplebbit = vi
            .fn()
            .mockResolvedValueOnce({ signature: {} })
            .mockResolvedValueOnce({ signature: { publicKey: "pk-2" } });
        setPlebbitLoaderForTest(createMockLoader(getSubplebbit));

        await expect(resolveSubplebbitPublicKey("sub.eth")).rejects.toThrow("Subplebbit signature public key is unavailable");
        expect(getSubplebbit).toHaveBeenCalledTimes(1);

        const result = await resolveSubplebbitPublicKey("sub.eth");
        expect(result).toBe("pk-2");
        expect(getSubplebbit).toHaveBeenCalledTimes(2);
    });
});
