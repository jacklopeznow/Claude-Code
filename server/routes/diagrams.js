const express = require('express');
const { getConnection } = require('../db/connection');

const router = express.Router();

// GET /api/diagrams/workflow/:workflowId - Generate Mermaid diagram definition
router.get('/workflow/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const db = getConnection();

    // Get workflow details
    const getWorkflowStmt = db.prepare(`
      SELECT id, workflow_index, workflow_name, status
      FROM project_workflows
      WHERE id = ?
    `);
    const workflow = getWorkflowStmt.get(workflowId);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Get all steps with scores for this workflow
    const getStepsStmt = db.prepare(`
      SELECT
        ws.id,
        ws.step_number,
        ws.step_name,
        ws.description,
        ws.pain_points,
        ss.composite_score,
        ss.candidate_tier
      FROM workflow_steps ws
      LEFT JOIN step_scores ss ON ws.id = ss.workflow_step_id
      WHERE ws.project_workflow_id = ?
      ORDER BY ws.step_number
    `);
    const steps = getStepsStmt.all(workflowId);

    if (steps.length === 0) {
      return res.json({
        workflow_id: workflowId,
        workflow_name: workflow.workflow_name,
        mermaid_diagram: 'graph TD\n  Start["No steps defined"]'
      });
    }

    // Generate Mermaid diagram
    const mermaidDiagram = generateMermaidDiagram(workflow, steps);

    res.json({
      workflow_id: workflowId,
      workflow_index: workflow.workflow_index,
      workflow_name: workflow.workflow_name,
      status: workflow.status,
      total_steps: steps.length,
      mermaid_diagram: mermaidDiagram
    });
  } catch (error) {
    console.error('Error generating diagram:', error);
    res.status(500).json({ error: 'Failed to generate diagram' });
  }
});

function generateMermaidDiagram(workflow, steps) {
  let diagram = 'graph TD\n';
  diagram += `  Start["${workflow.workflow_name}"]`;

  // Color mapping based on automation tier
  const tierColors = {
    autonomous: '#28a745',
    human_in_loop: '#ffc107',
    human_only: '#dc3545',
    null: '#6c757d'
  };

  const tierLabels = {
    autonomous: 'Autonomous',
    human_in_loop: 'Human-in-Loop',
    human_only: 'Human-Only',
    null: 'Not Scored'
  };

  steps.forEach((step, index) => {
    const stepId = `Step${step.step_number}`;
    const nodeLabel = step.step_name || `Step ${step.step_number}`;
    const tier = step.candidate_tier || 'null';
    const color = tierColors[tier];
    const tierLabel = tierLabels[tier];

    // Create step node with tier indicator
    let nodeText = `${nodeLabel}`;
    if (step.composite_score !== null) {
      nodeText += `<br/><strong>Score: ${step.composite_score}</strong><br/><em>${tierLabel}</em>`;
    } else {
      nodeText += `<br/><em>${tierLabel}</em>`;
    }

    diagram += `\n  ${stepId}["${nodeText}"]:::tier_${tier.replace('-', '_')}`;

    // Add description as a comment if available
    if (step.description && step.description.length > 0) {
      const descShort = step.description.substring(0, 50) + (step.description.length > 50 ? '...' : '');
      diagram += `\n  ${stepId}_Desc["${descShort}"]:::description`;
      diagram += `\n  ${stepId} --> ${stepId}_Desc`;
    }

    // Add pain points if available
    if (step.pain_points && step.pain_points.length > 0) {
      const painShort = step.pain_points.substring(0, 40) + (step.pain_points.length > 40 ? '...' : '');
      diagram += `\n  ${stepId}_Pain["⚠ ${painShort}"]:::pain`;
      diagram += `\n  ${stepId} --> ${stepId}_Pain`;
    }
  });

  // Connect steps in sequence
  diagram += '\n  Start';
  steps.forEach((step) => {
    diagram += ` --> Step${step.step_number}`;
  });
  diagram += ' --> End["Workflow Complete"]';

  // Add styling classes
  diagram += '\n  classDef tier_autonomous fill:' + tierColors.autonomous + ',stroke:#1e7e34,color:#fff;';
  diagram += '\n  classDef tier_human_in_loop fill:' + tierColors.human_in_loop + ',stroke:#e0a800,color:#000;';
  diagram += '\n  classDef tier_human_only fill:' + tierColors.human_only + ',stroke:#bd2130,color:#fff;';
  diagram += '\n  classDef tier_null fill:' + tierColors.null + ',stroke:#5a6268,color:#fff;';
  diagram += '\n  classDef description fill:#e7f3ff,stroke:#0066cc,color:#000;';
  diagram += '\n  classDef pain fill:#ffe7e7,stroke:#dc3545,color:#000;';
  diagram += '\n  classDef start fill:#0066cc,stroke:#004a99,color:#fff;';
  diagram += '\n  classDef end fill:#28a745,stroke:#1e7e34,color:#fff;';
  diagram += '\n  class Start start;';
  diagram += '\n  class End end;';

  return diagram;
}

module.exports = router;
