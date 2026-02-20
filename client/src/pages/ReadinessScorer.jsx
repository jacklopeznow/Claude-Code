import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProgressRing from '../components/ProgressRing';
import * as api from '../services/api';

/**
 * Readiness Scorer Page
 * Per-workflow heatmap view and engagement-level summary
 */
export default function ReadinessScorer() {
  const { projectId } = useParams();
  const [projectScores, setProjectScores] = useState(null);
  const [workflowScores, setWorkflowScores] = useState([]);
  const [selectedWorkflowIndex, setSelectedWorkflowIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  const DIMENSIONS = [
    { key: 'completeness', label: 'Completeness' },
    { key: 'dependencies', label: 'Dependencies' },
    { key: 'integration', label: 'Integration' },
    { key: 'riskAssessment', label: 'Risk Assessment' },
    { key: 'readiness', label: 'Readiness' },
  ];

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

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        const data = await api.scoresApi.getForProject(projectId);
        setProjectScores(data);
        if (data?.workflowScores) {
          setWorkflowScores(data.workflowScores);
        }
      } catch (err) {
        console.error('Error fetching scores:', err);
        setError(err.message || 'Failed to load scores');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchScores();
    }
  }, [projectId]);

  const handleRegenerateScores = async (workflowIndex) => {
    try {
      setRegenerating(true);
      await api.scoresApi.generate(projectId, workflowIndex);
      // Refetch scores
      const data = await api.scoresApi.getForProject(projectId);
      setProjectScores(data);
      if (data?.workflowScores) {
        setWorkflowScores(data.workflowScores);
      }
    } catch (err) {
      console.error('Error regenerating scores:', err);
      setError('Failed to regenerate scores');
    } finally {
      setRegenerating(false);
    }
  };

  const getScoreTier = (score) => {
    if (score >= 80) return 'Autonomous';
    if (score >= 50) return 'Human-in-Loop';
    return 'Human-only';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#00C2A8'; // Autonomous (teal)
    if (score >= 50) return '#F59E0B'; // Human-in-Loop (amber)
    return '#0F2040'; // Human-only (navy)
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Autonomous':
        return '#00C2A8';
      case 'Human-in-Loop':
        return '#F59E0B';
      case 'Human-only':
        return '#0F2040';
      default:
        return '#9CA3AF';
    }
  };

  const styles = {
    container: {
      padding: '32px',
      backgroundColor: '#F4F6F9',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
    },
    header: {
      marginBottom: '32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#0F2040',
      margin: 0,
    },
    subtitle: {
      fontSize: '14px',
      color: '#5A6B7D',
      marginTop: '8px',
    },
    button: {
      padding: '10px 20px',
      borderRadius: '6px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: 'Inter, sans-serif',
      backgroundColor: '#00C2A8',
      color: '#FFFFFF',
      transition: 'all 0.3s',
    },
    buttonHover: {
      backgroundColor: '#00B399',
    },
    buttonDisabled: {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: '32px',
      overflow: 'hidden',
    },
    cardHeader: {
      padding: '24px',
      borderBottom: '1px solid #E5EBF2',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#0F2040',
      margin: 0,
    },
    cardBody: {
      padding: '24px',
    },
    overallScore: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '24px',
    },
    scoreInfo: {
      textAlign: 'center',
    },
    scorePercent: {
      fontSize: '48px',
      fontWeight: '700',
      color: '#00C2A8',
    },
    scoreLabel: {
      fontSize: '14px',
      color: '#5A6B7D',
      marginTop: '8px',
    },
    workflowSelector: {
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    workflowLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#0F2040',
    },
    select: {
      padding: '10px 16px',
      borderRadius: '6px',
      border: '1px solid #D4DFE8',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      color: '#0F2040',
      cursor: 'pointer',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '16px',
    },
    tableHead: {
      backgroundColor: '#F9FAFB',
    },
    tableHeaderCell: {
      padding: '16px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '700',
      color: '#5A6B7D',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      borderBottom: '1px solid #E5EBF2',
    },
    tableCell: {
      padding: '16px',
      fontSize: '14px',
      color: '#0F2040',
      borderBottom: '1px solid #E5EBF2',
    },
    tableRow: {
      transition: 'background-color 0.2s',
    },
    tableRowHover: {
      backgroundColor: '#F9FAFB',
    },
    scoreCell: {
      textAlign: 'center',
      fontWeight: '600',
      padding: '8px 12px',
      borderRadius: '4px',
      color: '#FFFFFF',
    },
    legend: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px',
      marginTop: '24px',
      paddingTop: '24px',
      borderTop: '1px solid #E5EBF2',
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    legendColor: {
      width: '16px',
      height: '16px',
      borderRadius: '4px',
    },
    legendLabel: {
      fontSize: '13px',
      fontWeight: '500',
      color: '#5A6B7D',
    },
    methodologyList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    methodologyItem: {
      marginBottom: '16px',
      fontSize: '14px',
      color: '#0F2040',
      lineHeight: '1.6',
    },
    methodologyStrong: {
      fontWeight: '600',
      color: '#0F2040',
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
    error: {
      backgroundColor: '#FEE2E2',
      color: '#991B1B',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '24px',
      fontSize: '14px',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p style={{ color: '#5A6B7D', fontFamily: 'Inter, sans-serif' }}>Loading readiness scores...</p>
        </div>
      </div>
    );
  }

  const currentWorkflow = workflowScores[selectedWorkflowIndex];

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Readiness Scoring</h1>
          <p style={styles.subtitle}>Comprehensive workflow readiness assessment and analysis</p>
        </div>
        <button
          style={{
            ...styles.button,
            ...(regenerating ? styles.buttonDisabled : {}),
          }}
          onClick={() => handleRegenerateScores(selectedWorkflowIndex)}
          disabled={regenerating}
          onMouseEnter={(e) => !regenerating && Object.assign(e.target.style, styles.buttonHover)}
          onMouseLeave={(e) => Object.assign(e.target.style, { backgroundColor: '#00C2A8' })}
        >
          {regenerating ? 'Regenerating...' : '↻ Regenerate Scores'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Overall Project Score */}
      {projectScores && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Overall Project Readiness</h2>
          </div>
          <div style={{ ...styles.cardBody, ...styles.overallScore }}>
            <ProgressRing
              percentage={projectScores.overall || 0}
              size="large"
              showLabel={true}
              label="Project"
            />
            <div style={styles.scoreInfo}>
              <div style={styles.scorePercent}>{projectScores.overall || 0}%</div>
              <div style={styles.scoreLabel}>
                {getScoreTier(projectScores.overall || 0)} Readiness
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-Workflow Heatmap */}
      {currentWorkflow && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Workflow Readiness Heatmap</h2>
          </div>
          <div style={styles.cardBody}>
            <div style={styles.workflowSelector}>
              <label style={styles.workflowLabel}>Select Workflow:</label>
              <select
                style={styles.select}
                value={selectedWorkflowIndex}
                onChange={(e) => setSelectedWorkflowIndex(parseInt(e.target.value))}
              >
                {workflowScores.map((_, idx) => (
                  <option key={idx} value={idx}>
                    Workflow {idx + 1}: {WORKFLOW_NAMES[idx] || `Workflow ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {currentWorkflow.steps && currentWorkflow.steps.length > 0 ? (
              <>
                <table style={styles.table}>
                  <thead style={styles.tableHead}>
                    <tr>
                      <th style={styles.tableHeaderCell}>Step</th>
                      {DIMENSIONS.map(dim => (
                        <th key={dim.key} style={styles.tableHeaderCell}>{dim.label}</th>
                      ))}
                      <th style={styles.tableHeaderCell}>Composite Score</th>
                      <th style={styles.tableHeaderCell}>Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentWorkflow.steps.map((step, stepIdx) => (
                      <tr
                        key={stepIdx}
                        style={styles.tableRow}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.tableRowHover)}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, {})}
                      >
                        <td style={styles.tableCell}>
                          <strong>Step {stepIdx + 1}</strong>
                        </td>
                        {DIMENSIONS.map(dim => (
                          <td key={dim.key} style={styles.tableCell}>
                            <div
                              style={{
                                ...styles.scoreCell,
                                backgroundColor: getScoreColor(step.scores?.[dim.key] || 0),
                              }}
                            >
                              {step.scores?.[dim.key] || 0}
                            </div>
                          </td>
                        ))}
                        <td style={styles.tableCell}>
                          <strong>{step.compositeScore || 0}</strong>
                        </td>
                        <td style={styles.tableCell}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            backgroundColor: getTierColor(getScoreTier(step.compositeScore || 0)) + '20',
                            color: getTierColor(getScoreTier(step.compositeScore || 0)),
                            fontWeight: '600',
                            fontSize: '12px',
                          }}>
                            {getScoreTier(step.compositeScore || 0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Legend */}
                <div style={styles.legend}>
                  <div style={styles.legendItem}>
                    <div style={{ ...styles.legendColor, backgroundColor: '#00C2A8' }}></div>
                    <div style={styles.legendLabel}>Autonomous (80-100)</div>
                  </div>
                  <div style={styles.legendItem}>
                    <div style={{ ...styles.legendColor, backgroundColor: '#F59E0B' }}></div>
                    <div style={styles.legendLabel}>Human-in-Loop (50-79)</div>
                  </div>
                  <div style={styles.legendItem}>
                    <div style={{ ...styles.legendColor, backgroundColor: '#0F2040' }}></div>
                    <div style={styles.legendLabel}>Human-only (0-49)</div>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '24px' }}>
                No step scores available for this workflow
              </p>
            )}
          </div>
        </div>
      )}

      {/* Engagement-Level Summary */}
      {workflowScores && workflowScores.length > 0 && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Engagement-Level Summary</h2>
          </div>
          <div style={styles.cardBody}>
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={styles.tableHeaderCell}>Workflow</th>
                  <th style={styles.tableHeaderCell}>Overall Score</th>
                  <th style={styles.tableHeaderCell}>Candidate Tier</th>
                  <th style={styles.tableHeaderCell}>Steps Completed</th>
                </tr>
              </thead>
              <tbody>
                {workflowScores.map((score, idx) => (
                  <tr
                    key={idx}
                    style={styles.tableRow}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.tableRowHover)}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, {})}
                  >
                    <td style={styles.tableCell}>
                      <strong>Workflow {idx + 1}: {WORKFLOW_NAMES[idx]}</strong>
                    </td>
                    <td style={styles.tableCell}>
                      <div
                        style={{
                          ...styles.scoreCell,
                          backgroundColor: getScoreColor(score.score || 0),
                          display: 'inline-block',
                          width: 'auto',
                        }}
                      >
                        {score.score || 0}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        backgroundColor: getTierColor(getScoreTier(score.score || 0)) + '20',
                        color: getTierColor(getScoreTier(score.score || 0)),
                        fontWeight: '600',
                        fontSize: '12px',
                      }}>
                        {getScoreTier(score.score || 0)}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      {score.completedSteps || 0} / {score.totalSteps || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scoring Methodology */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Scoring Methodology</h2>
        </div>
        <div style={styles.cardBody}>
          <ul style={styles.methodologyList}>
            <li style={styles.methodologyItem}>
              <span style={styles.methodologyStrong}>Completeness:</span> Percentage of workflow steps that have been captured and documented
            </li>
            <li style={styles.methodologyItem}>
              <span style={styles.methodologyStrong}>Dependencies:</span> Assessment of external dependencies and their readiness for automation
            </li>
            <li style={styles.methodologyItem}>
              <span style={styles.methodologyStrong}>Integration:</span> Availability and maturity of tool integrations required
            </li>
            <li style={styles.methodologyItem}>
              <span style={styles.methodologyStrong}>Risk Assessment:</span> Overall risk based on identified gaps and failure modes
            </li>
            <li style={styles.methodologyItem}>
              <span style={styles.methodologyStrong}>Readiness:</span> Combined assessment of automation capability and organizational readiness
            </li>
            <li style={styles.methodologyItem} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5EBF2' }}>
              <span style={styles.methodologyStrong}>Candidate Tiers:</span>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ color: '#00C2A8', fontWeight: '600' }}>Autonomous (80-100):</span> Ready for autonomous execution
                </div>
                <div>
                  <span style={{ color: '#F59E0B', fontWeight: '600' }}>Human-in-Loop (50-79):</span> Hybrid manual and automated execution required
                </div>
                <div>
                  <span style={{ color: '#0F2040', fontWeight: '600' }}>Human-only (0-49):</span> Requires full manual execution
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
