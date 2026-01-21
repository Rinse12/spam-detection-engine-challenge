import { getPlebbitAddressFromPublicKey } from "@plebbit/plebbit-js/dist/node/signer/util.js";
import { isStringDomain } from "@plebbit/plebbit-js/dist/node/util.js";
import type Plebbit from "@plebbit/plebbit-js";
import type { ChainTicker } from "@plebbit/plebbit-js/dist/node/types.js";

type PlebbitInstance = Awaited<ReturnType<typeof Plebbit>>;

// NFT ABI for ownerOf function
const nftAbi = [
    {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "ownerOf",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    }
] as const;

type WalletData = {
    address: string;
    timestamp: number;
    signature: {
        signature: string;
        type: string;
    };
};

type AvatarData = {
    chainTicker: string;
    address: string;
    id: string;
    timestamp: number;
    signature: {
        signature: string;
        type: string;
    };
};

type VerificationResult = { valid: true } | { valid: false; reason: string };

/**
 * Verify a single wallet signature.
 * For domain wallet addresses, also verifies the plebbit-author-address TXT record matches the publication signer.
 */
export async function verifyAuthorWalletSignature({
    wallet,
    chainTicker,
    authorAddress,
    publicationSignaturePublicKey,
    plebbit
}: {
    wallet: WalletData;
    chainTicker: string;
    authorAddress: string;
    publicationSignaturePublicKey: string;
    plebbit: PlebbitInstance;
}): Promise<VerificationResult> {
    // Check if chain provider is available
    const chainProvider = plebbit.chainProviders[chainTicker as ChainTicker];
    if (!chainProvider) {
        return { valid: false, reason: `No chain provider configured for chain '${chainTicker}'` };
    }

    // For domain wallet addresses (e.g., ENS), verify plebbit-author-address matches
    if (isStringDomain(wallet.address)) {
        const resolvedWalletAddress = await plebbit.resolveAuthorAddress({ address: wallet.address });
        const publicationSignatureAddress = await getPlebbitAddressFromPublicKey(publicationSignaturePublicKey);

        if (resolvedWalletAddress !== publicationSignatureAddress) {
            return {
                valid: false,
                reason: `Wallet domain '${wallet.address}' plebbit-author-address resolves to '${resolvedWalletAddress}' but should resolve to '${publicationSignatureAddress}'`
            };
        }
        // Domain verification passed, no need to verify EIP-191 signature for domains
        return { valid: true };
    }

    // For regular addresses, verify EIP-191 signature
    // Get viem client - always use 'eth' chain for signature verification
    const viemClient = plebbit._domainResolver._createViemClientIfNeeded(
        "eth",
        plebbit.chainProviders["eth"]?.urls[0] || chainProvider.urls[0]
    );

    // Build message to verify (property order matters!)
    const messageToBeSigned: Record<string, string | number> = {};
    messageToBeSigned["domainSeparator"] = "plebbit-author-wallet";
    messageToBeSigned["authorAddress"] = authorAddress;
    messageToBeSigned["timestamp"] = wallet.timestamp;

    try {
        const valid = await viemClient.verifyMessage({
            address: wallet.address as `0x${string}`,
            message: JSON.stringify(messageToBeSigned),
            signature: wallet.signature.signature as `0x${string}`
        });

        if (!valid) {
            return { valid: false, reason: `Invalid signature for wallet '${wallet.address}'` };
        }

        return { valid: true };
    } catch (error) {
        return {
            valid: false,
            reason: `Failed to verify wallet signature: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Verify all wallets in author.wallets
 */
export async function verifyAuthorWallets({
    wallets,
    authorAddress,
    publicationSignaturePublicKey,
    plebbit
}: {
    wallets: Record<string, WalletData> | undefined;
    authorAddress: string;
    publicationSignaturePublicKey: string;
    plebbit: PlebbitInstance;
}): Promise<VerificationResult> {
    if (!wallets || Object.keys(wallets).length === 0) {
        return { valid: true }; // No wallets to verify
    }

    for (const [chainTicker, wallet] of Object.entries(wallets)) {
        const result = await verifyAuthorWalletSignature({
            wallet,
            chainTicker,
            authorAddress,
            publicationSignaturePublicKey,
            plebbit
        });

        if (!result.valid) {
            return result;
        }
    }

    return { valid: true };
}

/**
 * Verify avatar (NFT) signature.
 * Verifies that the signature was created by the current NFT owner.
 */
export async function verifyAuthorAvatarSignature({
    avatar,
    authorAddress,
    plebbit
}: {
    avatar: AvatarData | undefined;
    authorAddress: string;
    plebbit: PlebbitInstance;
}): Promise<VerificationResult> {
    if (!avatar) {
        return { valid: true }; // No avatar to verify
    }

    // Check if chain provider is available for the NFT's chain
    const chainProvider = plebbit.chainProviders[avatar.chainTicker as ChainTicker];
    if (!chainProvider) {
        return { valid: false, reason: `No chain provider configured for avatar chain '${avatar.chainTicker}'` };
    }

    const viemClient = plebbit._domainResolver._createViemClientIfNeeded(avatar.chainTicker as ChainTicker, chainProvider.urls[0]);

    // Get current NFT owner
    let currentOwner: `0x${string}`;
    try {
        currentOwner = (await viemClient.readContract({
            abi: nftAbi,
            address: avatar.address as `0x${string}`,
            functionName: "ownerOf",
            args: [BigInt(avatar.id)]
        })) as `0x${string}`;
    } catch (error) {
        return {
            valid: false,
            reason: `Failed to read NFT owner: ${error instanceof Error ? error.message : String(error)}`
        };
    }

    // Build message to verify (property order matters!)
    const messageToBeSigned: Record<string, string | number> = {};
    messageToBeSigned["domainSeparator"] = "plebbit-author-avatar";
    messageToBeSigned["authorAddress"] = authorAddress;
    messageToBeSigned["timestamp"] = avatar.timestamp;
    messageToBeSigned["tokenAddress"] = avatar.address;
    messageToBeSigned["tokenId"] = String(avatar.id); // Must be string type

    try {
        const valid = await viemClient.verifyMessage({
            address: currentOwner,
            message: JSON.stringify(messageToBeSigned),
            signature: avatar.signature.signature as `0x${string}`
        });

        if (!valid) {
            return {
                valid: false,
                reason: `Invalid avatar signature - signer is not the current NFT owner`
            };
        }

        return { valid: true };
    } catch (error) {
        return {
            valid: false,
            reason: `Failed to verify avatar signature: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
