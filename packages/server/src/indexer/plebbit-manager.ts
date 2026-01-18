/**
 * Singleton Plebbit instance manager for the indexer.
 * Shares a single Plebbit instance across all indexer workers.
 */

import Plebbit from "@plebbit/plebbit-js";

export type PlebbitInstance = Awaited<ReturnType<typeof Plebbit>>;

let plebbitInstance: PlebbitInstance | null = null;
let isInitializing = false;
let initPromise: Promise<PlebbitInstance> | null = null;

/**
 * Plebbit options passed to the Plebbit constructor.
 */
export type PlebbitManagerOptions = Parameters<typeof Plebbit>[0];

/**
 * Get or create the shared Plebbit instance.
 * Uses lazy initialization - instance is created on first call.
 *
 * @param options - Optional configuration for Plebbit instance
 * @returns The shared Plebbit instance
 */
export async function getPlebbit(options?: PlebbitManagerOptions): Promise<PlebbitInstance> {
    // Return existing instance if available
    if (plebbitInstance) {
        return plebbitInstance;
    }

    // If already initializing, wait for that promise
    if (isInitializing && initPromise) {
        return initPromise;
    }

    // Start initialization
    isInitializing = true;
    initPromise = createPlebbitInstance(options);

    try {
        plebbitInstance = await initPromise;
        return plebbitInstance;
    } finally {
        isInitializing = false;
        initPromise = null;
    }
}

/**
 * Create a new Plebbit instance with appropriate options.
 */
async function createPlebbitInstance(options?: PlebbitManagerOptions): Promise<PlebbitInstance> {
    const plebbit = await Plebbit(options);

    // Log initialization
    console.log("[PlebbitManager] Plebbit instance created");

    return plebbit;
}

/**
 * Check if a Plebbit instance exists.
 */
export function hasPlebbitInstance(): boolean {
    return plebbitInstance !== null;
}

/**
 * Stop and destroy the Plebbit instance.
 * Should be called during server shutdown.
 */
export async function stopPlebbit(): Promise<void> {
    if (plebbitInstance) {
        console.log("[PlebbitManager] Destroying Plebbit instance...");
        await plebbitInstance.destroy();
        plebbitInstance = null;
        console.log("[PlebbitManager] Plebbit instance destroyed");
    }
}

/**
 * Get the raw Plebbit instance without initialization.
 * Returns null if not initialized.
 * Useful for checking status without triggering creation.
 */
export function getPlebbitInstanceRaw(): PlebbitInstance | null {
    return plebbitInstance;
}
