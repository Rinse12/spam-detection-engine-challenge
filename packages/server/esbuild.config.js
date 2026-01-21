import * as esbuild from "esbuild";

await esbuild.build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outfile: "dist/index.js",
    format: "esm",
    platform: "node",
    target: "node22",
    sourcemap: true,
    external: [
        "@plebbit/plebbit-js",
        "better-sqlite3",
        "fastify",
        "pino-pretty",
        "arctic",
        "jose",
        "cborg",
        "uint8arrays",
        "@noble/ed25519",
        "zod"
    ]
});

console.log("Build complete");
