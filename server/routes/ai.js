const express = require('express');
const { getConnection } = require('../db/connection');
const { generateAssistance, scoreStep } = require('../services/claude');
const { assemblePrompt } = require('../services/prompts');

const router = express.Router();

// POST /api/ai/assist - Real-time field assistance
router.post('/assist', async (req, res) => {
  try {
    const {
      projectId,
      workflowIndex,
      fieldName,
      fieldValue,
      allStepData
    } = req.body;

    if (!projectId || !workflowIndex || !fieldName) {
      return res.status(400).json({
        error: 'Missing required fields: projectId, workflowIndex, fieldName'
      });
    }

    const db = getConnection();

    // Get project to retrieve observability tools and workflow name
    const getProjectStmt = db.prepare(`
      SELECT id, name FROM projects WHERE id = ?
    `);
    const project = getProjectStmt.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get observability tools for this project
    const getToolsStmt = db.prepare(`
      SELECT tool_name FROM observability_tools WHERE project_id = ?
    `);
    const tools = getToolsStmt.all(projectId).map(t => t.tool_name);

    // Get workflow name
    const getWorkflowStmt = db.prepare(`
      SELECT workflow_name FROM project_workflows
      WHERE project_id = ? AND workflow_index = ?
    `);
    const workflow = getWorkflowStmt.get(projectId, workflowIndex);
    const workflowName = workflow?.workflow_name || `Workflow ${workflowIndex}`;

    // Assemble the system prompt
    const systemPrompt = assemblePrompt(workflowIndex, fieldName, tools, workflowName);

    // Create user message with context
    let userMessage = `Please provide guidance for the "${fieldName}" field.\n`;
    if (fieldValue) {
      userMessage += `Current value: "${fieldValue}"\n`;
    }
    if (allStepData) {
      userMessage += `\nContext from other fields:\n`;
      Object.entries(allStepData).forEach(([key, value]) => {
        if (value) {
          userMessage += `- ${key}: ${value}\n`;
        }
      });
    }
    userMessage += `\nProvide specific, actionable guidance for this field.`;

    // Call Claude for assistance
    const guidance = await generateAssistance(systemPrompt, userMessage);

    // Check for RED dependency gaps that might be relevant
    const getGapsStmt = db.prepare(`
      SELECT gap_type, description FROM dependency_gaps
      WHERE project_id = ? AND severity = 'red'
      ORDER BY identified_at DESC
      LIMIT 3
    `);
    const redGaps = getGapsStmt.all(projectId);

    const gapFlags = redGaps.map(gap => ({
      type: gap.gap_type,
      description: gap.description
    }));

    res.json({
      field_name: fieldName,
      workflow_index: workflowIndex,
      guidance,
      gap_flags: gapFlags,
      relevant_tools: tools
    });
  } catch (error) {
    console.error('Error in field assistance:', error);
    res.status(500).json({ error: `Failed to generate assistance: ${error.message}` });
  }
});

// POST /api/ai/score-step - Score a single step
router.post('/score-step', async (req, res) => {
  try {
    const { stepData, workflowData } = req.body;

    if (!stepData || !workflowData) {
      return res.status(400).json({
        error: 'Missing required fields: stepData, workflowData'
      });
    }

    // Call Claude to score the step
    const scores = await scoreStep(stepData, workflowData);

    res.json({
      step_id: stepData.id,
      step_name: stepData.step_name,
      scores: {
        rule_based_score: scores.rule_based_score,
        data_availability_score: scores.data_availability_score,
        exception_frequency_score: scores.exception_frequency_score,
        auditability_score: scores.auditability_score,
        speed_sensitivity_score: scores.speed_sensitivity_score,
        composite_score: scores.composite_score,
        candidate_tier: scores.candidate_tier
      },
      rationale: scores.score_rationale
    });
  } catch (error) {
    console.error('Error scoring step:', error);
    res.status(500).json({ error: `Failed to score step: ${error.message}` });
  }
});

module.exports = router;
