const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../db/connection');

const router = express.Router();

// GET /api/gaps/:projectId - Get all gaps for project (must be before summary route)
router.get('/:projectId/summary', async (req, res) => {
  try {
    const { projectId } = req.params;
    const db = getConnection();

    // Get gaps by type and severity
    const getGapsSummaryStmt = db.prepare(`
      SELECT
        gap_type,
        severity,
        COUNT(*) as count
      FROM dependency_gaps
      WHERE project_id = ?
      GROUP BY gap_type, severity
    `);
    const gapsSummary = getGapsSummaryStmt.all(projectId);

    // Organize by type
    const summary = {
      cmdb: { red: 0, amber: 0, green: 0 },
      discovery: { red: 0, amber: 0, green: 0 },
      observability: { red: 0, amber: 0, green: 0 },
      other: { red: 0, amber: 0, green: 0 }
    };

    gapsSummary.forEach((row) => {
      if (summary[row.gap_type]) {
        summary[row.gap_type][row.severity] = row.count;
      }
    });

    // Calculate overall status per dimension
    const dimensionStatus = {};
    Object.entries(summary).forEach(([dimension, severities]) => {
      if (severities.red > 0) {
        dimensionStatus[dimension] = 'red';
      } else if (severities.amber > 0) {
        dimensionStatus[dimension] = 'amber';
      } else {
        dimensionStatus[dimension] = 'green';
      }
    });

    res.json({
      project_id: projectId,
      summary,
      dimension_status: dimensionStatus
    });
  } catch (error) {
    console.error('Error fetching gaps summary:', error);
    res.status(500).json({ error: 'Failed to fetch gaps summary' });
  }
});

// GET /api/gaps/:projectId - Get all gaps for project
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const db = getConnection();

    const getGapsStmt = db.prepare(`
      SELECT
        id,
        project_id,
        workflow_index,
        gap_type,
        severity,
        description,
        identified_at
      FROM dependency_gaps
      WHERE project_id = ?
      ORDER BY identified_at DESC
    `);
    const gaps = getGapsStmt.all(projectId);

    res.json({
      project_id: projectId,
      total_gaps: gaps.length,
      gaps
    });
  } catch (error) {
    console.error('Error fetching gaps:', error);
    res.status(500).json({ error: 'Failed to fetch gaps' });
  }
});

// POST /api/gaps - Create a gap
router.post('/', async (req, res) => {
  try {
    const { project_id, workflow_index, gap_type, severity, description } = req.body;

    if (!project_id || !workflow_index || !gap_type || !severity || !description) {
      return res.status(400).json({
        error: 'Missing required fields: project_id, workflow_index, gap_type, severity, description'
      });
    }

    if (!['cmdb', 'discovery', 'observability', 'other'].includes(gap_type)) {
      return res.status(400).json({
        error: 'Invalid gap_type. Must be one of: cmdb, discovery, observability, other'
      });
    }

    if (!['red', 'amber', 'green'].includes(severity)) {
      return res.status(400).json({
        error: 'Invalid severity. Must be one of: red, amber, green'
      });
    }

    const db = getConnection();

    const gapId = uuidv4();

    const insertGapStmt = db.prepare(`
      INSERT INTO dependency_gaps (id, project_id, workflow_index, gap_type, severity, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertGapStmt.run(gapId, project_id, workflow_index, gap_type, severity, description);

    const getGapStmt = db.prepare(`
      SELECT * FROM dependency_gaps WHERE id = ?
    `);
    const gap = getGapStmt.get(gapId);

    res.status(201).json(gap);
  } catch (error) {
    console.error('Error creating gap:', error);
    res.status(500).json({ error: 'Failed to create gap' });
  }
});

// PUT /api/gaps/:gapId - Update a gap
router.put('/:gapId', async (req, res) => {
  try {
    const { gapId } = req.params;
    const { gap_type, severity, description } = req.body;

    const db = getConnection();

    // Verify gap exists
    const getGapStmt = db.prepare(`
      SELECT * FROM dependency_gaps WHERE id = ?
    `);
    const gap = getGapStmt.get(gapId);

    if (!gap) {
      return res.status(404).json({ error: 'Gap not found' });
    }

    const updateGapStmt = db.prepare(`
      UPDATE dependency_gaps
      SET
        gap_type = ?,
        severity = ?,
        description = ?
      WHERE id = ?
    `);

    updateGapStmt.run(
      gap_type || gap.gap_type,
      severity || gap.severity,
      description || gap.description,
      gapId
    );

    const updatedGapStmt = db.prepare(`
      SELECT * FROM dependency_gaps WHERE id = ?
    `);
    const updatedGap = updatedGapStmt.get(gapId);

    res.json(updatedGap);
  } catch (error) {
    console.error('Error updating gap:', error);
    res.status(500).json({ error: 'Failed to update gap' });
  }
});

// DELETE /api/gaps/:gapId - Delete a gap
router.delete('/:gapId', async (req, res) => {
  try {
    const { gapId } = req.params;
    const db = getConnection();

    // Verify gap exists
    const getGapStmt = db.prepare(`
      SELECT id FROM dependency_gaps WHERE id = ?
    `);
    const gap = getGapStmt.get(gapId);

    if (!gap) {
      return res.status(404).json({ error: 'Gap not found' });
    }

    const deleteGapStmt = db.prepare(`
      DELETE FROM dependency_gaps WHERE id = ?
    `);
    deleteGapStmt.run(gapId);

    res.json({ message: 'Gap deleted successfully' });
  } catch (error) {
    console.error('Error deleting gap:', error);
    res.status(500).json({ error: 'Failed to delete gap' });
  }
});

module.exports = router;
