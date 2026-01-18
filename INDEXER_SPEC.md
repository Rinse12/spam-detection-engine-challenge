# Subplebbit Indexer Implementation Spec

## Overview

Add an active indexer to the spam detection engine that:
1. Indexes subplebbits and their comments/posts
2. Follows `author.previousCommentCid` chains to discover new subs
3. Tracks modQueue to see which authors get accepted/rejected
4. Detects bans/removals by monitoring CommentUpdate availability
5. Provides network-wide author reputation data for risk scoring

## Architecture

- **Single process** - Indexer runs as background workers within the Fastify server
- **Shared plebbit-js instance** - All workers share one Plebbit instance
- **Reactive updates** - React to `subplebbit.update()` events instead of hourly scans
- **Smart caching** - Skip fetching if `updatedAt`/`pageCids.new` unchanged
- **Queue-based page loading** - Max 10 concurrent page fetches

## Key Concepts

### CommentIpfs vs CommentUpdate

**CommentIpfs** (immutable, from `comment.raw.comment`):
- `content`, `title`, `link`, `timestamp`, `parentCid`, `depth`
- `author` - full author object including `author.address`, `author.previousCommentCid`
- `signature` - includes `signature.publicKey` (author identity)
- `subplebbitAddress`, `protocolVersion`

**CommentUpdate** (mutable, from `comment.raw.commentUpdate`):
- `upvoteCount`, `downvoteCount`, `replyCount`
- `removed`, `deleted`, `pinned`, `locked`, `approved`
- `author` - ONLY contains `author.subplebbit` data (karma, bans, flair), NOT `author.address`
- `signature` - from the subplebbit, not needed to store
- `updatedAt` - for change detection

**Key insight**: If CommentIpfs loads but CommentUpdate doesn't, the comment was likely purged/banned.

### Identity Tracking

- Use `signature.publicKey` (Ed25519) as canonical author identity
- `author.address` can be a domain and is not cryptographically verified
- Query via `json_extract(signature, '$.publicKey')`

## Database Schema

Add these tables to `packages/server/src/db/schema.ts`:

```sql
-- Tracked subplebbits
CREATE TABLE indexed_subplebbits (
    address TEXT PRIMARY KEY,
    publicKey TEXT,
    title TEXT,
    discoveredVia TEXT NOT NULL,  -- 'evaluate_api' | 'previous_comment_cid' | 'manual'
    discoveredAt INTEGER NOT NULL,
    indexingEnabled INTEGER DEFAULT 1,
    lastPostsPageCidNew TEXT,        -- To detect changes (pageCids.new)
    lastSubplebbitUpdatedAt INTEGER, -- subplebbit.updatedAt - skip if unchanged
    consecutiveErrors INTEGER DEFAULT 0,
    lastError TEXT
);

CREATE INDEX idx_indexed_subplebbits_enabled ON indexed_subplebbits(indexingEnabled);

-- CommentIpfs data (immutable, from comment.raw.comment)
CREATE TABLE indexed_comments_ipfs (
    cid TEXT PRIMARY KEY,
    subplebbitAddress TEXT NOT NULL,
    author TEXT NOT NULL,                  -- JSON: full author object
    signature TEXT NOT NULL,               -- JSON: full signature (publicKey inside)
    parentCid TEXT,                        -- null = post, set = reply
    content TEXT,
    title TEXT,
    link TEXT,
    timestamp INTEGER NOT NULL,
    depth INTEGER,                         -- 0 = post, >0 = reply
    protocolVersion TEXT,
    fetchedAt INTEGER NOT NULL,
    FOREIGN KEY (subplebbitAddress) REFERENCES indexed_subplebbits(address)
);

CREATE INDEX idx_comments_ipfs_author_pubkey ON indexed_comments_ipfs(
    (json_extract(signature, '$.publicKey'))
);
CREATE INDEX idx_comments_ipfs_sub ON indexed_comments_ipfs(subplebbitAddress);

-- CommentUpdate data (mutable, from comment.raw.commentUpdate)
-- Note: author only has subplebbit data, NOT author.address
-- Note: signature is from sub, not needed
CREATE TABLE indexed_comments_update (
    cid TEXT PRIMARY KEY,
    author TEXT,                           -- JSON: author.subplebbit data only
    upvoteCount INTEGER,
    downvoteCount INTEGER,
    replyCount INTEGER,
    removed INTEGER,
    deleted INTEGER,
    locked INTEGER,
    pinned INTEGER,
    approved INTEGER,                      -- true = approved, false = disapproved
    updatedAt INTEGER,                     -- for change detection (NULL if never fetched)
    fetchedAt INTEGER,                     -- last successful fetch (NULL if never succeeded)
    lastFetchFailedAt INTEGER,
    fetchFailureCount INTEGER DEFAULT 0,   -- reset to 0 on success
    FOREIGN KEY (cid) REFERENCES indexed_comments_ipfs(cid)
);

CREATE INDEX idx_comments_update_removed ON indexed_comments_update(removed) WHERE removed = 1;
CREATE INDEX idx_comments_update_approved ON indexed_comments_update(approved) WHERE approved IS NOT NULL;

-- ModQueue CommentIpfs (from modQueue page comment.comment)
CREATE TABLE modqueue_comments_ipfs (
    cid TEXT PRIMARY KEY,
    subplebbitAddress TEXT NOT NULL,
    author TEXT NOT NULL,
    signature TEXT NOT NULL,
    parentCid TEXT,
    content TEXT,
    title TEXT,
    link TEXT,
    timestamp INTEGER NOT NULL,
    depth INTEGER,
    protocolVersion TEXT,
    firstSeenAt INTEGER NOT NULL,
    FOREIGN KEY (subplebbitAddress) REFERENCES indexed_subplebbits(address)
);

CREATE INDEX idx_modqueue_ipfs_author ON modqueue_comments_ipfs(
    (json_extract(signature, '$.publicKey'))
);

-- ModQueue CommentUpdate (CommentUpdateForChallengeVerification)
-- Note: signature is from sub, not needed. author only has subplebbit data.
CREATE TABLE modqueue_comments_update (
    cid TEXT PRIMARY KEY,
    author TEXT,                           -- JSON: author.subplebbit data only
    protocolVersion TEXT,
    number INTEGER,
    postNumber INTEGER,
    pendingApproval INTEGER NOT NULL,      -- always 1 while in modQueue
    lastSeenAt INTEGER NOT NULL,
    resolved INTEGER DEFAULT 0,
    resolvedAt INTEGER,
    accepted INTEGER,                      -- true if full CommentUpdate exists after resolution
    FOREIGN KEY (cid) REFERENCES modqueue_comments_ipfs(cid)
);

CREATE INDEX idx_modqueue_update_pending ON modqueue_comments_update(resolved) WHERE resolved = 0;
```

## File Structure

```
packages/server/src/indexer/
├── index.ts                        # Indexer lifecycle (start/stop)
├── plebbit-manager.ts              # Shared Plebbit instance singleton
├── page-queue.ts                   # Queue for page loading (max 10 concurrent)
├── types.ts                        # Indexer-specific types
├── db/
│   └── queries.ts                  # Indexer-specific DB queries
└── workers/
    ├── subplebbit-indexer.ts       # Subscribe to subs, react to updates
    ├── comment-fetcher.ts          # Fetch CommentIpfs + CommentUpdate
    ├── modqueue-tracker.ts         # Monitor pending approvals
    └── previous-cid-crawler.ts     # Follow author chains (60s timeout)

packages/server/src/risk-score/factors/
├── network-ban-history.ts          # Ban count across subs
├── modqueue-rejection-rate.ts      # Rejection rate
└── network-removal-rate.ts         # Removal + failed update rate
```

## Implementation Steps

### Step 1: Database Schema
Add new tables to `packages/server/src/db/schema.ts`.

### Step 2: Indexer Module Structure
Create the directory structure and basic files.

### Step 3: Plebbit Manager
Implement singleton Plebbit instance in `plebbit-manager.ts`:
```typescript
let plebbitInstance: Plebbit | null = null;

export async function getPlebbit(): Promise<Plebbit> {
    if (!plebbitInstance) {
        plebbitInstance = await Plebbit({ /* options */ });
    }
    return plebbitInstance;
}

export async function stopPlebbit(): Promise<void> {
    if (plebbitInstance) {
        await plebbitInstance.destroy();
        plebbitInstance = null;
    }
}
```

### Step 4: Page Queue
Implement queue with max 10 concurrent fetches in `page-queue.ts`.

### Step 5: Subplebbit Indexer
In `subplebbit-indexer.ts`:
- Get enabled subs from DB
- Call `plebbit.getSubplebbit(address)` and subscribe with `sub.on('update')`
- On update, check if `sub.updatedAt` or `sub.posts.pageCids.new` changed
- If changed, queue page fetches

```typescript
sub.on('update', () => {
    if (sub.updatedAt === lastSubplebbitUpdatedAt) return;
    if (sub.posts.pageCids.new === lastPostsPageCidNew) return;
    queuePageFetch(sub.posts.pageCids.new);
});
```

### Step 6: Comment Fetcher
In `comment-fetcher.ts`, follow the pattern from plebbit-js `loadAllUniquePostsUnderSubplebbit`:

```typescript
// Handle edge case: pageCids = {} but pages has preloaded data
if (Object.keys(sub.posts.pageCids).length === 0 && Object.keys(sub.posts.pages).length > 0) {
    // Use preloaded pages (e.g., sub.posts.pages.hot)
} else {
    // Use sub.posts.pageCids.new to traverse (single sort is enough)
}
```

For each comment:
- Store `comment.raw.comment` (CommentIpfs) in `indexed_comments_ipfs`
- If `comment.raw.commentUpdate` exists, store in `indexed_comments_update`
- If CommentUpdate unavailable, increment `fetchFailureCount`

### Step 7: ModQueue Tracker
In `modqueue-tracker.ts`:
- Iterate through `subplebbit.modQueue.pageCids`
- Store `comment.comment` in `modqueue_comments_ipfs`
- Store `comment.commentUpdate` in `modqueue_comments_update`
- On subsequent updates, check if CIDs disappeared from modQueue:
  - Try fetching full CommentUpdate
  - If found → accepted
  - If not found → rejected

### Step 8: Previous CID Crawler
In `previous-cid-crawler.ts`:
- When storing a comment, check `json_extract(author, '$.previousCommentCid')`
- Use `plebbit.createComment({ cid })` then `await comment.update()` with 60s timeout
- Only consider valid if CommentUpdate loads successfully
- If comment belongs to new sub, add to `indexed_subplebbits`
- Limit depth (e.g., max 10 hops)

```typescript
async function crawlPreviousCid(cid: string, plebbit: Plebbit) {
    const comment = await plebbit.createComment({ cid });
    try {
        await comment.update();
        await Promise.race([
            new Promise(resolve => comment.on('update', resolve)),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 60000))
        ]);
        return {
            ipfs: comment.raw.comment,
            update: comment.raw.commentUpdate,
            valid: comment.raw.commentUpdate?.updatedAt !== undefined
        };
    } catch (e) {
        return { ipfs: comment.raw?.comment, update: null, valid: false };
    }
}
```

### Step 9: Modify /evaluate Endpoint
In `packages/server/src/routes/evaluate.ts`, insert into `indexed_subplebbits` when a sub calls the API:

```typescript
db.prepare(`
    INSERT INTO indexed_subplebbits (address, discoveredVia, discoveredAt)
    VALUES (?, 'evaluate_api', ?)
    ON CONFLICT(address) DO NOTHING
`).run(subplebbitAddress, Math.floor(Date.now() / 1000));
```

### Step 10: Initialize on Server Startup
In `packages/server/src/index.ts`, start the indexer when server starts.

### Step 11: Risk Scoring Factors
Add new factors that query the indexed data:

```sql
-- Ban count for an author
SELECT COUNT(DISTINCT i.subplebbitAddress) as banCount
FROM indexed_comments_update u
JOIN indexed_comments_ipfs i ON u.cid = i.cid
WHERE json_extract(i.signature, '$.publicKey') = ?
  AND json_extract(u.author, '$.subplebbit.banExpiresAt') IS NOT NULL;

-- Removal count
SELECT COUNT(*) as removalCount
FROM indexed_comments_update u
JOIN indexed_comments_ipfs i ON u.cid = i.cid
WHERE json_extract(i.signature, '$.publicKey') = ?
  AND u.removed = 1;

-- Disapproval count
SELECT COUNT(*) as disapprovalCount
FROM indexed_comments_update u
JOIN indexed_comments_ipfs i ON u.cid = i.cid
WHERE json_extract(i.signature, '$.publicKey') = ?
  AND u.approved = 0;

-- Unfetchable count (likely purged)
SELECT COUNT(*) as unfetchableCount
FROM indexed_comments_update u
JOIN indexed_comments_ipfs i ON u.cid = i.cid
WHERE json_extract(i.signature, '$.publicKey') = ?
  AND u.fetchFailureCount > 0
  AND (u.fetchedAt IS NULL OR u.lastFetchFailedAt > u.fetchedAt);
```

### Step 12: Update Risk Scoring
- Add new weight entries in `types.ts`
- Import and call new factors in `index.ts`
- Update `RISK_SCORING.md`

## Reference: plebbit-js Patterns

See `/home/user2/Nextcloud/projects/plebbit/plebbit-js/src/test/test-util.ts`:
- `loadAllUniquePostsUnderSubplebbit` - how to load all posts
- `loadAllUniqueCommentsUnderCommentInstance` - how to load all replies
- `loadAllPages` - pagination helper

## Files to Modify

| File | Change |
|------|--------|
| `packages/server/src/db/schema.ts` | Add 5 new tables |
| `packages/server/src/db/index.ts` | Add indexer queries |
| `packages/server/src/routes/evaluate.ts` | Insert into indexed_subplebbits |
| `packages/server/src/index.ts` | Initialize indexer on startup |
| `packages/server/src/risk-score/types.ts` | Add new weight entries |
| `packages/server/src/risk-score/index.ts` | Import new factors |
| `packages/server/src/risk-score/RISK_SCORING.md` | Document new factors |
