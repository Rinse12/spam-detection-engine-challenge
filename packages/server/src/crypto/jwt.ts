import * as jose from "jose";

/** Token expiry in seconds (1 hour per README spec) */
export const TOKEN_EXPIRY_SECONDS = 3600;

export interface ChallengeTokenPayload {
    /** The challenge session ID */
    challengeId: string;
    /** Unix timestamp when the challenge was completed */
    completedAt: number;
    /** Unix timestamp when the token expires */
    expiresAt: number;
}

/**
 * Sign a JWT token for a completed challenge.
 *
 * @param payload - The token payload containing challengeId, completedAt, expiresAt
 * @param privateKey - Ed25519 private key for signing
 * @returns Signed JWT string
 */
export async function signChallengeToken(payload: ChallengeTokenPayload, privateKey: jose.KeyLike): Promise<string> {
    const jwt = await new jose.SignJWT({
        challengeId: payload.challengeId,
        completedAt: payload.completedAt,
        expiresAt: payload.expiresAt
    })
        .setProtectedHeader({ alg: "EdDSA", typ: "JWT" })
        .setIssuedAt(payload.completedAt)
        .setExpirationTime(payload.expiresAt)
        .sign(privateKey);

    return jwt;
}

/**
 * Verify a JWT token and extract the payload.
 *
 * @param token - JWT string to verify
 * @param publicKey - Ed25519 public key for verification
 * @returns Verified payload
 * @throws Error if token is invalid, expired, or signature doesn't match
 */
export async function verifyChallengeToken(token: string, publicKey: jose.KeyLike): Promise<ChallengeTokenPayload> {
    const { payload } = await jose.jwtVerify(token, publicKey, {
        algorithms: ["EdDSA"]
    });

    // Validate required fields exist
    if (typeof payload.challengeId !== "string") {
        throw new Error("Invalid token: missing challengeId");
    }
    if (typeof payload.completedAt !== "number") {
        throw new Error("Invalid token: missing completedAt");
    }
    if (typeof payload.expiresAt !== "number") {
        throw new Error("Invalid token: missing expiresAt");
    }

    return {
        challengeId: payload.challengeId,
        completedAt: payload.completedAt,
        expiresAt: payload.expiresAt
    };
}

/**
 * Create a token payload with default expiry.
 *
 * @param challengeId - The challenge session ID
 * @returns Token payload with completedAt set to now and expiresAt set to 1 hour from now
 */
export function createTokenPayload(challengeId: string): ChallengeTokenPayload {
    const now = Math.floor(Date.now() / 1000);
    return {
        challengeId,
        completedAt: now,
        expiresAt: now + TOKEN_EXPIRY_SECONDS
    };
}
