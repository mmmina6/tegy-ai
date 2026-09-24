PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_id TEXT REFERENCES works(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  detail TEXT,
  owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  owner_name TEXT,
  reviewer_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewer_name TEXT,
  due_at TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'blocked', 'cancelled')),
  blocked_reason TEXT,
  dependency_task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  history_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_work ON tasks(work_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner_user_id, status, due_at);

