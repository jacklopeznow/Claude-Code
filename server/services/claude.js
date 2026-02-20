const https = require('https');

const MODEL = 'claude-sonnet-4-20250514';
const API_URL = 'https://api.anthropic.com/v1/messages';

function callClaude(systemPrompt, userMessage, maxTokens = 1024) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    });

    const url = new URL(API_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject(new Error(`Claude API error ${res.statusCode}: ${parsed.error?.message || data}`));
            return;
          }
          const content = parsed.content?.[0];
          if (content?.type === 'text') {
            resolve(content.text);
          } else {
            reject(new Error('Unexpected response type from Claude'));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Claude response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`Claude API request failed: ${e.message}`)));
    req.write(body);
    req.end();
  });
}

async function generateAssistance(systemPrompt, userMessage) {
  try {
    return await callClaude(systemPrompt, userMessage);
  } catch (error) {
    console.error('Claude API error in generateAssistance:', error);
    throw new Error(`Failed to generate assistance: ${error.message}`);
  }
}

async function scoreStep(stepData, workflowContext) {
  try {
    const systemPrompt = `You are an expert in IT Operations Management (ITOM) and event management automation.
You will score workflow steps on their automation readiness across 5 dimensions, each on a scale of 1-5.
Return your response as a JSON object with the following structure:
{
  "rule_based_score": <number 1-5>,
  "data_availability_score": <number 1-5>,
  "exception_frequency_score": <number 1-5>,
  "auditability_score": <number 1-5>,
  "speed_sensitivity_score": <number 1-5>,
  "rationale": "<detailed explanation of scores>"
}

Scoring guidance:
- Rule Based: How well-defined and consistent are the decision criteria? (1=very vague, 5=crystal clear rules)
- Data Availability: What percentage and quality of input data is readily available? (1=<20%, 5=>95%)
- Exception Frequency: How often do exceptions/edge cases occur? (1=very frequent, 5=rarely)
- Auditability: How well can decisions be tracked and audited? (1=no audit trail, 5=full traceability)
- Speed Sensitivity: How time-critical is this step? (1=not urgent, 5=seconds matter)`;

    const userMessage = `Score this workflow step for automation readiness:
Step Name: ${stepData.step_name || 'Untitled'}
Description: ${stepData.description || 'N/A'}
Role/Team: ${stepData.role_team || 'N/A'}
Trigger Input: ${stepData.trigger_input || 'N/A'}
Systems/Tools: ${stepData.systems_tools || 'N/A'}
Decision Points: ${stepData.decision_points || 'N/A'}
Output/Handoff: ${stepData.output_handoff || 'N/A'}
Pain Points: ${stepData.pain_points || 'N/A'}
Time/Effort: ${stepData.time_effort || 'N/A'}
Workflow: ${workflowContext.workflow_name || 'Unknown'}`;

    const text = await callClaude(systemPrompt, userMessage);

    let jsonStr = text;
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const scores = JSON.parse(jsonStr);

    const composite =
      scores.rule_based_score +
      scores.data_availability_score +
      scores.exception_frequency_score +
      scores.auditability_score +
      scores.speed_sensitivity_score;

    let tier = 'human_only';
    if (composite >= 20) {
      tier = 'autonomous';
    } else if (composite >= 13) {
      tier = 'human_in_loop';
    }

    return {
      rule_based_score: scores.rule_based_score,
      data_availability_score: scores.data_availability_score,
      exception_frequency_score: scores.exception_frequency_score,
      auditability_score: scores.auditability_score,
      speed_sensitivity_score: scores.speed_sensitivity_score,
      composite_score: composite,
      candidate_tier: tier,
      score_rationale: scores.rationale
    };
  } catch (error) {
    console.error('Claude API error in scoreStep:', error);
    throw new Error(`Failed to score step: ${error.message}`);
  }
}

async function generateReport(projectData) {
  try {
    const systemPrompt = `You are an expert in IT Operations Management reporting.
Generate a comprehensive executive summary report for an event management automation assessment.
Be concise but informative, highlighting key findings and recommendations.`;

    const userMessage = `Generate an executive summary report for this project:
Project: ${projectData.name}
Client: ${projectData.client_name}
Engagement Type: ${projectData.engagement_type}
Workflows: ${projectData.workflows?.length || 0}
Average Completion: ${projectData.completionPercentage || 0}%
Overall Readiness Tier: ${projectData.readinessTier || 'Unknown'}`;

    return await callClaude(systemPrompt, userMessage, 2048);
  } catch (error) {
    console.error('Claude API error in generateReport:', error);
    throw new Error(`Failed to generate report: ${error.message}`);
  }
}

module.exports = {
  generateAssistance,
  scoreStep,
  generateReport
};
