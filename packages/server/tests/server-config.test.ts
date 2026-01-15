import { describe, expect, it } from "vitest";
import { createServer, type ServerConfig } from "../src/index.js";

describe("createServer config", () => {
    it("requires databasePath", async () => {
        await expect(createServer({} as ServerConfig)).rejects.toThrow("databasePath is required");
    });
});
