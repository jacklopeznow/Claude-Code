const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../db/connection');

const router = express.Router();

// GET /api/workflows/:workflowId - Get workflow with all steps
router.get('/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const db = getConnection();

    const getWorkflowStmt = db.prepare(`
      SELECT id, project_id, workflow_index, workflow_name, status, updated_at
      FROM project_workflows
      WHERE id = ?
    `);
    const workflow = getWorkflowStmt.get(workflowId);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const getStepsStmt = db.prepare(`
      SELECT
        ws.id,
        ws.step_number,
        ws.step_name,
        ws.description,
        ws.role_team,
        ws.trigger_input,
        ws.systems_tools,
        ws.decision_points,
        ws.output_handoff,
        ws.pain_points,
        ws.time_effort,
        ws.raw_transcript,
        ws.created_at,
        ws.updated_at,
        ss.rule_based_score,
        ss.data_availability_score,
        ss.exception_frequency_score,
        ss.auditability_score,
        ss.speed_sensitivity_score,
        ss.composite_score,
        ss.candidate_tier,
        ss.score_rationale
      FROM workflow_steps ws
      LEFT JOIN step_scores ss ON ws.id = ss.workflow_step_id
      WHERE ws.project_workflow_id = ?
      ORDER BY ws.step_number
    `);
    const steps = getStepsStmt.all(workflowId);

    res.json({
      ...workflow,
      steps
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

// POST /api/workflows/:workflowId/steps - Create a new step
router.post('/:workflowId/steps', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const {
      step_name,
      description,
      role_team,
      trigger_input,
      systems_tools,
      decision_points,
      output_handoff,
      pain_points,
      time_effort,
      raw_transcript
    } = req.body;

    const db = getConnection();

    // Verify workflow exists
    const getWorkflowStmt = db.prepare(`
      SELECT id FROM project_workflows WHERE id = ?
    `);
    const workflow = getWorkflowStmt.get(workflowId);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Get next step number
    const getMaxStepStmt = db.prepare(`
      SELECT MAX(step_number) as max_step FROM workflow_steps WHERE project_workflow_id = ?
    `);
    const result = getMaxStepStmt.get(workflowId);
    const nextStepNumber = (result.max_step || 0) + 1;

    const stepId = uuidv4();

    const insertStepStmt = db.prepare(`
      INSERT INTO workflow_steps (
        id, project_workflow_id, step_number, step_name, description,
        role_team, trigger_input, systems_tools, decision_points,
        output_handoff, pain_points, time_effort, raw_transcript
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStepStmt.run(
      stepId,
      workflowId,
      nextStepNumber,
      step_name || '',
      description || '',
      role_team || '',
      trigger_input || '',
      systems_tools || '',
      decision_points || '',
      output_handoff || '',
      pain_points || '',
      time_effort || '',
      raw_transcript || ''
    );

    const getStepStmt = db.prepare(`
      SELECT * FROM workflow_steps WHERE id = ?
    `);
    const step = getStepStmt.get(stepId);

    res.status(201).json(step);
  } catch (error) {
    console.error('Error creating step:', error);
    res.status(500).json({ error: 'Failed to create step' });
  }
});

// PUT /api/workflows/steps/:stepId - Update a step
router.put('/steps/:stepId', async (req, res) => {
  try {
    const { stepId } = req.params;
    const {
      step_name,
      description,
      role_team,
      trigger_input,
      systems_tools,
      decision_points,
      output_handoff,
      pain_points,
      time_effort,
      raw_transcript
    } = req.body;

    const db = getConnection();

    // Get the step to find its workflow
    const getStepStmt = db.prepare(`
      SELECT project_workflow_id FROM workflow_steps WHERE id = ?
    `);
    const step = getStepStmt.get(stepId);

    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    // Update the step
    const updateStepStmt = db.prepare(`
      UPDATE workflow_steps SET
        step_name = ?,
        description = ?,
        role_team = ?,
        trigger_input = ?,
        systems_tools = ?,
        decision_points = ?,
        output_handoff = ?,
        pain_points = ?,
        time_effort = ?,
        raw_transcript = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `);

    updateStepStmt.run(
      step_name !== undefined ? step_name : '',
      description !== undefined ? description : '',
      role_team !== undefined ? role_team : '',
      trigger_input !== undefined ? trigger_input : '',
      systems_tools !== undefined ? systems_tools : '',
      decision_points !== undefined ? decision_points : '',
      output_handoff !== undefined ? output_handoff : '',
      pain_points !== undefined ? pain_points : '',
      time_effort !== undefined ? time_effort : '',
      raw_transcript !== undefined ? raw_transcript : '',
      stepId
    );

    // Update workflow status to in_progress if not already
    const updateWorkflowStmt = db.prepare(`
      UPDATE project_workflows
      SET status = 'in_progress', updated_at = datetime('now')
      WHERE id = ? AND status = 'not_started'
    `);
    updateWorkflowStmt.run(step.project_workflow_id);

    const updatedStepStmt = db.prepare(`
      SELECT * FROM workflow_steps WHERE id = ?
    `);
    const updatedStep = updatedStepStmt.get(stepId);

    res.json(updatedStep);
  } catch (error) {
    console.error('Error updating step:', error);
    res.status(500).json({ error: 'Failed to update step' });
  }
});

// PUT /api/workflows/:workflowId/status - Update workflow status
router.put('/:workflowId/status', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { status } = req.body;

    if (!['not_started', 'in_progress', 'complete'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: not_started, in_progress, complete'
      });
    }

    const db = getConnection();

    const updateStmt = db.prepare(`
      UPDATE project_workflows
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    updateStmt.run(status, workflowId);

    const getStmt = db.prepare(`
      SELECT * FROM project_workflows WHERE id = ?
    `);
    const workflow = getStmt.get(workflowId);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error) {
    console.error('Error updating workflow status:', error);
    res.status(500).json({ error: 'Failed to update workflow status' });
  }
});

// DELETE /api/workflows/steps/:stepId - Delete a step
router.delete('/steps/:stepId', async (req, res) => {
  try {
    const { stepId } = req.params;
    const db = getConnection();

    // Verify step exists
    const getStepStmt = db.prepare(`
      SELECT id FROM workflow_steps WHERE id = ?
    `);
    const step = getStepStmt.get(stepId);

    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    // Delete associated scores first (due to foreign key)
    const deleteScoresStmt = db.prepare(`
      DELETE FROM step_scores WHERE workflow_step_id = ?
    `);
    deleteScoresStmt.run(stepId);

    // Delete the step
    const deleteStepStmt = db.prepare(`
      DELETE FROM workflow_steps WHERE id = ?
    `);
    deleteStepStmt.run(stepId);

    res.json({ message: 'Step deleted successfully' });
  } catch (error) {
    console.error('Error deleting step:', error);
    res.status(500).json({ error: 'Failed to delete step' });
  }
});

module.exports = router;
