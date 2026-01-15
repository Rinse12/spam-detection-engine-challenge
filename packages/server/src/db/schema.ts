/**
 * Database schema for the spam detection engine.
 * Uses better-sqlite3 with SQLite.
 */

// TODO need to handle cases where spam engine receives publications with unrecognized fields. We should strip those unrecognized fields away before storing
export const SCHEMA_SQL = `
-- Comments table - stores comment publications
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  protocolVersion TEXT,
  nsfw INTEGER,
  receivedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author);
CREATE INDEX IF NOT EXISTS idx_comments_subplebbitAddress ON comments(subplebbitAddress);
CREATE INDEX IF NOT EXISTS idx_comments_timestamp ON comments(timestamp);

-- Votes table - stores vote publications
CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author TEXT NOT NULL,
  subplebbitAddress TEXT NOT NULL,
  commentCid TEXT NOT NULL,
  signature TEXT NOT NULL,
  protocolVersion TEXT,
  vote INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  receivedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_votes_author ON votes(author);
CREATE INDEX IF NOT EXISTS idx_votes_commentCid ON votes(commentCid);

-- Comment edits table - stores comment edit publications
CREATE TABLE IF NOT EXISTS commentEdits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author TEXT NOT NULL,
  subplebbitAddress TEXT NOT NULL,
  commentCid TEXT NOT NULL,
  signature TEXT NOT NULL,
  protocolVersion TEXT,
  content TEXT,
  reason TEXT,
  deleted INTEGER,
  flair TEXT,
  spoiler INTEGER,
  nsfw INTEGER,
  timestamp INTEGER NOT NULL,
  receivedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_commentEdits_author ON commentEdits(author);
CREATE INDEX IF NOT EXISTS idx_commentEdits_commentCid ON commentEdits(commentCid);

-- Comment moderations table - stores comment moderation publications
CREATE TABLE IF NOT EXISTS commentModerations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author TEXT NOT NULL,
  subplebbitAddress TEXT NOT NULL,
  commentCid TEXT NOT NULL,
  commentModeration TEXT,
  signature TEXT NOT NULL,
  protocolVersion TEXT,
  timestamp INTEGER NOT NULL,
  receivedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_commentModerations_author ON commentModerations(author);
CREATE INDEX IF NOT EXISTS idx_commentModerations_commentCid ON commentModerations(commentCid);

-- Challenge sessions table (ephemeral) - stores pending challenges
CREATE TABLE IF NOT EXISTS challengeSessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challengeId TEXT NOT NULL UNIQUE,
  author TEXT NOT NULL,
  subplebbitAddress TEXT NOT NULL,
  subplebbitPublicKey TEXT, -- Ed25519 public key of the subplebbit that created this session
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  completedAt INTEGER,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_challengeSessions_challengeId ON challengeSessions(challengeId);
CREATE INDEX IF NOT EXISTS idx_challengeSessions_expiresAt ON challengeSessions(expiresAt);
CREATE INDEX IF NOT EXISTS idx_challengeSessions_author ON challengeSessions(author);

-- IP records table (ephemeral) - stores IP addresses associated with authors
CREATE TABLE IF NOT EXISTS ipRecords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ipAddress TEXT NOT NULL,
  author TEXT NOT NULL,
  challengeId TEXT NOT NULL,
  isVpn INTEGER DEFAULT 0,
  isProxy INTEGER DEFAULT 0,
  isTor INTEGER DEFAULT 0,
  isDatacenter INTEGER DEFAULT 0,
  countryCode TEXT,
  intelUpdatedAt INTEGER,
  firstSeenAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  lastSeenAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_ipRecords_ipAddress ON ipRecords(ipAddress);
CREATE INDEX IF NOT EXISTS idx_ipRecords_author ON ipRecords(author);
CREATE INDEX IF NOT EXISTS idx_ipRecords_challengeId ON ipRecords(challengeId);
`;
