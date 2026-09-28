PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workspace_records (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_id TEXT REFERENCES works(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  record_key TEXT NOT NULL,
  content_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id, record_type, record_key)
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_id TEXT REFERENCES works(id) ON DELETE SET NULL,
  deliverable_id TEXT REFERENCES deliverables(id) ON DELETE SET NULL,
  scene_key TEXT,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image','video','audio','document','other')),
  source TEXT NOT NULL DEFAULT 'generated' CHECK (source IN ('generated','uploaded','drive','external')),
  storage_provider TEXT,
  storage_key TEXT,
  public_url TEXT,
  file_name TEXT,
  mime_type TEXT,
  model TEXT,
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft','review','approved','rejected')),
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_workspace_records_project ON workspace_records(project_id, record_type, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_project ON media_assets(project_id, asset_type, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_work ON media_assets(work_id, updated_at DESC);
