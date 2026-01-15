import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
    generateKeyPair,
    exportKeyPair,
    importKeyPair,
    saveKeyPairToFile,
    loadKeyPairFromFile,
    keyPairFileExists,
    createKeyManager
} from "../src/crypto/keys.js";
import { signChallengeToken, verifyChallengeToken, createTokenPayload, TOKEN_EXPIRY_SECONDS } from "../src/crypto/jwt.js";

describe("Key Management", () => {
    describe("generateKeyPair", () => {
        it("should generate a valid Ed25519 keypair", async () => {
            const { privateKey, publicKey } = await generateKeyPair();

            expect(privateKey).toBeDefined();
            expect(publicKey).toBeDefined();
        });
    });

    describe("exportKeyPair / importKeyPair", () => {
        it("should export and import keypair correctly", async () => {
            const original = await generateKeyPair();
            const exported = await exportKeyPair(original.privateKey, original.publicKey);

            expect(exported.privateKey).toBeTruthy();
            expect(exported.publicKey).toBeTruthy();
            expect(exported.createdAt).toBeGreaterThan(0);

            const imported = await importKeyPair(exported);
            expect(imported.privateKey).toBeDefined();
            expect(imported.publicKey).toBeDefined();
        });

        it("should be able to sign and verify after import", async () => {
            const original = await generateKeyPair();
            const exported = await exportKeyPair(original.privateKey, original.publicKey);
            const imported = await importKeyPair(exported);

            const payload = createTokenPayload("test-challenge-123");
            const token = await signChallengeToken(payload, imported.privateKey);
            const verified = await verifyChallengeToken(token, imported.publicKey);

            expect(verified.challengeId).toBe("test-challenge-123");
        });
    });

    describe("file persistence", () => {
        let tempDir: string;
        let keyFilePath: string;

        beforeAll(() => {
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "crypto-test-"));
            keyFilePath = path.join(tempDir, "test-keypair.json");
        });

        afterAll(() => {
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it("should save and load keypair from file", async () => {
            const { privateKey, publicKey } = await generateKeyPair();

            await saveKeyPairToFile(keyFilePath, privateKey, publicKey);
            expect(fs.existsSync(keyFilePath)).toBe(true);

            const loaded = await loadKeyPairFromFile(keyFilePath);
            expect(loaded.privateKey).toBeDefined();
            expect(loaded.publicKey).toBeDefined();
        });

        it("keyPairFileExists should return true for existing file", async () => {
            const existingPath = path.join(tempDir, "existing-keypair.json");
            const { privateKey, publicKey } = await generateKeyPair();
            await saveKeyPairToFile(existingPath, privateKey, publicKey);

            expect(keyPairFileExists(existingPath)).toBe(true);
            expect(keyPairFileExists(path.join(tempDir, "non-existent.json"))).toBe(false);
        });
    });

    describe("createKeyManager", () => {
        let tempDir: string;

        beforeAll(() => {
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "keymanager-test-"));
        });

        afterAll(() => {
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it("should create in-memory keypair when no path provided", async () => {
            const keyManager = await createKeyManager();

            const privateKey = await keyManager.getPrivateKey();
            const publicKey = await keyManager.getPublicKey();

            expect(privateKey).toBeDefined();
            expect(publicKey).toBeDefined();
        });

        it("should generate and persist keypair when path provided", async () => {
            const keyPath = path.join(tempDir, "new-keypair.json");
            expect(fs.existsSync(keyPath)).toBe(false);

            const keyManager = await createKeyManager(keyPath);
            expect(fs.existsSync(keyPath)).toBe(true);

            const privateKey = await keyManager.getPrivateKey();
            const publicKey = await keyManager.getPublicKey();
            expect(privateKey).toBeDefined();
            expect(publicKey).toBeDefined();
        });

        it("should load existing keypair from file", async () => {
            const keyPath = path.join(tempDir, "existing-keypair.json");

            // Create first manager
            const manager1 = await createKeyManager(keyPath);
            const payload1 = createTokenPayload("test-challenge");
            const token = await signChallengeToken(payload1, await manager1.getPrivateKey());

            // Create second manager - should load same keypair
            const manager2 = await createKeyManager(keyPath);
            const verified = await verifyChallengeToken(token, await manager2.getPublicKey());

            expect(verified.challengeId).toBe("test-challenge");
        });
    });
});

describe("JWT Operations", () => {
    let privateKey: Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];
    let publicKey: Awaited<ReturnType<typeof generateKeyPair>>["publicKey"];

    beforeAll(async () => {
        const keypair = await generateKeyPair();
        privateKey = keypair.privateKey;
        publicKey = keypair.publicKey;
    });

    describe("createTokenPayload", () => {
        it("should create payload with correct fields", () => {
            const now = Math.floor(Date.now() / 1000);
            const payload = createTokenPayload("challenge-123");

            expect(payload.challengeId).toBe("challenge-123");
            expect(payload.completedAt).toBeGreaterThanOrEqual(now);
            expect(payload.completedAt).toBeLessThanOrEqual(now + 1);
            expect(payload.expiresAt).toBe(payload.completedAt + TOKEN_EXPIRY_SECONDS);
        });
    });

    describe("signChallengeToken", () => {
        it("should sign a valid JWT token", async () => {
            const payload = createTokenPayload("test-challenge-456");
            const token = await signChallengeToken(payload, privateKey);

            expect(token).toBeTruthy();
            expect(typeof token).toBe("string");
            expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
        });

        it("should include all required claims", async () => {
            const payload = createTokenPayload("test-challenge-789");
            const token = await signChallengeToken(payload, privateKey);

            // Decode payload (middle part of JWT)
            const parts = token.split(".");
            const decodedPayload = JSON.parse(Buffer.from(parts[1], "base64url").toString());

            expect(decodedPayload.challengeId).toBe("test-challenge-789");
            expect(decodedPayload.completedAt).toBe(payload.completedAt);
            expect(decodedPayload.expiresAt).toBe(payload.expiresAt);
            expect(decodedPayload.iat).toBe(payload.completedAt);
            expect(decodedPayload.exp).toBe(payload.expiresAt);
        });
    });

    describe("verifyChallengeToken", () => {
        it("should verify a valid token", async () => {
            const payload = createTokenPayload("verify-test-123");
            const token = await signChallengeToken(payload, privateKey);

            const verified = await verifyChallengeToken(token, publicKey);

            expect(verified.challengeId).toBe("verify-test-123");
            expect(verified.completedAt).toBe(payload.completedAt);
            expect(verified.expiresAt).toBe(payload.expiresAt);
        });

        it("should reject an expired token", async () => {
            const now = Math.floor(Date.now() / 1000);
            const expiredPayload = {
                challengeId: "expired-test",
                completedAt: now - 7200, // 2 hours ago
                expiresAt: now - 3600 // Expired 1 hour ago
            };

            const token = await signChallengeToken(expiredPayload, privateKey);

            await expect(verifyChallengeToken(token, publicKey)).rejects.toThrow();
        });

        it("should reject a token with invalid signature", async () => {
            const payload = createTokenPayload("tamper-test");
            const token = await signChallengeToken(payload, privateKey);

            // Tamper with the signature
            const parts = token.split(".");
            parts[2] = "invalid_signature_here";
            const tamperedToken = parts.join(".");

            await expect(verifyChallengeToken(tamperedToken, publicKey)).rejects.toThrow();
        });

        it("should reject a token signed with different key", async () => {
            const otherKeypair = await generateKeyPair();
            const payload = createTokenPayload("wrong-key-test");
            const token = await signChallengeToken(payload, otherKeypair.privateKey);

            await expect(verifyChallengeToken(token, publicKey)).rejects.toThrow();
        });

        it("should reject malformed token", async () => {
            await expect(verifyChallengeToken("not.a.valid.jwt", publicKey)).rejects.toThrow();
            await expect(verifyChallengeToken("", publicKey)).rejects.toThrow();
            await expect(verifyChallengeToken("random-string", publicKey)).rejects.toThrow();
        });
    });
});
