# EasyCommunitySpamBlocker

## Overview

A centralized spam detection service that evaluates publications and provides risk scores to help subplebbits filter spam. Consists of:

1. **HTTP Server** (`@easy-community-spam-blocker/server`) - Risk assessment and challenge server
2. **Challenge Package** (`@easy-community-spam-blocker/challenge`) - npm package for subplebbit integration

**Important:**

- The HTTP server must import and use schemas from `plebbit-js` to validate incoming challenge requests. This ensures type compatibility with `DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor`.
- The HTTP server must verify that the publication in the ChallengeRequest is correctly signed by the author.

## Repository Structure

```
easy-community-spam-blocker/
├── package.json                    # Root workspace config
├── tsconfig.base.json
├── packages/
│   ├── server/                     # HTTP server (Fastify + better-sqlite3)
│   │   ├── src/
│   │   │   ├── index.ts            # Entry point
│   │   │   ├── routes/             # API endpoints
│   │   │   ├── services/           # Risk scoring, rate limiting
│   │   │   ├── challenges/         # CAPTCHA providers (Turnstile, etc.)
│   │   │   ├── db/                 # better-sqlite3 (no ORM)
│   │   │   └── crypto/             # JWT signing
│   │   └── challenge-iframe/       # Static iframe HTML pages
│   ├── challenge/                  # npm package for subplebbits
│   │   └── src/
│   │       └── index.ts            # ChallengeFileFactory
│   └── shared/                     # Shared types
│       └── src/types.ts
```

## API Endpoints

### POST /api/v1/evaluate

Evaluate publication risk. The server tracks author history internally, so no completion tokens are needed.

Requests are signed by the subplebbit signer to prevent abuse (e.g., someone unrelated to the sub querying the engine to doxx users). The server validates the request signature and ensures the signer matches the subplebbit (for domain addresses, the server resolves the subplebbit via `plebbit.getSubplebbit` and compares `subplebbit.signature.publicKey`). Resolved subplebbit public keys are cached in-memory for 12 hours to reduce repeated lookups. The HTTP server initializes a single shared Plebbit instance and only destroys it when the server shuts down.

**Request Format:** `Content-Type: application/cbor`

The request body is CBOR-encoded (not JSON). This preserves `Uint8Array` types during transmission and ensures signature verification works correctly.

**Request:**

```typescript
// The request wraps the DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor from plebbit-js
// subplebbitAddress is required; author.subplebbit is optional (undefined for first-time publishers)
// The signature is created by CBOR-encoding the signed properties, then signing with Ed25519
{
    challengeRequest: DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
    timestamp: number; // Unix timestamp (seconds)
    signature: {
        signature: Uint8Array; // Ed25519 signature of CBOR-encoded signed properties
        publicKey: Uint8Array; // 32-byte Ed25519 public key
        type: "ed25519";
        signedPropertyNames: ["challengeRequest", "timestamp"];
    }
}
```

**Response:**

```typescript
{
  riskScore: number; // 0.0 to 1.0
  explanation?: string; // Human-readable reasoning for the score

  // Pre-generated challenge URL - sub can use this if it decides to challenge
  sessionId: string;
  challengeUrl: string; // Full URL: https://easycommunityspamblocker.com/api/v1/iframe/{sessionId}
  challengeExpiresAt?: number; // Unix timestamp, 1 hour from creation
}
```

The response always includes a pre-generated `challengeUrl`. If the sub decides to challenge based on `riskScore`, it can immediately send the URL to the user without making a second request. If the challenge is not used, the session auto-purges after 1 hour.

### POST /api/v1/challenge/verify

Called by the subplebbit's challenge code to verify that the user completed the iframe challenge. The server tracks challenge completion state internally - no token is passed from the user.

**Request must be signed by the subplebbit** (same signing mechanism as /evaluate), using the same signing key that was used for the evaluate request.

**Request Format:** `Content-Type: application/cbor`

**Request:**

```typescript
{
    sessionId: string; // The sessionId from the /evaluate response
    timestamp: number; // Unix timestamp (seconds)
    signature: {
        signature: Uint8Array; // Ed25519 signature of CBOR-encoded signed properties
        publicKey: Uint8Array; // 32-byte Ed25519 public key
        type: "ed25519";
        signedPropertyNames: ["sessionId", "timestamp"];
    }
}
```

**Response:**

```typescript
{
  success: boolean;
  error?: string;              // If success is false

  // The following fields are returned on success, allowing the challenge
  // code to make additional filtering decisions
  ipRisk?: number;             // 0.0 to 1.0, risk score based on IP analysis
  ipAddressCountry?: string;   // ISO 3166-1 alpha-2 country code (e.g., "US", "RU")
  challengeType?: string;      // What challenge was sent (e.g., "turnstile", "hcaptcha")
  ipTypeEstimation?: string;   // "residential" | "vpn" | "proxy" | "tor" | "datacenter" | "unknown"
}
```

### GET /api/v1/iframe/:sessionId

Serves the iframe challenge page. The server supports multiple challenge providers:

- **CAPTCHA providers**: Cloudflare Turnstile (default), hCaptcha, reCAPTCHA, Yandex SmartCaptcha
- **OAuth providers**: GitHub, Google, Apple, Facebook (Sign-in challenges)

> **Privacy note**: For OAuth providers, the server only verifies successful authentication - it does NOT share account identifiers (username, email) with the subplebbit. For IP-based intelligence, only the country code is shared, never the raw IP address.

When the user completes the challenge:

1. The iframe page receives success from the challenge provider
2. The iframe calls `POST /api/v1/challenge/complete` with the provider's response token
3. The server validates the response with the provider and marks the session as `completed` in the database
4. The iframe displays "Verification complete! You may close this window."
5. The user clicks "done" in their plebbit client (the client provides this button outside the iframe)
6. The client sends a `ChallengeAnswer` with an empty string to the subplebbit
7. The subplebbit's challenge code calls `/api/v1/challenge/verify` to check if the session is completed

### POST /api/v1/challenge/complete

Called by the iframe after the user completes a challenge. Validates the challenge response with the provider and marks the session as completed.

**Request:**

```typescript
{
  sessionId: string;
  challengeResponse: string; // Token from the challenge provider
  challengeType?: string;    // e.g., "turnstile", "hcaptcha", "github", etc.
}
```

**Response:**

```typescript
{
  success: boolean;
  error?: string;  // Error message on failure
}
```

## Challenge Flow (Detailed)

The challenge flow uses **server-side state tracking** - no tokens are passed from the iframe to the user's client. This matches the standard plebbit iframe challenge pattern (used by mintpass and others).

```
┌─────────────────┐       ┌──────────────────┐       ┌────────────────┐
│   Plebbit       │       │ EasySpamBlocker  │       │   Turnstile    │
│   Client        │       │     Server       │       │                │
└────────┬────────┘       └────────┬─────────┘       └───────┬────────┘
         │                         │                          │
         │  1. ChallengeRequest    │                          │
         │  (to subplebbit)        │                          │
         │─────────────────────────>                          │
         │                         │                          │
         │  2. Sub calls /evaluate │                          │
         │                         │                          │
         │  3. riskScore +         │                          │
         │     sessionId +         │                          │
         │     challengeUrl        │                          │
         │<─────────────────────────                          │
         │                         │                          │
         │  4. If challenge needed,│                          │
         │     sub sends           │                          │
         │     challengeUrl to     │                          │
         │     client              │                          │
         │                         │                          │
         │  5. Client loads iframe │                          │
         │─────────────────────────────────────────────────────>
         │                         │                          │
         │  6. User solves CAPTCHA │                          │
         │                         │  (validates with         │
         │                         │   Turnstile API)         │
         │                         │                          │
         │  7. Iframe calls        │                          │
         │     /complete           │                          │
         │     ───────────────────>│                          │
         │                         │                          │
         │  8. Server marks        │                          │
         │     session completed   │                          │
         │                         │                          │
         │  9. Iframe shows        │                          │
         │     "click done"        │                          │
         │<─────────────────────────                          │
         │                         │                          │
         │  10. User clicks "done" │                          │
         │      button in client   │                          │
         │      (outside iframe)   │                          │
         │                         │                          │
         │  11. Client sends       │                          │
         │      ChallengeAnswer    │                          │
         │      with empty string  │                          │
         │─────────────────────────>                          │
         │                         │                          │
         │  12. Sub's verify("")   │                          │
         │      calls /verify      │                          │
         │      with sessionId     │                          │
         │                         │                          │
         │  13. Server checks      │                          │
         │      session.status     │                          │
         │      === "completed"    │                          │
         │                         │                          │
         │  14. success: true +    │                          │
         │      IP intelligence    │                          │
         │<─────────────────────────                          │
         │                         │                          │
         │  15. Sub applies        │                          │
         │      post-challenge     │                          │
         │      filters            │                          │
         │                         │                          │
         │  16. Publication        │                          │
         │      accepted/rejected  │                          │
         └─────────────────────────┘                          │
```

**Key design point:** Plebbit clients (seedit, 5chan, etc.) display a "done" button outside the iframe for all `url/iframe` type challenges. The iframe content has no control over when this button appears or is clicked. The user must manually click "done" after completing the challenge, which triggers the client to send a `ChallengeAnswer` with an empty string. The subplebbit's `verify()` function then checks the server-side session status.

## Risk Score

The risk score is a value between 0.0 and 1.0 that indicates the likelihood a publication is spam or malicious. It's calculated as a weighted combination of multiple factors including account age, karma, author reputation, content analysis, velocity, and IP intelligence.

For detailed documentation on how risk scoring works, including all factors, weights, and scoring logic, see:

**[Risk Scoring Documentation](packages/server/src/risk-score/RISK_SCORING.md)**

## Indexer

The server includes a background indexer that crawls the plebbit network to build author reputation data. It:

- Indexes subplebbits and their comments/posts
- Follows `author.previousCommentCid` chains to discover new subs
- Tracks modQueue to see which authors get accepted/rejected
- Detects bans/removals by monitoring CommentUpdate availability
- Provides network-wide author reputation data for risk scoring

For detailed documentation on the indexer architecture and implementation, see:

**[Indexer Documentation](packages/server/src/indexer/README.md)**

**Thresholds (configurable per sub):**

- `riskScore < autoAcceptThreshold` → Auto-accept
- `autoAcceptThreshold <= riskScore < autoRejectThreshold` → Challenge
- `riskScore >= autoRejectThreshold` → Auto-reject

## Challenge Verification

Challenge completion is tracked **server-side** in the database - no tokens are passed to the user's client.

When a user completes the iframe challenge:

1. The iframe calls `POST /api/v1/challenge/complete` with the CAPTCHA provider's response
2. The server validates the response with the provider (e.g., Turnstile API)
3. If valid, the server updates the session status to `completed` in the database
4. The user clicks "done" in their plebbit client
5. The client sends a `ChallengeAnswer` with an empty string to the subplebbit
6. The sub's challenge code calls `/api/v1/challenge/verify` with the `sessionId`
7. The server checks `session.status === "completed"` and returns success + IP intelligence

**Session expiry:** 1 hour from creation

## Database Schema (SQLite + better-sqlite3)

**Tables:**

Author columns store the full `author` object from each publication (for example, `DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor.comment.author`). `riskScore` is computed on the fly and is not stored in the database.

### `comments`

Stores comment publications for analysis and rate limiting.

- `sessionId` TEXT PRIMARY KEY (foreign key of challengeSessions)
- `author` TEXT NOT NULL -- is actually a JSON
- `subplebbitAddress` TEXT NOT NULL
- `parentCid` TEXT (null for posts, set for replies)
- `content` TEXT
- `link` TEXT
- `linkWidth` INTEGER
- `linkHeight` INTEGER
- `postCid` TEXT
- `signature` TEXT NOT NULL
- `title` TEXT
- `timestamp` INTEGER NOT NULL
- `linkHtmlTagName` TEXT
- `flair` TEXT
- `spoiler` INTEGER (BOOLEAN 0/1)
- `protocolVersion` TEXT NOT NULL
- `nsfw` INTEGER (BOOLEAN 0/1)
- `receivedAt` INTEGER NOT NULL

### `votes`

Stores vote publications.

- `sessionId` TEXT PRIMARY KEY (foreign key of challengeSessions)
- `author` TEXT NOT NULL -- is actually a json
- `subplebbitAddress` TEXT NOT NULL
- `commentCid` TEXT NOT NULL
- `signature` TEXT NOT NULL
- `protocolVersion` TEXT NOT NULL
- `vote` INTEGER NOT NULL (-1, 0 or 1)
- `timestamp` INTEGER NOT NULL
- `receivedAt` INTEGER NOT NULL

### `commentEdits`

Stores comment edit publications.

- `sessionId` TEXT PRIMARY KEY (foreign key of challengeSessions)
- `author` TEXT NOT NULL -- is actually a json
- `subplebbitAddress` TEXT NOT NULL
- `commentCid` TEXT NOT NULL
- `signature` TEXT NOT NULL
- `protocolVersion` TEXT NOT NULL
- `content` TEXT
- `reason` TEXT
- `deleted` INTEGER (BOOLEAN 0/1)
- `flair` TEXT
- `spoiler` INTEGER (BOOLEAN 0/1)
- `nsfw` INTEGER (BOOLEAN 0/1)
- `timestamp` INTEGER NOT NULL
- `receivedAt` INTEGER NOT NULL

### `commentModerations`

Stores comment moderation publications.

- `sessionId` TEXT PRIMARY KEY (foreign key of challengeSessions)
- `author` TEXT NOT NULL -- is actually a json
- `subplebbitAddress` TEXT NOT NULL
- `commentCid` TEXT NOT NULL
- `commentModeration` TEXT
- `signature` TEXT NOT NULL
- `protocolVersion` TEXT
- `timestamp` INTEGER NOT NULL
- `receivedAt` INTEGER NOT NULL

### `challengeSessions`

Tracks challenge sessions. Sessions are kept permanently for historical analysis.

- `sessionId` TEXT PRIMARY KEY -- UUID v4
- `subplebbitPublicKey` TEXT
- `status` TEXT DEFAULT 'pending' (pending, completed, failed)
- `completedAt` INTEGER
- `expiresAt` INTEGER NOT NULL
- `receivedChallengeRequestAt` INTEGER NOT NULL
- `authorAccessedIframeAt` INTEGER -- when did the author access the iframe?

### `ipRecords`

Stores raw IP addresses associated with authors (captured via iframe). One record per challenge.

- `sessionId` TEXT NOT NULL (foreign key to challengeSessions.sessionId) PRIMARY KEY
- `ipAddress` TEXT NOT NULL -- ip address string representation
- `isVpn` INTEGER (BOOLEAN 0/1)
- `isProxy` INTEGER (BOOLEAN 0/1)
- `isTor` INTEGER (BOOLEAN 0/1)
- `isDatacenter` INTEGER (BOOLEAN 0/1)
- `countryCode` TEXT -- ISO 3166-1 alpha-2 country code
- `timestamp` INTEGER NOT NULL -- when did we query the ip provider

## Challenge Code (npm package)

Implements plebbit-js `ChallengeFileFactory`:

```typescript
// Usage in subplebbit settings
{
  "challenges": [{
    "name": "@easy-community-spam-blocker/challenge",
    "options": {
      "serverUrl": "https://easycommunityspamblocker.com/api/v1",
      "autoAcceptThreshold": "0.2",
      "autoRejectThreshold": "0.8",
      "countryBlacklist": "RU,CN,KP",
      "blockVpn": "true",
      "blockTor": "true"
    },
    "exclude": [
      { "role": ["owner", "admin", "moderator"] },
      { "postScore": 100 }
    ]
  }]
}
```

When calling `/api/v1/evaluate`, the `author.subplebbit` field in the publication
(e.g., `challengeRequest.comment.author.subplebbit`) may be `undefined` for first-time
publishers who have never posted in the subplebbit before. The subplebbit populates this
field from its internal database of author history, so new authors won't have it set.

### Configuration Options (Challenge Package)

| Option                | Default                                       | Description                                                                    |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| `serverUrl`           | `https://easycommunityspamblocker.com/api/v1` | URL of the EasyCommunitySpamBlocker server (must be http/https)                |
| `autoAcceptThreshold` | `0.2`                                         | Auto-accept publications below this risk score                                 |
| `autoRejectThreshold` | `0.8`                                         | Auto-reject publications above this risk score                                 |
| `countryBlacklist`    | `""`                                          | Comma-separated ISO 3166-1 alpha-2 country codes to block (e.g., `"RU,CN,KP"`) |
| `maxIpRisk`           | `1.0`                                         | Reject if ipRisk from /verify exceeds this threshold                           |
| `blockVpn`            | `false`                                       | Reject publications from VPN IPs (`true`/`false` only)                         |
| `blockProxy`          | `false`                                       | Reject publications from proxy IPs (`true`/`false` only)                       |
| `blockTor`            | `false`                                       | Reject publications from Tor exit nodes (`true`/`false` only)                  |
| `blockDatacenter`     | `false`                                       | Reject publications from datacenter IPs (`true`/`false` only)                  |

**Post-challenge filtering:** After a user completes a challenge, the `/verify` response includes IP intelligence data. The challenge code uses the above options to reject publications even after successful challenge completion (e.g., if the user is from a blacklisted country or using a VPN).

**Error Handling:** If the server is unreachable, the challenge code throws an error (does not silently accept or reject). This ensures the sub owner is notified of issues.

### Server Configuration (separate from challenge)

These settings are configured on the HTTP server, not in the challenge package:

- `databasePath`: Path to the SQLite database file (required). Use `:memory:` for in-memory. Env: `DATABASE_PATH` (required for CLI entrypoint)
- `keyPath`: Path to store the server's Ed25519 JWT signing keypair. Auto-generates if not exists. Env: `JWT_KEY_PATH`
- `turnstileSiteKey`: Cloudflare Turnstile site key. Env: `TURNSTILE_SITE_KEY`
- `turnstileSecretKey`: Cloudflare Turnstile secret key. Env: `TURNSTILE_SECRET_KEY`
- `ipInfoToken`: IPinfo token for IP intelligence lookups. Env: `IPINFO_TOKEN`

## Key Design Decisions

- **Database:** SQLite with better-sqlite3, no ORM
- **Content Analysis:** Server-side setting, enabled by default
- **Primary Challenge Provider:** Cloudflare Turnstile (free, privacy-friendly)
- **Error Handling:** Always throw on server errors (no silent failures)
- **IP Storage:** Raw IPs stored (not hashed) for accurate analysis
- **IP Intelligence:** IPinfo (external HTTP API, best-effort)
- **Ephemeral Sessions:** Challenge sessions auto-purge after 1 hour

## Privacy Considerations

- Raw IPs are stored for spam detection purposes
- Content analysis is performed on the server
- IP intelligence lookups are sent to IPinfo when enabled
- All data is visible to the server operator
- Open source for auditability
- Explanation field shows reasoning for scores

## Known Limitations

- IP intelligence fields are best-effort estimates and can be wrong (e.g., VPNs, residential IPs, or misclassification)
- Treat IP intelligence as informational and use it only for rejection decisions
- IP intelligence fields are optional and may be removed from the engine response in the future; challenge code only applies IP filtering options when they are present
- IP-based options are intentionally rejection-only; we do not support IP-derived auto-approval (e.g., a country whitelist), because it is easy to game and can be used to flood a community

## Implementation Steps

1. **Setup monorepo** with npm workspaces, TypeScript, ESM
2. **Implement shared types** package
3. **Build server**:
    - Fastify setup with routes
    - better-sqlite3 database
    - Import plebbit-js schemas for validation
    - Risk scoring service
    - JWT token signing (Ed25519)
    - Turnstile integration
    - Iframe HTML pages
4. **Build challenge package**:
    - ChallengeFileFactory implementation
    - HTTP client for server communication
5. **Testing**: Unit tests, integration tests with plebbit-js
6. **Documentation**: README, API docs

## Verification Plan

1. Run server locally: `DATABASE_PATH=spam_detection.db npm run dev`
2. Test /evaluate endpoint with `{ challengeRequest: DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor }`
3. Test iframe flow using challengeUrl from /evaluate response
4. Test /challenge/verify with valid and invalid tokens
5. Test post-challenge filtering (country blacklist, VPN blocking, etc.)
6. Integrate challenge package with local plebbit-js subplebbit
7. Verify full end-to-end flow

## Reference Files

- plebbit-js challenge example: `plebbit-js/src/runtime/node/subplebbit/challenges/plebbit-js-challenges/captcha-canvas-v3/index.ts`
- plebbit-js schemas: `plebbit-js/src/subplebbit/schema.ts`
- plebbit-js challenge orchestration: `plebbit-js/src/runtime/node/subplebbit/challenges/index.ts`
- MintPass iframe challenge: https://github.com/plebbitlabs/mintpass/tree/master/challenge
