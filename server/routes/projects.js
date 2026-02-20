const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcryptjs = require('bcryptjs');
const { getConnection } = require('../db/connection');

const router = express.Router();

const WORKFLOW_NAMES = [
  'Signal Intake & Event Detection',
  'Triage & Classification',
  'Correlation & Context Enrichment',
  'Assignment & Coordination',
  'Diagnosis & Resolution',
  'Escalation & Major Incident Management',
  'Verification & Closure',
  'Post-Incident Review & Learning'
];

// POST /api/projects - Create project
router.post('/', async (req, res) => {
  try {
    const { name, client_name, engagement_type, observability_tools, passphrase } = req.body;

    if (!name || !client_name || !passphrase) {
      return res.status(400).json({
        error: 'Missing required fields: name, client_name, passphrase'
      });
    }

    const db = getConnection();
    const projectId = uuidv4();
    const hashedPassphrase = bcryptjs.hashSync(passphrase, 10);

    // Create project
    const insertProjectStmt = db.prepare(`
      INSERT INTO projects (id, name, client_name, engagement_type, passphrase_hash)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertProjectStmt.run(
      projectId,
      name,
      client_name,
      engagement_type || 'ITOM Event Management',
      hashedPassphrase
    );

    // Create 8 project workflows with fixed workflow names
    const insertWorkflowStmt = db.prepare(`
      INSERT INTO project_workflows (id, project_id, workflow_index, workflow_name, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    WORKFLOW_NAMES.forEach((workflowName, index) => {
      const workflowId = uuidv4();
      insertWorkflowStmt.run(
        workflowId,
        projectId,
        index + 1,
        workflowName,
        'not_started'
      );
    });

    // Store observability tools
    if (Array.isArray(observability_tools) && observability_tools.length > 0) {
      const insertToolStmt = db.prepare(`
        INSERT INTO observability_tools (id, project_id, tool_name)
        VALUES (?, ?, ?)
      `);

      observability_tools.forEach((toolName) => {
        const toolId = uuidv4();
        insertToolStmt.run(toolId, projectId, toolName);
      });
    }

    // Retrieve created project with workflows and tools
    const getProjectStmt = db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `);
    const project = getProjectStmt.get(projectId);

    const getWorkflowsStmt = db.prepare(`
      SELECT id, workflow_index, workflow_name, status FROM project_workflows
      WHERE project_id = ?
      ORDER BY workflow_index
    `);
    const workflows = getWorkflowsStmt.all(projectId);

    const getToolsStmt = db.prepare(`
      SELECT tool_name FROM observability_tools WHERE project_id = ?
    `);
    const tools = getToolsStmt.all(projectId).map(t => t.tool_name);

    res.status(201).json({
      id: project.id,
      name: project.name,
      client_name: project.client_name,
      engagement_type: project.engagement_type,
      created_at: project.created_at,
      workflows,
      observability_tools: tools
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// POST /api/projects/join - Join project by name + passphrase
router.post('/join', async (req, res) => {
  try {
    const { name, passphrase } = req.body;

    if (!name || !passphrase) {
      return res.status(400).json({
        error: 'Missing required fields: name, passphrase'
      });
    }

    const db = getConnection();

    const getProjectStmt = db.prepare(`
      SELECT * FROM projects WHERE name = ?
    `);
    const project = getProjectStmt.get(name);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isValidPassphrase = bcryptjs.compareSync(passphrase, project.passphrase_hash);
    if (!isValidPassphrase) {
      return res.status(401).json({ error: 'Invalid passphrase' });
    }

    const getWorkflowsStmt = db.prepare(`
      SELECT id, workflow_index, workflow_name, status FROM project_workflows
      WHERE project_id = ?
      ORDER BY workflow_index
    `);
    const workflows = getWorkflowsStmt.all(project.id);

    const getToolsStmt = db.prepare(`
      SELECT tool_name FROM observability_tools WHERE project_id = ?
    `);
    const tools = getToolsStmt.all(project.id).map(t => t.tool_name);

    res.json({
      id: project.id,
      name: project.name,
      client_name: project.client_name,
      engagement_type: project.engagement_type,
      created_at: project.created_at,
      workflows,
      observability_tools: tools
    });
  } catch (error) {
    console.error('Error joining project:', error);
    res.status(500).json({ error: 'Failed to join project' });
  }
});

// GET /api/projects/:id - Get project details with workflows and tools
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getConnection();

    const getProjectStmt = db.prepare(`
      SELECT id, name, client_name, engagement_type, created_at FROM projects WHERE id = ?
    `);
    const project = getProjectStmt.get(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const getWorkflowsStmt = db.prepare(`
      SELECT id, workflow_index, workflow_name, status FROM project_workflows
      WHERE project_id = ?
      ORDER BY workflow_index
    `);
    const workflows = getWorkflowsStmt.all(id);

    const getToolsStmt = db.prepare(`
      SELECT tool_name FROM observability_tools WHERE project_id = ?
    `);
    const tools = getToolsStmt.all(id).map(t => t.tool_name);

    res.json({
      ...project,
      workflows,
      observability_tools: tools
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// GET /api/projects/:id/dashboard - Get dashboard data
router.get('/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getConnection();

    const getProjectStmt = db.prepare(`
      SELECT id, name, client_name, engagement_type FROM projects WHERE id = ?
    `);
    const project = getProjectStmt.get(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get workflows with step counts and completion status
    const getWorkflowDetailsStmt = db.prepare(`
      SELECT
        pw.id,
        pw.workflow_index,
        pw.workflow_name,
        pw.status,
        COUNT(ws.id) as step_count,
        SUM(CASE WHEN ws.step_name != '' THEN 1 ELSE 0 END) as completed_steps
      FROM project_workflows pw
      LEFT JOIN workflow_steps ws ON pw.id = ws.project_workflow_id
      WHERE pw.project_id = ?
      GROUP BY pw.id
      ORDER BY pw.workflow_index
    `);
    const workflows = getWorkflowDetailsStmt.all(id);

    // Get observability tools
    const getToolsStmt = db.prepare(`
      SELECT tool_name FROM observability_tools WHERE project_id = ?
    `);
    const tools = getToolsStmt.all(id).map(t => t.tool_name);

    // Calculate overall completion percentage
    const completionStmt = db.prepare(`
      SELECT
        COUNT(DISTINCT pw.id) as total_workflows,
        SUM(CASE WHEN pw.status = 'complete' THEN 1 ELSE 0 END) as complete_workflows
      FROM project_workflows pw
      WHERE pw.project_id = ?
    `);
    const completion = completionStmt.get(id);
    const completionPercentage = completion.total_workflows > 0
      ? Math.round((completion.complete_workflows / completion.total_workflows) * 100)
      : 0;

    // Get average scores across all workflows
    const scoresStmt = db.prepare(`
      SELECT
        AVG(ss.composite_score) as avg_score,
        COUNT(ss.id) as total_scored_steps
      FROM step_scores ss
      JOIN workflow_steps ws ON ss.workflow_step_id = ws.id
      JOIN project_workflows pw ON ws.project_workflow_id = pw.id
      WHERE pw.project_id = ?
    `);
    const scores = scoresStmt.get(id);

    res.json({
      project,
      workflows,
      observability_tools: tools,
      completion: {
        percentage: completionPercentage,
        complete_workflows: completion.complete_workflows,
        total_workflows: completion.total_workflows
      },
      scores: {
        average_composite: Math.round(scores.avg_score || 0),
        total_scored_steps: scores.total_scored_steps || 0
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
