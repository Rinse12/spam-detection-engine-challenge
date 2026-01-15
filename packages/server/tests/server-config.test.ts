import { describe, expect, it } from "vitest";
import { createServer, type ServerConfig } from "../src/index.js";

describe("createServer config", () => {
    it("requires databasePath", () => {
        expect(() => createServer({} as ServerConfig)).toThrow("databasePath is required");
    });
});
