import Plebbit from "@plebbit/plebbit-js";

type PlebbitInstance = Awaited<ReturnType<typeof Plebbit>>;

type PlebbitLoader = () => Promise<PlebbitInstance>;

let plebbitPromise: Promise<PlebbitInstance> | undefined;
// TODO maybe move this to sqlite db
const subplebbitCache = new Map<string, { publicKey: string; expiresAt: number }>();

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

type PlebbitOptions = Parameters<typeof Plebbit>[0];
let plebbitOptions: PlebbitOptions | undefined;
let isTestLoaderActive = false;

const createDefaultLoader = (): PlebbitLoader => () => Plebbit(plebbitOptions);

let plebbitLoader: PlebbitLoader = createDefaultLoader();

export const getPlebbitInstance = (): Promise<PlebbitInstance> => {
    if (!plebbitPromise) {
        plebbitPromise = plebbitLoader();
    }
    return plebbitPromise;
};

export const initPlebbitInstance = (): void => {
    if (!plebbitPromise) {
        plebbitPromise = plebbitLoader();
    }
};

export const resolveSubplebbitPublicKey = async (subplebbitAddress: string, plebbitInstance: PlebbitInstance): Promise<string> => {
    const now = Date.now();
    const cached = subplebbitCache.get(subplebbitAddress);
    if (cached && cached.expiresAt > now) {
        return cached.publicKey;
    }

    const plebbit = plebbitInstance;
    const subplebbit = await plebbit.getSubplebbit({ address: subplebbitAddress });
    const publicKey = subplebbit.signature?.publicKey;
    if (!publicKey) {
        throw new Error("Subplebbit signature public key is unavailable");
    }
    subplebbitCache.set(subplebbitAddress, {
        publicKey,
        expiresAt: now + CACHE_TTL_MS
    });
    return publicKey;
};

export const destroyPlebbitInstance = async (): Promise<void> => {
    if (!plebbitPromise) return;
    const plebbit = await plebbitPromise;
    plebbitPromise = undefined;
    subplebbitCache.clear();
    await plebbit.destroy();
};

export const setPlebbitLoaderForTest = (loader: PlebbitLoader): void => {
    plebbitLoader = loader;
    plebbitPromise = undefined;
    subplebbitCache.clear();
    isTestLoaderActive = true;
};

export const resetPlebbitLoaderForTest = (): void => {
    isTestLoaderActive = false;
    plebbitLoader = createDefaultLoader();
    plebbitPromise = undefined;
    subplebbitCache.clear();
};

/**
 * Set Plebbit options for the resolver.
 * Must be called before initPlebbitInstance() or getPlebbitInstance().
 */
export const setPlebbitOptions = (options: PlebbitOptions | undefined): void => {
    plebbitOptions = options;
    // Only update the loader if not in test mode (test loader takes precedence)
    if (!isTestLoaderActive) {
        plebbitLoader = createDefaultLoader();
    }
};
