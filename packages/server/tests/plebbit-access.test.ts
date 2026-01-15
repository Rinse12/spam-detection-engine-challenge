import { afterEach, describe, expect, it, vi } from "vitest";
import { createServer } from "../src/index.js";
import { resetPlebbitLoaderForTest, setPlebbitLoaderForTest } from "../src/subplebbit-resolver.js";

afterEach(() => {
    resetPlebbitLoaderForTest();
});

describe("plebbit instance access", () => {
    it("exposes a shared plebbit instance on the fastify server", async () => {
        const destroy = vi.fn().mockResolvedValue(undefined);
        const instance = { destroy, getSubplebbit: vi.fn() };
        setPlebbitLoaderForTest(async () => instance);

        const server = await createServer({
            port: 0,
            logging: false,
            databasePath: ":memory:"
        });

        await server.fastify.ready();

        const plebbit = await server.fastify.getPlebbitInstance();
        expect(plebbit).toBe(instance);

        await server.stop();
        expect(destroy).toHaveBeenCalledTimes(1);
    });
});
