import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../services/api';

/**
 * ProjectContext - Stores current project data and provides it to all child components
 */
const ProjectContext = createContext(null);

/**
 * ProjectProvider Component
 * Wraps the project routes and fetches project data
 */
export function ProjectProvider({ children }) {
  const { projectId } = useParams();
  const [projectData, setProjectData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [workflowsData, setWorkflowsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch project data on mount or when projectId changes
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchProjectData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch basic project data
        const project = await api.projectsApi.get(projectId);
        setProjectData(project);

        // Fetch dashboard data
        const dashboard = await api.projectsApi.getDashboard(projectId);
        setDashboardData(dashboard);

        // Fetch workflows
        const workflows = await api.workflowsApi.get(projectId);
        setWorkflowsData(workflows);
      } catch (err) {
        console.error('Failed to fetch project data:', err);
        setError(err.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  /**
   * Refresh project data (useful after mutations)
   */
  const refreshProject = async () => {
    if (!projectId) return;

    try {
      const [project, dashboard, workflows] = await Promise.all([
        api.projectsApi.get(projectId),
        api.projectsApi.getDashboard(projectId),
        api.workflowsApi.get(projectId),
      ]);

      setProjectData(project);
      setDashboardData(dashboard);
      setWorkflowsData(workflows);
    } catch (err) {
      console.error('Failed to refresh project data:', err);
      setError(err.message || 'Failed to refresh project');
    }
  };

  /**
   * Update project in context (for optimistic updates)
   */
  const updateProjectData = (updates) => {
    setProjectData((prev) => (prev ? { ...prev, ...updates } : null));
  };

  /**
   * Update dashboard in context
   */
  const updateDashboardData = (updates) => {
    setDashboardData((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const value = {
    projectId,
    projectData,
    dashboardData,
    workflowsData,
    loading,
    error,
    refreshProject,
    updateProjectData,
    updateDashboardData,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

/**
 * Hook to use ProjectContext
 * Must be used within a ProjectProvider
 */
export function useProject() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }

  return context;
}
