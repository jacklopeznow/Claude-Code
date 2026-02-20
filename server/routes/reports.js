const express = require('express');
const { getConnection } = require('../db/connection');
const { generateReport } = require('../services/claude');

const router = express.Router();

// GET /api/projects/:projectId/workflows/:workflowIndex/report - Generate per-workflow report data
router.get('/:projectId/workflows/:workflowIndex/report', async (req, res) => {
  try {
    const { projectId, workflowIndex } = req.params;
    const db = getConnection();

    // Get workflow by project_id and workflow_index
    const getWorkflowStmt = db.prepare(`
      SELECT pw.id, pw.project_id, pw.workflow_index, pw.workflow_name, pw.status
      FROM project_workflows pw
      WHERE pw.project_id = ? AND pw.workflow_index = ?
    `);
    const workflow = getWorkflowStmt.get(projectId, workflowIndex);

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
        ws.role_team,
        ws.systems_tools,
        ws.decision_points,
        ws.pain_points,
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
    const steps = getStepsStmt.all(workflow.id);

    // Calculate workflow statistics
    const scoredSteps = steps.filter(s => s.composite_score !== null);
    let workflowStats = {
      total_steps: steps.length,
      scored_steps: scoredSteps.length,
      average_composite: 0,
      tier_distribution: {
        autonomous: 0,
        human_in_loop: 0,
        human_only: 0
      }
    };

    if (scoredSteps.length > 0) {
      const compositeSum = scoredSteps.reduce((sum, s) => sum + s.composite_score, 0);
      workflowStats.average_composite = Math.round(compositeSum / scoredSteps.length);

      scoredSteps.forEach((s) => {
        workflowStats.tier_distribution[s.candidate_tier]++;
      });
    }

    // Get related dependency gaps
    const getGapsStmt = db.prepare(`
      SELECT gap_type, severity, description, identified_at
      FROM dependency_gaps
      WHERE project_id = ? AND (workflow_index = ? OR workflow_index IS NULL)
      ORDER BY identified_at DESC
    `);
    const gaps = getGapsStmt.all(projectId, workflowIndex);

    res.json({
      workflow_id: workflow.id,
      workflow_index: workflow.workflow_index,
      workflow_name: workflow.workflow_name,
      status: workflow.status,
      statistics: workflowStats,
      steps: steps.map(s => ({
        step_number: s.step_number,
        step_name: s.step_name,
        description: s.description,
        role_team: s.role_team,
        systems_tools: s.systems_tools,
        decision_points: s.decision_points,
        pain_points: s.pain_points,
        scores: s.composite_score ? {
          rule_based: s.rule_based_score,
          data_availability: s.data_availability_score,
          exception_frequency: s.exception_frequency_score,
          auditability: s.auditability_score,
          speed_sensitivity: s.speed_sensitivity_score,
          composite: s.composite_score,
          tier: s.candidate_tier,
          rationale: s.score_rationale
        } : null
      })),
      dependency_gaps: gaps
    });
  } catch (error) {
    console.error('Error generating workflow report:', error);
    res.status(500).json({ error: 'Failed to generate workflow report' });
  }
});

// DEPRECATED: Old route for reference - kept for now
// GET /api/reports/workflow/:workflowId - Generate per-workflow report data (DEPRECATED)
router.get('/workflow/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const db = getConnection();

    // Get workflow details
    const getWorkflowStmt = db.prepare(`
      SELECT pw.id, pw.project_id, pw.workflow_index, pw.workflow_name, pw.status
      FROM project_workflows pw
      WHERE pw.id = ?
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
        ws.role_team,
        ws.systems_tools,
        ws.decision_points,
        ws.pain_points,
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

    // Calculate workflow statistics
    const scoredSteps = steps.filter(s => s.composite_score !== null);
    let workflowStats = {
      total_steps: steps.length,
      scored_steps: scoredSteps.length,
      average_composite: 0,
      tier_distribution: {
        autonomous: 0,
        human_in_loop: 0,
        human_only: 0
      }
    };

    if (scoredSteps.length > 0) {
      const compositeSum = scoredSteps.reduce((sum, s) => sum + s.composite_score, 0);
      workflowStats.average_composite = Math.round(compositeSum / scoredSteps.length);

      scoredSteps.forEach((s) => {
        workflowStats.tier_distribution[s.candidate_tier]++;
      });
    }

    // Get related dependency gaps
    const getGapsStmt = db.prepare(`
      SELECT gap_type, severity, description, identified_at
      FROM dependency_gaps
      WHERE project_id = ? AND (workflow_index = ? OR workflow_index IS NULL)
      ORDER BY identified_at DESC
    `);
    const gaps = getGapsStmt.all(workflow.project_id, workflow.workflow_index);

    res.json({
      workflow_id: workflowId,
      workflow_index: workflow.workflow_index,
      workflow_name: workflow.workflow_name,
      status: workflow.status,
      statistics: workflowStats,
      steps: steps.map(s => ({
        step_number: s.step_number,
        step_name: s.step_name,
        description: s.description,
        role_team: s.role_team,
        systems_tools: s.systems_tools,
        decision_points: s.decision_points,
        pain_points: s.pain_points,
        scores: s.composite_score ? {
          rule_based: s.rule_based_score,
          data_availability: s.data_availability_score,
          exception_frequency: s.exception_frequency_score,
          auditability: s.auditability_score,
          speed_sensitivity: s.speed_sensitivity_score,
          composite: s.composite_score,
          tier: s.candidate_tier,
          rationale: s.score_rationale
        } : null
      })),
      dependency_gaps: gaps
    });
  } catch (error) {
    console.error('Error generating workflow report:', error);
    res.status(500).json({ error: 'Failed to generate workflow report' });
  }
});

// GET /api/projects/:projectId/report - Generate engagement rollup report data
router.get('/:projectId/report', async (req, res) => {
  try {
    const { projectId } = req.params;
    const db = getConnection();

    // Get project details
    const getProjectStmt = db.prepare(`
      SELECT id, name, client_name, engagement_type, created_at
      FROM projects
      WHERE id = ?
    `);
    const project = getProjectStmt.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get observability tools
    const getToolsStmt = db.prepare(`
      SELECT tool_name FROM observability_tools WHERE project_id = ?
    `);
    const tools = getToolsStmt.all(projectId).map(t => t.tool_name);

    // Get all workflows with completion status and scores
    const getWorkflowsStmt = db.prepare(`
      SELECT
        pw.id,
        pw.workflow_index,
        pw.workflow_name,
        pw.status,
        COUNT(DISTINCT ws.id) as total_steps,
        SUM(CASE WHEN ws.step_name != '' THEN 1 ELSE 0 END) as completed_steps,
        COUNT(DISTINCT ss.id) as scored_steps,
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
    const workflows = getWorkflowsStmt.all(projectId);

    // Calculate project-level metrics
    let projectStats = {
      total_workflows: workflows.length,
      completed_workflows: 0,
      total_steps: 0,
      completed_steps: 0,
      total_scored_steps: 0,
      average_composite: 0,
      tier_distribution: {
        autonomous: 0,
        human_in_loop: 0,
        human_only: 0
      }
    };

    let totalCompositeSum = 0;
    let totalScoredCount = 0;

    workflows.forEach((w) => {
      if (w.status === 'complete') projectStats.completed_workflows++;
      projectStats.total_steps += w.total_steps;
      projectStats.completed_steps += w.completed_steps || 0;
      projectStats.total_scored_steps += w.scored_steps || 0;

      if (w.scored_steps > 0) {
        totalCompositeSum += w.avg_composite * w.scored_steps;
        totalScoredCount += w.scored_steps;
      }

      projectStats.tier_distribution.autonomous += w.autonomous_count || 0;
      projectStats.tier_distribution.human_in_loop += w.human_in_loop_count || 0;
      projectStats.tier_distribution.human_only += w.human_only_count || 0;
    });

    projectStats.average_composite = totalScoredCount > 0
      ? Math.round(totalCompositeSum / totalScoredCount)
      : 0;

    // Get dependency gaps summary
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

    const gapSummary = {
      cmdb: { red: 0, amber: 0, green: 0 },
      discovery: { red: 0, amber: 0, green: 0 },
      observability: { red: 0, amber: 0, green: 0 },
      other: { red: 0, amber: 0, green: 0 }
    };

    gapsSummary.forEach((row) => {
      if (gapSummary[row.gap_type]) {
        gapSummary[row.gap_type][row.severity] = row.count;
      }
    });

    res.json({
      project_id: projectId,
      project_name: project.name,
      client_name: project.client_name,
      engagement_type: project.engagement_type,
      created_at: project.created_at,
      statistics: projectStats,
      dependency_gaps_summary: gapSummary,
      observability_tools: tools,
      workflows: workflows.map(w => ({
        id: w.id,
        workflow_index: w.workflow_index,
        workflow_name: w.workflow_name,
        status: w.status,
        total_steps: w.total_steps,
        completed_steps: w.completed_steps || 0,
        scored_steps: w.scored_steps || 0,
        average_composite: w.avg_composite ? Math.round(w.avg_composite) : 0,
        tier_distribution: {
          autonomous: w.autonomous_count || 0,
          human_in_loop: w.human_in_loop_count || 0,
          human_only: w.human_only_count || 0
        }
      }))
    });
  } catch (error) {
    console.error('Error generating project report:', error);
    res.status(500).json({ error: 'Failed to generate project report' });
  }
});

// GET /api/projects/:projectId/reports/pdf - Generate PDF report
router.get('/:projectId/reports/pdf', async (req, res) => {
  try {
    const { projectId } = req.params;
    const db = getConnection();

    // Get project details
    const getProjectStmt = db.prepare(`
      SELECT id, name, client_name, engagement_type, created_at
      FROM projects
      WHERE id = ?
    `);
    const project = getProjectStmt.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Gather comprehensive project data for report generation
    const getWorkflowsStmt = db.prepare(`
      SELECT
        pw.id,
        pw.workflow_index,
        pw.workflow_name,
        pw.status,
        COUNT(DISTINCT ws.id) as total_steps,
        AVG(ss.composite_score) as avg_composite
      FROM project_workflows pw
      LEFT JOIN workflow_steps ws ON pw.id = ws.project_workflow_id
      LEFT JOIN step_scores ss ON ws.id = ss.workflow_step_id
      WHERE pw.project_id = ?
      GROUP BY pw.id
      ORDER BY pw.workflow_index
    `);
    const workflows = getWorkflowsStmt.all(projectId);

    // Calculate metrics
    const completedCount = workflows.filter(w => w.status === 'complete').length;
    const completionPercentage = Math.round((completedCount / workflows.length) * 100);
    const avgScore = workflows.reduce((sum, w) => sum + (w.avg_composite || 0), 0) / workflows.length;
    const readinessTier = avgScore >= 20 ? 'autonomous' : avgScore >= 13 ? 'human_in_loop' : 'human_only';

    // Generate AI report
    const reportText = await generateReport({
      name: project.name,
      client_name: project.client_name,
      engagement_type: project.engagement_type,
      workflows,
      completionPercentage,
      readinessTier
    });

    // Get tools
    const getToolsStmt = db.prepare(`
      SELECT tool_name FROM observability_tools WHERE project_id = ?
    `);
    const tools = getToolsStmt.all(projectId).map(t => t.tool_name);

    // Generate HTML report (can be converted to PDF server-side with puppeteer)
    const htmlReport = generateHTMLReport({
      project,
      workflows,
      completionPercentage,
      avgScore,
      reportText,
      tools
    });

    // If puppeteer is available, generate PDF
    // For now, return HTML with application/pdf header for HTML rendering
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="enscope-report-${projectId}.html"`);
    res.send(htmlReport);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

function generateHTMLReport(data) {
  const {
    project,
    workflows,
    completionPercentage,
    avgScore,
    reportText,
    tools
  } = data;

  const date = new Date().toLocaleDateString();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Enscope Report - ${project.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 40px;
      color: #333;
      background: white;
    }
    .header {
      margin-bottom: 40px;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 20px;
    }
    h1 {
      margin: 0;
      color: #0066cc;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-top: 5px;
    }
    .date {
      color: #999;
      font-size: 12px;
      margin-top: 10px;
    }
    .metrics {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-bottom: 40px;
    }
    .metric-card {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #0066cc;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #0066cc;
    }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      color: #0066cc;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #f5f5f5;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #ddd;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #ddd;
    }
    tr:hover {
      background: #f9f9f9;
    }
    .status-complete {
      color: #28a745;
      font-weight: bold;
    }
    .status-in-progress {
      color: #ffc107;
      font-weight: bold;
    }
    .status-not-started {
      color: #999;
    }
    .report-text {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      line-height: 1.6;
    }
    .tools {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 10px;
    }
    .tool-badge {
      background: #e7f3ff;
      color: #0066cc;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #999;
      font-size: 12px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${project.name}</h1>
    <p class="subtitle">${project.client_name} | ${project.engagement_type}</p>
    <p class="date">Generated: ${date}</p>
  </div>

  <div class="metrics">
    <div class="metric-card">
      <div class="metric-label">Workflow Completion</div>
      <div class="metric-value">${completionPercentage}%</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Average Automation Readiness</div>
      <div class="metric-value">${Math.round(avgScore)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Readiness Tier</div>
      <div class="metric-value" style="font-size: 18px; text-transform: capitalize;">${avgScore >= 20 ? 'Autonomous' : avgScore >= 13 ? 'Human-in-Loop' : 'Human-Only'}</div>
    </div>
  </div>

  <div class="section">
    <h2>Executive Summary</h2>
    <div class="report-text">
      ${reportText.replace(/\n/g, '<br>')}
    </div>
  </div>

  <div class="section">
    <h2>Workflow Status</h2>
    <table>
      <thead>
        <tr>
          <th>Workflow</th>
          <th>Status</th>
          <th>Steps</th>
          <th>Avg Readiness</th>
        </tr>
      </thead>
      <tbody>
        ${workflows.map(w => `
          <tr>
            <td><strong>${w.workflow_name}</strong></td>
            <td><span class="status-${w.status}">${w.status.replace('_', ' ')}</span></td>
            <td>${w.total_steps}</td>
            <td>${w.avg_composite ? Math.round(w.avg_composite) : 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  ${tools.length > 0 ? `
  <div class="section">
    <h2>Observability Tools</h2>
    <div class="tools">
      ${tools.map(t => `<span class="tool-badge">${t}</span>`).join('')}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>Enscope - IT Automation Assessment Platform</p>
    <p>This report provides a comprehensive view of automation readiness across your event management workflows.</p>
  </div>
</body>
</html>
  `;
}

module.exports = router;
