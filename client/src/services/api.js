/**
 * Enscope API Client
 * Centralized fetch wrappers for all backend endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Fetch wrapper with error handling and JSON parsing
 */
async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = new Error(`API Error: ${response.status} ${response.statusText}`);
      error.status = response.status;

      try {
        error.data = await response.json();
      } catch {
        error.data = null;
      }

      throw error;
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return null;
    }

    // Try to parse JSON, but handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return null;
  } catch (error) {
    console.error('API Request Failed:', {
      endpoint,
      method: config.method || 'GET',
      error: error.message,
      status: error.status,
    });

    throw error;
  }
}

/**
 * Projects API
 */
export const projectsApi = {
  /**
   * Create a new project
   */
  create: (projectData) =>
    fetchApi('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    }),

  /**
   * Join an existing project
   */
  join: (projectCode) =>
    fetchApi('/projects/join', {
      method: 'POST',
      body: JSON.stringify({ projectCode }),
    }),

  /**
   * Get a specific project by ID
   */
  get: (projectId) => fetchApi(`/projects/${projectId}`),

  /**
   * Get project dashboard data (summary, stats, progress)
   */
  getDashboard: (projectId) => fetchApi(`/projects/${projectId}/dashboard`),

  /**
   * Get all projects for current user
   */
  getAll: () => fetchApi('/projects'),

  /**
   * Update project details
   */
  update: (projectId, projectData) =>
    fetchApi(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    }),

  /**
   * Delete a project
   */
  delete: (projectId) =>
    fetchApi(`/projects/${projectId}`, {
      method: 'DELETE',
    }),
};

/**
 * Workflows API
 */
export const workflowsApi = {
  /**
   * Get all workflows for a project
   */
  get: (projectId) => fetchApi(`/projects/${projectId}/workflows`),

  /**
   * Get a specific workflow by its ID
   */
  getById: (projectId, workflowId) =>
    fetchApi(`/workflows/${workflowId}`),

  /**
   * Create a new step in a workflow
   */
  createStep: (projectId, workflowId, stepData) =>
    fetchApi(`/workflows/${workflowId}/steps`, {
      method: 'POST',
      body: JSON.stringify(stepData),
    }),

  /**
   * Update a workflow step by step ID
   */
  updateStep: (projectId, workflowId, stepId, stepData) =>
    fetchApi(`/workflows/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(stepData),
    }),

  /**
   * Delete a workflow step by step ID
   */
  deleteStep: (projectId, workflowId, stepId) =>
    fetchApi(`/workflows/steps/${stepId}`, {
      method: 'DELETE',
    }),

  /**
   * Update workflow status (started, completed, etc)
   */
  updateStatus: (projectId, workflowId, status) =>
    fetchApi(`/workflows/${workflowId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  /**
   * Duplicate a workflow
   */
  duplicate: (projectId, workflowId) =>
    fetchApi(`/workflows/${workflowId}/duplicate`, {
      method: 'POST',
    }),

  /**
   * Export workflow as Mermaid diagram definition
   */
  exportDiagram: (projectId, workflowId) =>
    fetchApi(`/workflows/${workflowId}/diagram`),
};

/**
 * AI Assistant API
 */
export const aiApi = {
  /**
   * Get AI assistance/suggestions for a field
   */
  getAssistance: (projectId, workflowIndex, fieldName, fieldValue) =>
    fetchApi('/ai/assist', {
      method: 'POST',
      body: JSON.stringify({ projectId, workflowIndex, fieldName, fieldValue }),
    }),

  /**
   * Score a workflow step
   */
  scoreStep: (projectId, workflowIndex, stepIndex, scoreData) =>
    fetchApi('/ai/score-step', {
      method: 'POST',
      body: JSON.stringify(scoreData),
    }),

  /**
   * Generate insights for a project
   */
  generateInsights: (projectId) =>
    fetchApi(`/projects/${projectId}/ai/insights`, {
      method: 'POST',
    }),

  /**
   * Stream AI response (for chat-like interactions)
   * Returns a readable stream
   */
  streamAssistance: (projectId, workflowIndex, message) => {
    const url = `${API_BASE_URL}/projects/${projectId}/workflows/${workflowIndex}/ai/stream`;

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Stream Error: ${response.status}`);
      }
      return response.body;
    });
  },
};

/**
 * Readiness Scores API
 */
export const scoresApi = {
  /**
   * Generate scores for a workflow by ID
   */
  generate: (projectId, workflowId) =>
    fetchApi(`/scores/generate/${workflowId}`, {
      method: 'POST',
    }),

  /**
   * Get scores for a specific workflow
   */
  getForWorkflow: (projectId, workflowId) =>
    fetchApi(`/scores/workflow/${workflowId}`),

  /**
   * Get aggregated scores for entire project
   */
  getForProject: (projectId) => fetchApi(`/scores/project/${projectId}`),

  /**
   * Get detailed scoring breakdown
   */
  getDetails: (projectId, workflowId) =>
    fetchApi(`/scores/workflow/${workflowId}/details`),

  /**
   * Reset scores (triggers recalculation)
   */
  reset: (projectId, workflowId) =>
    fetchApi(`/scores/reset/${workflowId}`, {
      method: 'POST',
    }),
};

/**
 * Dependency Gaps API
 */
export const gapsApi = {
  /**
   * Get all dependency gaps for a project
   */
  getAll: (projectId) => fetchApi(`/projects/${projectId}/gaps`),

  /**
   * Get gaps summary (counts by severity)
   */
  getSummary: (projectId) => fetchApi(`/projects/${projectId}/gaps/summary`),

  /**
   * Create a new dependency gap
   */
  create: (projectId, gapData) =>
    fetchApi(`/projects/${projectId}/gaps`, {
      method: 'POST',
      body: JSON.stringify(gapData),
    }),

  /**
   * Update a dependency gap
   */
  update: (projectId, gapId, gapData) =>
    fetchApi(`/projects/${projectId}/gaps/${gapId}`, {
      method: 'PUT',
      body: JSON.stringify(gapData),
    }),

  /**
   * Delete a dependency gap
   */
  delete: (projectId, gapId) =>
    fetchApi(`/projects/${projectId}/gaps/${gapId}`, {
      method: 'DELETE',
    }),

  /**
   * Get gaps for a specific workflow step
   */
  getForStep: (projectId, workflowIndex, stepIndex) =>
    fetchApi(
      `/projects/${projectId}/workflows/${workflowIndex}/steps/${stepIndex}/gaps`
    ),

  /**
   * Mark gap as resolved
   */
  markResolved: (projectId, gapId) =>
    fetchApi(`/projects/${projectId}/gaps/${gapId}/resolve`, {
      method: 'POST',
    }),
};

/**
 * Reports API
 */
export const reportsApi = {
  /**
   * Get report data for a specific workflow
   */
  getWorkflow: (projectId, workflowIndex) =>
    fetchApi(`/projects/${projectId}/workflows/${workflowIndex}/report`),

  /**
   * Get comprehensive project report
   */
  getProject: (projectId) => fetchApi(`/projects/${projectId}/report`),

  /**
   * Generate and download PDF report
   */
  downloadPdf: async (projectId, reportType = 'project') => {
    const url = `${API_BASE_URL}/projects/${projectId}/reports/pdf?type=${reportType}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Report Generation Error: ${response.status}`);
      }

      return response.blob();
    } catch (error) {
      console.error('PDF Download Failed:', error);
      throw error;
    }
  },

  /**
   * Export report as JSON
   */
  exportJson: (projectId, reportType = 'project') =>
    fetchApi(`/projects/${projectId}/reports/json?type=${reportType}`),

  /**
   * Export report as CSV
   */
  exportCsv: async (projectId, reportType = 'project') => {
    const url = `${API_BASE_URL}/projects/${projectId}/reports/csv?type=${reportType}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`CSV Export Error: ${response.status}`);
      }

      return response.blob();
    } catch (error) {
      console.error('CSV Export Failed:', error);
      throw error;
    }
  },

  /**
   * Get report history/snapshots
   */
  getHistory: (projectId) => fetchApi(`/projects/${projectId}/reports/history`),
};

/**
 * Diagrams API
 */
export const diagramsApi = {
  /**
   * Get Mermaid diagram definition for a workflow by ID
   */
  getForWorkflow: (projectId, workflowId) =>
    fetchApi(`/diagrams/workflow/${workflowId}`),

  /**
   * Get diagram with scores overlaid
   */
  getWithScores: (projectId, workflowId) =>
    fetchApi(`/diagrams/workflow/${workflowId}?includeScores=true`),

  /**
   * Get diagram with dependency gaps highlighted
   */
  getWithGaps: (projectId, workflowId) =>
    fetchApi(`/diagrams/workflow/${workflowId}?includeGaps=true`),

  /**
   * Generate custom diagram layout
   */
  generateLayout: (projectId, workflowId, layoutConfig) =>
    fetchApi(`/diagrams/workflow/${workflowId}/layout`, {
      method: 'POST',
      body: JSON.stringify(layoutConfig),
    }),
};

/**
 * Health Check API
 */
export const healthApi = {
  /**
   * Check if backend is available
   */
  check: () =>
    fetchApi('/health')
      .then(() => true)
      .catch(() => false),
};

/**
 * Error handling helper
 */
export function isApiError(error) {
  return error instanceof Error && error.message.startsWith('API Error');
}

/**
 * Format API error for user display
 */
export function formatApiError(error) {
  if (error.data?.message) {
    return error.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
