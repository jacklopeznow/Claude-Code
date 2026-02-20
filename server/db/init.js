const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/enscope.db');

function initializeDatabase(dbPath = DB_PATH) {
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_name TEXT NOT NULL,
      engagement_type TEXT NOT NULL DEFAULT 'ITOM Event Management',
      team_members TEXT NOT NULL DEFAULT '[]',
      passphrase_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS observability_tools (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_workflows (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      workflow_index INTEGER NOT NULL CHECK(workflow_index BETWEEN 1 AND 8),
      workflow_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started', 'in_progress', 'complete')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, workflow_index)
    );

    CREATE TABLE IF NOT EXISTS workflow_steps (
      id TEXT PRIMARY KEY,
      project_workflow_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      step_name TEXT DEFAULT '',
      description TEXT DEFAULT '',
      role_team TEXT DEFAULT '',
      trigger_input TEXT DEFAULT '',
      systems_tools TEXT DEFAULT '',
      decision_points TEXT DEFAULT '',
      output_handoff TEXT DEFAULT '',
      pain_points TEXT DEFAULT '',
      time_effort TEXT DEFAULT '',
      raw_transcript TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_workflow_id) REFERENCES project_workflows(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS step_scores (
      id TEXT PRIMARY KEY,
      workflow_step_id TEXT NOT NULL UNIQUE,
      rule_based_score INTEGER DEFAULT 0 CHECK(rule_based_score BETWEEN 0 AND 5),
      data_availability_score INTEGER DEFAULT 0 CHECK(data_availability_score BETWEEN 0 AND 5),
      exception_frequency_score INTEGER DEFAULT 0 CHECK(exception_frequency_score BETWEEN 0 AND 5),
      auditability_score INTEGER DEFAULT 0 CHECK(auditability_score BETWEEN 0 AND 5),
      speed_sensitivity_score INTEGER DEFAULT 0 CHECK(speed_sensitivity_score BETWEEN 0 AND 5),
      composite_score INTEGER DEFAULT 0,
      candidate_tier TEXT DEFAULT 'human_only' CHECK(candidate_tier IN ('autonomous', 'human_in_loop', 'human_only')),
      score_rationale TEXT DEFAULT '',
      FOREIGN KEY (workflow_step_id) REFERENCES workflow_steps(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dependency_gaps (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      workflow_index INTEGER NOT NULL,
      gap_type TEXT NOT NULL CHECK(gap_type IN ('cmdb', 'discovery', 'observability', 'other')),
      severity TEXT NOT NULL CHECK(severity IN ('red', 'amber', 'green')),
      description TEXT NOT NULL,
      identified_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_project_workflows_project ON project_workflows(project_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON workflow_steps(project_workflow_id);
    CREATE INDEX IF NOT EXISTS idx_step_scores_step ON step_scores(workflow_step_id);
    CREATE INDEX IF NOT EXISTS idx_dependency_gaps_project ON dependency_gaps(project_id);
    CREATE INDEX IF NOT EXISTS idx_observability_tools_project ON observability_tools(project_id);
  `);

  return db;
}

module.exports = { initializeDatabase, DB_PATH };

if (require.main === module) {
  const db = initializeDatabase();
  console.log('Database initialized at:', DB_PATH);
  db.close();
}
