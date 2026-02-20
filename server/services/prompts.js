const fs = require('fs');
const path = require('path');

const PROMPTS_DIR = path.join(__dirname, '../prompts');

function ensurePromptsDir() {
  if (!fs.existsSync(PROMPTS_DIR)) {
    fs.mkdirSync(PROMPTS_DIR, { recursive: true });
  }
}

function loadGlobalPrompt() {
  const promptPath = path.join(PROMPTS_DIR, 'global-system-context.txt');

  if (fs.existsSync(promptPath)) {
    return fs.readFileSync(promptPath, 'utf-8');
  }

  // Return default global context if file doesn't exist
  return `You are an expert in IT Operations Management (ITOM) and event management automation.
Your role is to provide guidance on automating IT event and incident management workflows.
Consider the following when making recommendations:
- Automation readiness based on rule clarity, data availability, and exception frequency
- Risk and compliance implications
- Integration with existing CMDB, discovery tools, and observability platforms
- Team capabilities and training requirements
- Gradual automation path (human_only -> human_in_loop -> autonomous)`;
}

function loadWorkflowPrompt(workflowIndex) {
  const promptPath = path.join(PROMPTS_DIR, `workflow-${workflowIndex}.txt`);

  if (fs.existsSync(promptPath)) {
    return fs.readFileSync(promptPath, 'utf-8');
  }

  // Return default workflow-specific prompts
  const workflowPrompts = {
    1: `Focus on signal intake and event detection:
- How clear are event sources and detection rules?
- What's the coverage of monitoring across infrastructure?
- Are there gaps in observability?`,
    2: `Focus on triage and classification:
- How well-defined are triage criteria?
- What enrichment data is available?
- Are classification rules consistent?`,
    3: `Focus on correlation and context enrichment:
- How accessible is context data (CMDB, discovery)?
- Can events be reliably correlated?
- What tools are used for enrichment?`,
    4: `Focus on assignment and coordination:
- How clear are escalation rules?
- What team structures exist?
- How is work assigned and tracked?`,
    5: `Focus on diagnosis and resolution:
- How well-documented are runbooks?
- What systems can automate remediation?
- How reliable are resolution steps?`,
    6: `Focus on escalation and major incident management:
- What defines a major incident?
- How are stakeholders notified?
- What escalation paths exist?`,
    7: `Focus on verification and closure:
- How is resolution verified?
- What verification steps are automated?
- How are false positives handled?`,
    8: `Focus on post-incident review and learning:
- How are lessons captured?
- What metrics are tracked?
- How are improvements implemented?`
  };

  return workflowPrompts[workflowIndex] || '';
}

function assemblePrompt(workflowIndex, fieldName, observabilityTools = [], workflowName = '') {
  ensurePromptsDir();

  const globalPrompt = loadGlobalPrompt();
  const workflowPrompt = loadWorkflowPrompt(workflowIndex);

  let toolsList = 'None specified';
  if (Array.isArray(observabilityTools) && observabilityTools.length > 0) {
    toolsList = observabilityTools.join(', ');
  }

  const assembledPrompt = `${globalPrompt}

WORKFLOW CONTEXT:
Workflow: ${workflowName || `Workflow ${workflowIndex}`}
Field Being Completed: ${fieldName}
Available Tools: ${toolsList}

WORKFLOW-SPECIFIC GUIDANCE:
${workflowPrompt}

Provide targeted guidance for filling in the "${fieldName}" field considering the workflow and available tools.`;

  return assembledPrompt;
}

module.exports = {
  loadGlobalPrompt,
  loadWorkflowPrompt,
  assemblePrompt,
  ensurePromptsDir
};
