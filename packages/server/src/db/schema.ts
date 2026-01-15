/**
 * Database schema for the spam detection engine.
 * Uses better-sqlite3 with SQLite.
 */

// TODO need to handle cases where spam engine receives publications with unrecognized fields. We should strip those unrecognized fields away before storing
export const SCHEMA_SQL = `
-- Challenge sessions table (ephemeral) - stores pending challenges
CREATE TABLE IF NOT EXISTS challengeSessions (
  challengeId TEXT PRIMARY KEY,
  subplebbitPublicKey TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  completedAt INTEGER,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  authorAccessedIframeAt INTEGER
);

CREATE INDEX IF NOT EXISTS idx_challengeSessions_expiresAt ON challengeSessions(expiresAt);

-- Comments table - stores comment publications
CREATE TABLE IF NOT EXISTS comments (
  challengeId TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  subplebbitAddress TEXT NOT NULL,
  parentCid TEXT,
  content TEXT,
  link TEXT,
  linkWidth INTEGER,
  linkHeight INTEGER,
  postCid TEXT,
  signature TEXT NOT NULL,
  title TEXT,
  timestamp INTEGER NOT NULL,
  linkHtmlTagName TEXT,
  flair TEXT,
  spoiler INTEGER,
  protocolVersion TEXT NOT NULL,
  nsfw INTEGER,
  receivedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (challengeId) REFERENCES challengeSessions(challengeId)
);

CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author);
CREATE INDEX IF NOT EXISTS idx_comments_subplebbitAddress ON comments(subplebbitAddress);
CREATE INDEX IF NOT EXISTS idx_comments_timestamp ON comments(timestamp);

-- Votes table - stores vote publications
CREATE TABLE IF NOT EXISTS votes (
  challengeId TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  subplebbitAddress TEXT NOT NULL,
  commentCid TEXT NOT NULL,
  signature TEXT NOT NULL,
  protocolVersion TEXT NOT NULL,
  vote INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  receivedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (challengeId) REFERENCES challengeSessions(challengeId)
);

CREATE INDEX IF NOT EXISTS idx_votes_author ON votes(author);
CREATE INDEX IF NOT EXISTS idx_votes_commentCid ON votes(commentCid);

-- Comment edits table - stores comment edit publications
CREATE TABLE IF NOT EXISTS commentEdits (
  challengeId TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  subplebbitAddress TEXT NOT NULL,
  commentCid TEXT NOT NULL,
  signature TEXT NOT NULL,
  protocolVersion TEXT NOT NULL,
  content TEXT,
  reason TEXT,
  deleted INTEGER,
  flair TEXT,
  spoiler INTEGER,
  nsfw INTEGER,
  timestamp INTEGER NOT NULL,
  receivedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (challengeId) REFERENCES challengeSessions(challengeId)
);

CREATE INDEX IF NOT EXISTS idx_commentEdits_author ON commentEdits(author);
CREATE INDEX IF NOT EXISTS idx_commentEdits_commentCid ON commentEdits(commentCid);

-- Comment moderations table - stores comment moderation publications
CREATE TABLE IF NOT EXISTS commentModerations (
  challengeId TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  subplebbitAddress TEXT NOT NULL,
  commentCid TEXT NOT NULL,
  commentModeration TEXT,
  signature TEXT NOT NULL,
  protocolVersion TEXT,
  timestamp INTEGER NOT NULL,
  receivedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (challengeId) REFERENCES challengeSessions(challengeId)
);

CREATE INDEX IF NOT EXISTS idx_commentModerations_author ON commentModerations(author);
CREATE INDEX IF NOT EXISTS idx_commentModerations_commentCid ON commentModerations(commentCid);

-- IP records table - stores IP addresses associated with challenges
CREATE TABLE IF NOT EXISTS ipRecords (
  challengeId TEXT PRIMARY KEY,
  ipAddress TEXT NOT NULL,
  isVpn INTEGER,
  isProxy INTEGER,
  isTor INTEGER,
  isDatacenter INTEGER,
  countryCode TEXT,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (challengeId) REFERENCES challengeSessions(challengeId)
);

CREATE INDEX IF NOT EXISTS idx_ipRecords_ipAddress ON ipRecords(ipAddress);
`;
