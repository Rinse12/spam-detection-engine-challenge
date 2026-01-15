# Spam Detection Engine for Plebbit

## Overview

A centralized spam detection service that evaluates publications and provides risk scores to help subplebbits filter spam. Consists of:

1. **HTTP Server** (`@plebbit/spam-detection-server`) - Risk assessment and challenge server
2. **Challenge Package** (`@plebbit/spam-detection-challenge`) - npm package for subplebbit integration

**Important:**

- The HTTP server must import and use schemas from `plebbit-js` to validate incoming challenge requests. This ensures type compatibility with `DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor`.
- The HTTP server must verify that the publication in the ChallengeRequest is correctly signed by the author.

## Repository Structure

```
spam_detection_engine/
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

**Request:**

```typescript
// The request wraps the DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor from plebbit-js
// subplebbitAddress and author.subplebbit are required on the publication
// signature is a plebbit-js JsonSignature; signedPropertyNames must cover all fields except signature
{
  challengeRequest: DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
  timestamp: number; // Unix timestamp (seconds)
  signature: {
    signature: string; // base64
    publicKey: string; // base64
    type: string;
    signedPropertyNames: string[];
  };
}
```

**Response:**

```typescript
{
  riskScore: number; // 0.0 to 1.0
  explanation?: string; // Human-readable reasoning for the score

  // Pre-generated challenge URL - sub can use this if it decides to challenge
  challengeId: string;
  challengeUrl: string; // Full URL: https://spam.plebbit.org/api/v1/iframe/{challengeId}
  challengeExpiresAt?: number; // Unix timestamp, 1 hour from creation
}
```

The response always includes a pre-generated `challengeUrl`. If the sub decides to challenge based on `riskScore`, it can immediately send the URL to the user without making a second request. If the challenge is not used, the session auto-purges after 1 hour.

### POST /api/v1/challenge/verify

Called by the subplebbit's challenge code to verify a token submitted by the author. The author receives a token after completing the iframe challenge and includes it in their `challengeAnswer` pubsub message.

**Request must be signed by the subplebbit** (same signing mechanism as /evaluate), using the same signing key that was used for the evaluate request.

**Request:**

```typescript
{
  challengeId: string;
  token: string; // Token from iframe, submitted by author in challengeAnswer
  timestamp: number; // Unix timestamp (seconds)
  signature: {
    signature: string; // base64
    publicKey: string; // base64
    type: string;
    signedPropertyNames: string[];
  };
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

### GET /api/v1/iframe/:challengeId

TODO: The iframe needs to explain, if we do Sign in by github that we won't send the account name to the sub. Same thing for IP address, we only share the IP address's country
Serves the iframe challenge page (e.g., Cloudflare Turnstile). When the user solves the challenge:

1. The iframe page receives success from Turnstile
2. The page generates a signed token (JWT signed by the server)
3. The page calls `window.parent.postMessage({ type: 'challenge-complete', token: '...' }, '*')`
4. The plebbit client receives this token
5. The author includes this token in their `challengeAnswer` pubsub message
6. The subplebbit's challenge code calls `/api/v1/challenge/verify` to validate the token

## Challenge Flow (Detailed)

```
┌─────────────────┐       ┌──────────────────┐       ┌────────────────┐
│   Plebbit       │       │  Spam Detection  │       │   Turnstile    │
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
         │     challengeUrl        │                          │
         │     returned            │                          │
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
         │─────────────────────────────────────────────────────>
         │                         │                          │
         │  7. postMessage(token)  │                          │
         │<─────────────────────────────────────────────────────
         │                         │                          │
         │  8. Author sends        │                          │
         │     ChallengeAnswer     │                          │
         │     with token          │                          │
         │─────────────────────────>                          │
         │                         │                          │
         │  9. Sub's verify()      │                          │
         │     calls /verify       │                          │
         │                         │                          │
         │  10. success: true +    │                          │
         │      IP intelligence    │                          │
         │<─────────────────────────                          │
         │                         │                          │
         │  11. Sub applies        │                          │
         │      post-challenge     │                          │
         │      filters            │                          │
         │                         │                          │
         │  12. Publication        │                          │
         │      accepted/rejected  │                          │
         └─────────────────────────┘                          │
```

## Risk Score Formula

> **Note:** This section is rough and will likely change significantly as we gather real-world data and refine the algorithm.

Weighted combination (0-1 scale):

| Factor            | Weight (no IP) | Weight (with IP) | Calculation                                                       |
| ----------------- | -------------- | ---------------- | ----------------------------------------------------------------- |
| Author Reputation | 0.30           | 0.25             | Solved challenges (-), publication history                        |
| Content Risk      | 0.20           | 0.15             | Spam patterns, suspicious links, URL shorteners                   |
| Velocity Risk     | 0.15           | 0.10             | Rate of publications per time window (e.g., 10 posts/hour = high) |
| Account Age       | 0.20           | 0.15             | Based on firstCommentTimestamp from plebbit-js                    |
| Karma Score       | 0.15           | 0.10             | Based on postScore + replyScore from plebbit-js                   |
| IP Risk           | —              | 0.25             | VPN/proxy/Tor detection, datacenter IP, multi-author IP           |

**Velocity Risk** explained: Measures how frequently an author is publishing. For example:

- 1-2 posts/hour: normal (low risk)
- 5-10 posts/hour: suspicious (medium risk)
- 20+ posts/hour: likely spam/bot (high risk)

**Thresholds (configurable per sub):**

- `riskScore < autoAcceptThreshold` → Auto-accept
- `autoAcceptThreshold <= riskScore < autoRejectThreshold` → Challenge
- `riskScore >= autoRejectThreshold` → Auto-reject

## Token Verification

When a user completes the iframe challenge:

1. The iframe page (served by the spam detection server) generates a JWT
2. The JWT is signed by the server's private key
3. The JWT contains: `challengeId`, `authorAddress`, `completedAt`, `expiresAt`
4. The sub's challenge code calls `/api/v1/challenge/verify` with the token
5. The server verifies the signature matches its own domain/key and checks expiration

**Format:** JWT with Ed25519 signatures
**Expiry:** 1 hour from challenge creation

## Database Schema (SQLite + better-sqlite3)

**Tables:**

Author columns store the full `author` object from each publication (for example, `DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor.comment.author`). `riskScore` is computed on the fly and is not stored in the database.

### `comments`

Stores comment publications for analysis and rate limiting.

- `id` INTEGER PRIMARY KEY
- `author` TEXT NOT NULL
- `subplebbitAddress` TEXT NOT NULL
- `parentCid` TEXT (null for posts, set for replies)
- `content` TEXT
- `link` TEXT
- `linkWidth` INTEGER
- `linkHeight` INTEGER
- `postCid` TEXT NOT NULL
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

- `id` INTEGER PRIMARY KEY
- `author` TEXT NOT NULL
- `subplebbitAddress` TEXT NOT NULL
- `commentCid` TEXT NOT NULL
- `signature` TEXT NOT NULL
- `protocolVersion` TEXT NOT NULL
- `vote` INTEGER NOT NULL (-1, 0 or 1)
- `timestamp` INTEGER NOT NULL
- `receivedAt` INTEGER NOT NULL

### `commentEdits`

Stores comment edit publications.

- `id` INTEGER PRIMARY KEY
- `author` TEXT NOT NULL
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

- `id` INTEGER PRIMARY KEY
- `author` TEXT NOT NULL
- `subplebbitAddress` TEXT NOT NULL
- `commentCid` TEXT NOT NULL
- `commentModeration` TEXT NOT NULL
- `signature` TEXT NOT NULL
- `protocolVersion` TEXT NOT NULL
- `timestamp` INTEGER NOT NULL
- `receivedAt` INTEGER NOT NULL

### `challengeSessions` (ephemeral)

#### TODO this is not complete yet, we will probably come back to this later

Tracks pending challenges. **Automatically purged after 1 hour.**.

- `id` INTEGER PRIMARY KEY
- `challengeId` TEXT NOT NULL UNIQUE
- `author` TEXT NOT NULL
- `subplebbitAddress` TEXT NOT NULL
- `subplebbitPublicKey` TEXT
- `status` TEXT DEFAULT 'pending' (pending, completed, failed)
- `completedAt` INTEGER
- `expiresAt` INTEGER NOT NULL
- `createdAt` INTEGER NOT NULL

### `ipRecords`

#### TODO this is not complete yet, we will probably come back to this later

Stores raw IP addresses associated with authors (captured via iframe).

- `id` INTEGER PRIMARY KEY
- `ipAddress` TEXT NOT NULL
- `author` TEXT NOT NULL
- `challengeId` TEXT
- `isVpn` INTEGER (BOOLEAN 0/1)
- `isProxy` INTEGER (BOOLEAN 0/1)
- `isTor` INTEGER (BOOLEAN 0/1)
- `isDatacenter` INTEGER (BOOLEAN 0/1)
- `countryCode` TEXT
- `intelUpdatedAt` INTEGER
- `firstSeenAt` INTEGER NOT NULL
- `lastSeenAt` INTEGER NOT NULL

## Challenge Code (npm package)

Implements plebbit-js `ChallengeFileFactory`:

```typescript
// Usage in subplebbit settings
{
  "challenges": [{
    "name": "@plebbit/spam-detection-challenge",
    "options": {
      "serverUrl": "https://spam.plebbit.org/api/v1",
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

When calling `/api/v1/evaluate`, the client must include `author.subplebbit`
fields in the publication (for example, `challengeRequest.comment.author.subplebbit`).
Requests without subplebbit author data are rejected.

### Configuration Options (Challenge Package)

| Option                | Default                           | Description                                                                    |
| --------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| `serverUrl`           | `https://spam.plebbit.org/api/v1` | URL of the spam detection server (must be http/https)                          |
| `autoAcceptThreshold` | `0.2`                             | Auto-accept publications below this risk score                                 |
| `autoRejectThreshold` | `0.8`                             | Auto-reject publications above this risk score                                 |
| `countryBlacklist`    | `""`                              | Comma-separated ISO 3166-1 alpha-2 country codes to block (e.g., `"RU,CN,KP"`) |
| `maxIpRisk`           | `1.0`                             | Reject if ipRisk from /verify exceeds this threshold                           |
| `blockVpn`            | `false`                           | Reject publications from VPN IPs (`true`/`false` only)                         |
| `blockProxy`          | `false`                           | Reject publications from proxy IPs (`true`/`false` only)                       |
| `blockTor`            | `false`                           | Reject publications from Tor exit nodes (`true`/`false` only)                  |
| `blockDatacenter`     | `false`                           | Reject publications from datacenter IPs (`true`/`false` only)                  |

**Post-challenge filtering:** After a user completes a challenge, the `/verify` response includes IP intelligence data. The challenge code uses the above options to reject publications even after successful challenge completion (e.g., if the user is from a blacklisted country or using a VPN).

**Error Handling:** If the server is unreachable, the challenge code throws an error (does not silently accept or reject). This ensures the sub owner is notified of issues.

### Server Configuration (separate from challenge)

These settings are configured on the HTTP server, not in the challenge package:

- `databasePath`: Path to the SQLite database file (required). Use `:memory:` for in-memory. Env: `DATABASE_PATH` (required for CLI entrypoint)
- `iframeProvider`: Which CAPTCHA provider to use (turnstile, hcaptcha, self-hosted)
- `contentAnalysis`: Whether to analyze publication content for spam patterns
- `ipInfoToken`: IPinfo token for IP intelligence lookups (env `IPINFO_TOKEN`)

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
