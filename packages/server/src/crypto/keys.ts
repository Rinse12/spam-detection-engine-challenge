import * as jose from "jose";
import * as fs from "fs";
import * as path from "path";

export interface StoredKeyPair {
    privateKey: string; // Base64-encoded JWK
    publicKey: string; // Base64-encoded JWK
    createdAt: number;
}

export interface KeyManager {
    getPrivateKey(): Promise<jose.KeyLike>;
    getPublicKey(): Promise<jose.KeyLike>;
}

/**
 * Generate a new Ed25519 keypair for JWT signing.
 */
export async function generateKeyPair(): Promise<{ privateKey: jose.KeyLike; publicKey: jose.KeyLike }> {
    const { privateKey, publicKey } = await jose.generateKeyPair("EdDSA", { crv: "Ed25519" });
    return { privateKey, publicKey };
}

/**
 * Export keypair to storable format.
 */
export async function exportKeyPair(privateKey: jose.KeyLike, publicKey: jose.KeyLike): Promise<StoredKeyPair> {
    const privateJwk = await jose.exportJWK(privateKey);
    const publicJwk = await jose.exportJWK(publicKey);

    return {
        privateKey: JSON.stringify(privateJwk),
        publicKey: JSON.stringify(publicJwk),
        createdAt: Math.floor(Date.now() / 1000)
    };
}

/**
 * Import keypair from stored format.
 */
export async function importKeyPair(stored: StoredKeyPair): Promise<{ privateKey: jose.KeyLike; publicKey: jose.KeyLike }> {
    const privateJwk = JSON.parse(stored.privateKey);
    const publicJwk = JSON.parse(stored.publicKey);

    const privateKey = (await jose.importJWK(privateJwk, "EdDSA")) as jose.KeyLike;
    const publicKey = (await jose.importJWK(publicJwk, "EdDSA")) as jose.KeyLike;

    return { privateKey, publicKey };
}

/**
 * Save keypair to a JSON file.
 */
export async function saveKeyPairToFile(filePath: string, privateKey: jose.KeyLike, publicKey: jose.KeyLike): Promise<void> {
    const stored = await exportKeyPair(privateKey, publicKey);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(stored, null, 2), "utf-8");
}

/**
 * Load keypair from a JSON file.
 */
export async function loadKeyPairFromFile(filePath: string): Promise<{ privateKey: jose.KeyLike; publicKey: jose.KeyLike }> {
    const content = fs.readFileSync(filePath, "utf-8");
    const stored: StoredKeyPair = JSON.parse(content);
    return importKeyPair(stored);
}

/**
 * Check if a keypair file exists.
 */
export function keyPairFileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}

/**
 * Create a KeyManager that auto-generates or loads a keypair.
 *
 * @param keyPath - Path to store/load the keypair. If undefined, generates in-memory only.
 */
export async function createKeyManager(keyPath?: string): Promise<KeyManager> {
    let privateKey: jose.KeyLike;
    let publicKey: jose.KeyLike;

    if (keyPath && keyPairFileExists(keyPath)) {
        // Load existing keypair
        const loaded = await loadKeyPairFromFile(keyPath);
        privateKey = loaded.privateKey;
        publicKey = loaded.publicKey;
    } else {
        // Generate new keypair
        const generated = await generateKeyPair();
        privateKey = generated.privateKey;
        publicKey = generated.publicKey;

        // Persist if path provided
        if (keyPath) {
            await saveKeyPairToFile(keyPath, privateKey, publicKey);
        }
    }

    return {
        getPrivateKey: async () => privateKey,
        getPublicKey: async () => publicKey
    };
}
