/**
 * Queue for controlling concurrent page fetches.
 * Limits to max 10 concurrent fetches to avoid overwhelming IPFS.
 */

import { DEFAULT_INDEXER_CONFIG } from "./types.js";

interface QueuedTask<T> {
    task: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
}

/**
 * A simple queue that limits concurrent async operations.
 */
export class PageQueue {
    private readonly maxConcurrent: number;
    private runningCount = 0;
    private readonly queue: QueuedTask<unknown>[] = [];

    constructor(maxConcurrent: number = DEFAULT_INDEXER_CONFIG.maxConcurrentPageFetches) {
        this.maxConcurrent = maxConcurrent;
    }

    /**
     * Add a task to the queue.
     * The task will be executed when a slot becomes available.
     *
     * @param task - Async function to execute
     * @returns Promise that resolves with the task result
     */
    async add<T>(task: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push({
                task: task as () => Promise<unknown>,
                resolve: resolve as (value: unknown) => void,
                reject
            });
            this.processNext();
        });
    }

    /**
     * Process the next task in the queue if a slot is available.
     */
    private processNext(): void {
        if (this.runningCount >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }

        const item = this.queue.shift();
        if (!item) {
            return;
        }

        this.runningCount++;

        item.task()
            .then((result) => {
                item.resolve(result);
            })
            .catch((error) => {
                item.reject(error instanceof Error ? error : new Error(String(error)));
            })
            .finally(() => {
                this.runningCount--;
                this.processNext();
            });
    }

    /**
     * Get the number of currently running tasks.
     */
    get running(): number {
        return this.runningCount;
    }

    /**
     * Get the number of tasks waiting in the queue.
     */
    get pending(): number {
        return this.queue.length;
    }

    /**
     * Wait for all queued and running tasks to complete.
     */
    async drain(): Promise<void> {
        while (this.runningCount > 0 || this.queue.length > 0) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    /**
     * Clear all pending tasks (does not cancel running tasks).
     */
    clear(): void {
        for (const item of this.queue) {
            item.reject(new Error("Queue cleared"));
        }
        this.queue.length = 0;
    }
}

// Singleton page queue instance
let pageQueueInstance: PageQueue | null = null;

/**
 * Get the shared page queue instance.
 */
export function getPageQueue(): PageQueue {
    if (!pageQueueInstance) {
        pageQueueInstance = new PageQueue();
    }
    return pageQueueInstance;
}

/**
 * Reset the page queue (for testing).
 */
export function resetPageQueue(): void {
    if (pageQueueInstance) {
        pageQueueInstance.clear();
    }
    pageQueueInstance = null;
}
