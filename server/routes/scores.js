const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../db/connection');
const { scoreStep } = require('../services/claude');

const router = express.Router();

// POST /api/scores/generate/:workflowId - Score all steps in a workflow
router.post('/generate/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const db = getConnection();

    // Get workflow details
    const getWorkflowStmt = db.prepare(`
      SELECT pw.id, pw.project_id, pw.workflow_index, pw.workflow_name
      FROM project_workflows pw
      WHERE pw.id = ?
    `);
    const workflow = getWorkflowStmt.get(workflowId);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Get all steps for this workflow
    const getStepsStmt = db.prepare(`
      SELECT * FROM workflow_steps
      WHERE project_workflow_id = ?
      ORDER BY step_number
    `);
    const steps = getStepsStmt.all(workflowId);

    if (steps.length === 0) {
      return res.status(400).json({ error: 'Workflow has no steps to score' });
    }

    // Get project to check for dependency gaps
    const getProjectStmt = db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `);
    const project = getProjectStmt.get(workflow.project_id);

    // Check for RED dependency gaps in CMDB or Discovery that affect this workflow
    const getGapsStmt = db.prepare(`
      SELECT COUNT(*) as red_gap_count FROM dependency_gaps
      WHERE project_id = ? AND severity = 'red'
      AND gap_type IN ('cmdb', 'discovery')
      AND workflow_index IN (?, ?)
    `);
    const gapCheck = getGapsStmt.get(workflow.project_id, 3, 5);
    const hasRedGaps = gapCheck.red_gap_count > 0;

    // Score each step
    const upsertScoreStmt = db.prepare(`
      INSERT INTO step_scores (
        id, workflow_step_id, rule_based_score, data_availability_score,
        exception_frequency_score, auditability_score, speed_sensitivity_score,
        composite_score, candidate_tier, score_rationale
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(workflow_step_id) DO UPDATE SET
        rule_based_score = excluded.rule_based_score,
        data_availability_score = excluded.data_availability_score,
        exception_frequency_score = excluded.exception_frequency_score,
        auditability_score = excluded.auditability_score,
        speed_sensitivity_score = excluded.speed_sensitivity_score,
        composite_score = excluded.composite_score,
        candidate_tier = excluded.candidate_tier,
        score_rationale = excluded.score_rationale
    `);

    const results = [];

    for (const step of steps) {
      try {
        const scores = await scoreStep(step, workflow);

        // Apply contextual reliability modifier for RED gaps
        let modifiedComposite = scores.composite_score;
        if (hasRedGaps && (workflow.workflow_index === 3 || workflow.workflow_index === 5)) {
          modifiedComposite = Math.max(0, scores.composite_score - 4);
        }

        // Recalculate tier based on modified composite
        let tier = 'human_only';
        if (modifiedComposite >= 20) {
          tier = 'autonomous';
        } else if (modifiedComposite >= 13) {
          tier = 'human_in_loop';
        }

        const scoreId = uuidv4();
        upsertScoreStmt.run(
          scoreId,
          step.id,
          scores.rule_based_score,
          scores.data_availability_score,
          scores.exception_frequency_score,
          scores.auditability_score,
          scores.speed_sensitivity_score,
          modifiedComposite,
          tier,
          scores.score_rationale
        );

        results.push({
          step_id: step.id,
          step_name: step.step_name,
          scores: {
            rule_based: scores.rule_based_score,
            data_availability: scores.data_availability_score,
            exception_frequency: scores.exception_frequency_score,
            auditability: scores.auditability_score,
            speed_sensitivity: scores.speed_sensitivity_score,
            composite: modifiedComposite,
            tier
          }
        });
      } catch (error) {
        console.error(`Error scoring step ${step.id}:`, error);
        results.push({
          step_id: step.id,
          step_name: step.step_name,
          error: error.message
        });
      }
    }

    res.json({
      workflow_id: workflowId,
      workflow_name: workflow.workflow_name,
      scored_steps: results.length,
      results
    });
  } catch (error) {
    console.error('Error generating scores:', error);
    res.status(500).json({ error: 'Failed to generate scores' });
  }
});

// GET /api/scores/workflow/:workflowId - Get all scores for a workflow
router.get('/workflow/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const db = getConnection();

    // Get workflow
    const getWorkflowStmt = db.prepare(`
      SELECT * FROM project_workflows WHERE id = ?
    `);
    const workflow = getWorkflowStmt.get(workflowId);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Get all scores for steps in this workflow
    const getScoresStmt = db.prepare(`
      SELECT
        ss.id,
        ss.workflow_step_id,
        ws.step_number,
        ws.step_name,
        ss.rule_based_score,
        ss.data_availability_score,
        ss.exception_frequency_score,
        ss.auditability_score,
        ss.speed_sensitivity_score,
        ss.composite_score,
        ss.candidate_tier,
        ss.score_rationale
      FROM step_scores ss
      JOIN workflow_steps ws ON ss.workflow_step_id = ws.id
      WHERE ws.project_workflow_id = ?
      ORDER BY ws.step_number
    `);
    const scores = getScoresStmt.all(workflowId);

    // Calculate workflow-level statistics
    let avgComposite = 0;
    let avgTierScores = { autonomous: 0, human_in_loop: 0, human_only: 0 };

    if (scores.length > 0) {
      const compositeSum = scores.reduce((sum, s) => sum + s.composite_score, 0);
      avgComposite = Math.round(compositeSum / scores.length);

      scores.forEach((s) => {
        avgTierScores[s.candidate_tier]++;
      });

      Object.keys(avgTierScores).forEach((tier) => {
        avgTierScores[tier] = Math.round((avgTierScores[tier] / scores.length) * 100);
      });
    }

    res.json({
      workflow_id: workflowId,
      workflow_name: workflow.workflow_name,
      total_scored_steps: scores.length,
      average_composite_score: avgComposite,
      tier_distribution: avgTierScores,
      scores
    });
  } catch (error) {
    console.error('Error fetching workflow scores:', error);
    res.status(500).json({ error: 'Failed to fetch workflow scores' });
  }
});

// GET /api/scores/project/:projectId - Get all scores across project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const db = getConnection();

    // Get project
    const getProjectStmt = db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `);
    const project = getProjectStmt.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get all workflows for this project with scores
    const getWorkflowScoresStmt = db.prepare(`
      SELECT
        pw.id,
        pw.workflow_index,
        pw.workflow_name,
        pw.status,
        COUNT(ss.id) as scored_steps,
        AVG(ss.composite_score) as avg_composite,
        SUM(CASE WHEN ss.candidate_tier = 'autonomous' THEN 1 ELSE 0 END) as autonomous_count,
        SUM(CASE WHEN ss.candidate_tier = 'human_in_loop' THEN 1 ELSE 0 END) as human_in_loop_count,
        SUM(CASE WHEN ss.candidate_tier = 'human_only' THEN 1 ELSE 0 END) as human_only_count
      FROM project_workflows pw
      LEFT JOIN workflow_steps ws ON pw.id = ws.project_workflow_id
      LEFT JOIN step_scores ss ON ws.id = ss.workflow_step_id
      WHERE pw.project_id = ?
      GROUP BY pw.id
      ORDER BY pw.workflow_index
    `);
    const workflowScores = getWorkflowScoresStmt.all(projectId);

    // Calculate project-level engagement metrics
    let totalScoredSteps = 0;
    let totalComposite = 0;
    let tierCounts = { autonomous: 0, human_in_loop: 0, human_only: 0 };

    workflowScores.forEach((w) => {
      if (w.scored_steps > 0) {
        totalScoredSteps += w.scored_steps;
        totalComposite += w.avg_composite * w.scored_steps;
        tierCounts.autonomous += w.autonomous_count || 0;
        tierCounts.human_in_loop += w.human_in_loop_count || 0;
        tierCounts.human_only += w.human_only_count || 0;
      }
    });

    const engagementLevel = {
      avg_composite_score: totalScoredSteps > 0 ? Math.round(totalComposite / totalScoredSteps) : 0,
      total_scored_steps: totalScoredSteps,
      tier_distribution: {
        autonomous: tierCounts.autonomous,
        human_in_loop: tierCounts.human_in_loop,
        human_only: tierCounts.human_only
      }
    };

    res.json({
      project_id: projectId,
      project_name: project.name,
      client_name: project.client_name,
      engagement_level: engagementLevel,
      workflows: workflowScores
    });
  } catch (error) {
    console.error('Error fetching project scores:', error);
    res.status(500).json({ error: 'Failed to fetch project scores' });
  }
});

module.exports = router;
