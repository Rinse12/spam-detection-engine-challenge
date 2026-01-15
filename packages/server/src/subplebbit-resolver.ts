import Plebbit from "@plebbit/plebbit-js";

type PlebbitInstance = Awaited<ReturnType<typeof Plebbit>>;

type PlebbitLoader = () => Promise<PlebbitInstance>;

let plebbitPromise: Promise<PlebbitInstance> | undefined;
// TODO maybe move this to sqlite db
const subplebbitCache = new Map<
  string,
  { publicKey: string; expiresAt: number }
>();

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

const defaultLoader: PlebbitLoader = () => Plebbit();

let plebbitLoader: PlebbitLoader = defaultLoader;

const getPlebbitInstance = () => {
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

export const resolveSubplebbitPublicKey = async (
  subplebbitAddress: string
): Promise<string> => {
  const now = Date.now();
  const cached = subplebbitCache.get(subplebbitAddress);
  if (cached && cached.expiresAt > now) {
    return cached.publicKey;
  }

  const plebbit = await getPlebbitInstance();
  const subplebbit = await plebbit.getSubplebbit(subplebbitAddress);
  const publicKey = subplebbit.signature?.publicKey;
  if (!publicKey) {
    throw new Error("Subplebbit signature public key is unavailable");
  }
  subplebbitCache.set(subplebbitAddress, {
    publicKey,
    expiresAt: now + CACHE_TTL_MS,
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
};

export const resetPlebbitLoaderForTest = (): void => {
  plebbitLoader = defaultLoader;
  plebbitPromise = undefined;
  subplebbitCache.clear();
};
