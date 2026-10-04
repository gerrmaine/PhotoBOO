-- Unused local-only snapshot. The live schema is schema.pg.sql (paste that
-- into the Supabase SQL editor). Kept so the original SQLite design is readable.
-- ---------------------------------------------------------------------------
-- Photobooth schema (SQLite dialect of the Postgres design in the architecture
-- doc). UUIDs are generated in JS, timestamps are ISO-8601 TEXT, JSONB is TEXT.
-- ---------------------------------------------------------------------------

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS themes (
  id                  TEXT PRIMARY KEY,
  slug                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  tagline             TEXT NOT NULL DEFAULT '',
  frame_asset_url     TEXT NOT NULL,
  thumb_url           TEXT NOT NULL,
  default_frame_color TEXT NOT NULL DEFAULT '#FFFFFF',
  accent_color        TEXT NOT NULL DEFAULT '#4A90D9',
  is_active           INTEGER NOT NULL DEFAULT 1,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS characters (
  id          TEXT PRIMARY KEY,
  theme_id    TEXT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  name        TEXT NOT NULL,
  art_url     TEXT NOT NULL,
  -- { x, y, radius } normalised 0..1 against the art's own dimensions
  face_anchor TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (theme_id, slug)
);

-- theme_id is NULL for global stickers, which appear in every theme. Keeping
-- them in the same table means one query path and one shape on the client.
CREATE TABLE IF NOT EXISTS stickers (
  id         TEXT PRIMARY KEY,
  theme_id   TEXT REFERENCES themes(id) ON DELETE CASCADE,
  slug       TEXT NOT NULL,
  name       TEXT NOT NULL,
  mood       TEXT NOT NULL DEFAULT '',
  asset_url  TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- SQLite treats NULLs as distinct in a UNIQUE constraint, so a plain
-- UNIQUE(theme_id, slug) would let duplicate globals through. Two partial
-- indexes cover both cases properly.
CREATE UNIQUE INDEX IF NOT EXISTS idx_stickers_theme_slug
  ON stickers (theme_id, slug) WHERE theme_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_stickers_global_slug
  ON stickers (slug) WHERE theme_id IS NULL;

-- Worlds live until their host deletes them. There is deliberately no expiry
-- column: a shared album that silently vanishes is worse than one that lingers.
CREATE TABLE IF NOT EXISTS worlds (
  id           TEXT PRIMARY KEY,
  join_code    TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  theme_id     TEXT REFERENCES themes(id) ON DELETE SET NULL,
  revision     INTEGER NOT NULL DEFAULT 1,
  member_limit INTEGER NOT NULL DEFAULT 20,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_worlds_join_code ON worlds (join_code);

CREATE TABLE IF NOT EXISTS members (
  id                  TEXT PRIMARY KEY,
  world_id            TEXT NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  display_name        TEXT NOT NULL,
  -- SHA-256 hash of the token handed to the client. The raw token is never stored.
  member_token        TEXT NOT NULL,
  is_host             INTEGER NOT NULL DEFAULT 0,
  character_id        TEXT REFERENCES characters(id) ON DELETE SET NULL,
  character_image_url TEXT,
  -- The uncropped photo and its framing, kept so switching character can
  -- re-composite instead of asking for the picture all over again.
  face_image_url      TEXT,
  face_crop           TEXT,
  joined_at           TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (world_id, display_name)
);

CREATE INDEX IF NOT EXISTS idx_members_world        ON members (world_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_token ON members (member_token);

-- Exactly one host per world, enforced by the database rather than by hope.
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_host_per_world
  ON members (world_id) WHERE is_host = 1;

CREATE TABLE IF NOT EXISTS photo_strips (
  id           TEXT PRIMARY KEY,
  share_slug   TEXT NOT NULL UNIQUE,
  theme_id     TEXT NOT NULL REFERENCES themes(id) ON DELETE RESTRICT,
  world_id     TEXT REFERENCES worlds(id)  ON DELETE SET NULL,
  member_id    TEXT REFERENCES members(id) ON DELETE SET NULL,
  author_name  TEXT,
  image_url    TEXT NOT NULL,
  -- URLs of the four source photos. The composite bakes stickers and ink in
  -- permanently, so without these a saved strip could never be re-edited.
  frames_data  TEXT NOT NULL DEFAULT '[]',
  frame_color  TEXT NOT NULL DEFAULT '#FFFFFF',
  sticker_data TEXT NOT NULL DEFAULT '[]',
  drawing_data TEXT NOT NULL DEFAULT '[]',
  -- SHA-256 of a token handed to the creator once. Strips shot outside a World
  -- have no member to authorise against, so this is how they stay editable.
  edit_token   TEXT,
  updated_at   TEXT,
  width        INTEGER NOT NULL,
  height       INTEGER NOT NULL,
  byte_size    INTEGER NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_strips_slug  ON photo_strips (share_slug);
CREATE INDEX IF NOT EXISTS idx_strips_world ON photo_strips (world_id, created_at DESC);
