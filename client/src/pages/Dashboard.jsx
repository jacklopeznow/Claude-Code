import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProgressRing from '../components/ProgressRing';
import RAGBadge from '../components/RAGBadge';
import * as api from '../services/api';

/**
 * Dashboard Page
 * Project overview with workflow cards and key metrics
 */
export default function Dashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projectData, setProjectData] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const WORKFLOW_NAMES = [
    'Discovery & Assessment',
    'Planning & Design',
    'Development & Configuration',
    'Testing & Validation',
    'Deployment Preparation',
    'Cutover Planning',
    'Post-Implementation',
    'Knowledge Transfer',
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'complete':
        return '#10B981';
      case 'in_progress':
        return '#F59E0B';
      case 'not_started':
      default:
        return '#9CA3AF';
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [projectRes, dashboardRes, workflowsRes] = await Promise.all([
          api.projectsApi.get(projectId),
          api.projectsApi.getDashboard(projectId),
          api.workflowsApi.get(projectId),
        ]);

        setProjectData(projectRes);
        setStats(dashboardRes);
        setWorkflows(workflowsRes || []);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchDashboard();
    }
  }, [projectId]);

  const styles = {
    container: {
      padding: '32px',
      backgroundColor: '#F4F6F9',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
    },
    header: {
      marginBottom: '40px',
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#0F2040',
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: '14px',
      color: '#5A6B7D',
    },
    projectInfo: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
      padding: '16px',
      backgroundColor: '#FFFFFF',
      borderRadius: '8px',
      border: '1px solid #E5EBF2',
    },
    infoItem: {
      display: 'flex',
      flexDirection: 'column',
    },
    infoLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#5A6B7D',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '4px',
    },
    infoValue: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#0F2040',
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '24px',
      marginBottom: '40px',
    },
    metricCard: {
      backgroundColor: '#FFFFFF',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    metricTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#5A6B7D',
      marginBottom: '16px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    metricValue: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#0F2040',
    },
    metricSubtext: {
      fontSize: '12px',
      color: '#9CA3AF',
      marginTop: '8px',
    },
    workflowsSection: {
      marginBottom: '40px',
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#0F2040',
      marginBottom: '24px',
    },
    workflowsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '24px',
    },
    workflowCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      padding: '24px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    workflowCardHover: {
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      transform: 'translateY(-4px)',
    },
    workflowHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
    },
    workflowNumber: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#5A6B7D',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    workflowTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#0F2040',
      marginBottom: '8px',
    },
    statusBadge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600',
      color: '#FFFFFF',
    },
    workflowStats: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      marginBottom: '16px',
      padding: '12px 0',
      borderTop: '1px solid #E5EBF2',
      borderBottom: '1px solid #E5EBF2',
    },
    statItem: {
      fontSize: '13px',
      color: '#5A6B7D',
    },
    statValue: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#0F2040',
    },
    workflowFooter: {
      fontSize: '12px',
      color: '#9CA3AF',
      marginBottom: '12px',
    },
    actionButton: {
      width: '100%',
      padding: '10px',
      backgroundColor: '#00C2A8',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: 'Inter, sans-serif',
      transition: 'background-color 0.3s',
    },
    actionButtonHover: {
      backgroundColor: '#00B399',
    },
    loading: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid #E5EBF2',
      borderTop: '4px solid #00C2A8',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px',
    },
    errorMessage: {
      backgroundColor: '#FEE2E2',
      color: '#991B1B',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '24px',
      fontSize: '14px',
    },
    actionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '40px',
    },
    actionCard: {
      backgroundColor: '#FFFFFF',
      padding: '16px',
      borderRadius: '8px',
      border: '2px solid #00C2A8',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.3s',
    },
    actionCardHover: {
      backgroundColor: '#F0FFFE',
      boxShadow: '0 4px 12px rgba(0, 194, 168, 0.2)',
    },
    actionCardText: {
      color: '#00C2A8',
      fontWeight: '600',
      fontSize: '14px',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p style={{ color: '#5A6B7D', fontFamily: 'Inter, sans-serif' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorMessage}>
          <strong>Error Loading Dashboard</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Project Overview & Progress</p>
      </div>

      {/* Project Information */}
      {projectData && (
        <div style={styles.projectInfo}>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Client</div>
            <div style={styles.infoValue}>{projectData.clientName}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Engagement</div>
            <div style={styles.infoValue}>{projectData.engagementName}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Type</div>
            <div style={styles.infoValue}>{projectData.engagementType}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Team Members</div>
            <div style={styles.infoValue}>{projectData.teamMembers?.length || 0}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Created</div>
            <div style={styles.infoValue}>
              {projectData.createdAt ? new Date(projectData.createdAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {stats && (
        <>
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <div style={styles.metricTitle}>Overall Readiness</div>
              <div style={styles.metricValue}>{stats.overallReadiness || 0}%</div>
              <div style={styles.metricSubtext}>Project readiness score</div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricTitle}>Workflows</div>
              <div style={styles.metricValue}>{stats.totalWorkflows || 0}</div>
              <div style={styles.metricSubtext}>
                {stats.completedWorkflows || 0} completed, {stats.inProgressWorkflows || 0} in progress
              </div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricTitle}>Steps Captured</div>
              <div style={styles.metricValue}>{stats.totalSteps || 0}</div>
              <div style={styles.metricSubtext}>Across all workflows</div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricTitle}>Critical Issues</div>
              <div style={styles.metricValue} style={{ color: '#EF4444' }}>
                {stats.criticalGaps || 0}
              </div>
              <div style={styles.metricSubtext}>
                {stats.warningGaps || 0} caution, {stats.resolvedGaps || 0} resolved
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={styles.actionsGrid}>
            <div
              style={styles.actionCard}
              onClick={() => navigate(`/project/${projectId}/gaps`)}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.actionCardHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, {})}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔗</div>
              <div style={styles.actionCardText}>View Dependency Gaps</div>
            </div>
            <div
              style={styles.actionCard}
              onClick={() => navigate(`/project/${projectId}/readiness`)}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.actionCardHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, {})}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
              <div style={styles.actionCardText}>View Readiness Scores</div>
            </div>
            <div
              style={styles.actionCard}
              onClick={() => navigate(`/project/${projectId}/reports`)}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.actionCardHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, {})}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
              <div style={styles.actionCardText}>Generate Reports</div>
            </div>
          </div>
        </>
      )}

      {/* Workflow Cards */}
      <div style={styles.workflowsSection}>
        <h2 style={styles.sectionTitle}>Workflow Status</h2>
        <div style={styles.workflowsGrid}>
          {workflows.map((workflow, index) => (
            <div
              key={index}
              style={styles.workflowCard}
              onClick={() => navigate(`/project/${projectId}/interview/${index}`)}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.workflowCardHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, {})}
            >
              <div style={styles.workflowHeader}>
                <div>
                  <div style={styles.workflowNumber}>Workflow {index + 1}</div>
                  <h3 style={styles.workflowTitle}>{WORKFLOW_NAMES[index] || `Workflow ${index + 1}`}</h3>
                </div>
                <RAGBadge
                  severity={
                    workflow.status?.toLowerCase() === 'complete'
                      ? 'green'
                      : workflow.status?.toLowerCase() === 'in_progress'
                        ? 'amber'
                        : 'red'
                  }
                  size="sm"
                  label={workflow.status || 'Not Started'}
                />
              </div>

              <div style={styles.workflowStats}>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{workflow.steps?.length || 0}</div>
                  <div>Steps</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{workflow.completedSteps || 0}</div>
                  <div>Completed</div>
                </div>
              </div>

              <div style={styles.workflowFooter}>
                Last updated: {workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleDateString() : 'Never'}
              </div>

              <button
                style={styles.actionButton}
                onMouseEnter={(e) => Object.assign(e.target.style, styles.actionButtonHover)}
                onMouseLeave={(e) => Object.assign(e.target.style, { backgroundColor: '#00C2A8' })}
              >
                Continue Interview
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
