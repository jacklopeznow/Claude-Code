import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DiagramRenderer from '../components/DiagramRenderer';
import * as api from '../services/api';

/**
 * Diagram View Page
 * Mermaid diagram visualization of workflow with overlays
 */
export default function DiagramView() {
  const { projectId, workflowIndex } = useParams();
  const navigate = useNavigate();
  const [diagram, setDiagram] = useState('');
  const [withGaps, setWithGaps] = useState(false);
  const [withScores, setWithScores] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDiagram = async () => {
      try {
        setLoading(true);

        let diagramData;
        if (withGaps) {
          diagramData = await api.diagramsApi.getWithGaps(projectId, workflowIndex);
        } else if (withScores) {
          diagramData = await api.diagramsApi.getWithScores(projectId, workflowIndex);
        } else {
          diagramData = await api.diagramsApi.getForWorkflow(projectId, workflowIndex);
        }

        setDiagram(diagramData?.definition || diagramData);
      } catch (err) {
        console.error('Error fetching diagram:', err);
        setError(err.message || 'Failed to load diagram');
      } finally {
        setLoading(false);
      }
    };

    if (projectId && workflowIndex !== undefined) {
      fetchDiagram();
    }
  }, [projectId, workflowIndex, withGaps, withScores]);

  const handleExport = (format) => {
    const canvas = document.querySelector('.mermaid-canvas');
    if (!canvas) {
      alert('Diagram not ready for export. Please try again.');
      return;
    }

    if (format === 'png') {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `workflow-${workflowIndex}-diagram.png`;
      link.click();
    } else if (format === 'svg') {
      const svg = document.querySelector('.mermaid svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `workflow-${workflowIndex}-diagram.svg`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
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
      alignItems: 'flex-start',
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#0F2040',
      margin: 0,
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: '14px',
      color: '#5A6B7D',
    },
    headerRight: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      alignItems: 'flex-end',
    },
    controls: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      backgroundColor: '#FFFFFF',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    controlGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
      accentColor: '#00C2A8',
    },
    label: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#0F2040',
      cursor: 'pointer',
      userSelect: 'none',
    },
    exportButtons: {
      display: 'flex',
      gap: '8px',
    },
    button: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: 'Inter, sans-serif',
      transition: 'all 0.3s',
      backgroundColor: '#00C2A8',
      color: '#FFFFFF',
    },
    buttonHover: {
      backgroundColor: '#00B399',
    },
    secondaryButton: {
      backgroundColor: '#F4F6F9',
      color: '#0F2040',
      border: '1px solid #D4DFE8',
    },
    secondaryButtonHover: {
      backgroundColor: '#E5EBF2',
    },
    diagramCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      padding: '24px',
      minHeight: '600px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
    legend: {
      backgroundColor: '#FFFFFF',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginTop: '16px',
    },
    legendTitle: {
      fontSize: '12px',
      fontWeight: '700',
      color: '#0F2040',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '12px',
    },
    legendGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '12px',
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      color: '#5A6B7D',
    },
    legendColor: {
      width: '12px',
      height: '12px',
      borderRadius: '3px',
      flexShrink: 0,
    },
    backButton: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: '1px solid #D4DFE8',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: 'Inter, sans-serif',
      backgroundColor: '#F4F6F9',
      color: '#0F2040',
      transition: 'all 0.3s',
    },
    backButtonHover: {
      backgroundColor: '#E5EBF2',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p style={{ color: '#5A6B7D' }}>Loading diagram...</p>
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
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Workflow Diagram</h1>
          <p style={styles.subtitle}>Workflow {parseInt(workflowIndex) + 1} - Visual Process Flow</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.controls}>
            <div style={styles.controlGroup}>
              <input
                type="checkbox"
                id="show-scores"
                style={styles.checkbox}
                checked={withScores}
                onChange={(e) => setWithScores(e.target.checked)}
              />
              <label htmlFor="show-scores" style={styles.label}>
                Show Readiness Scores
              </label>
            </div>
            <div style={styles.controlGroup}>
              <input
                type="checkbox"
                id="show-gaps"
                style={styles.checkbox}
                checked={withGaps}
                onChange={(e) => setWithGaps(e.target.checked)}
              />
              <label htmlFor="show-gaps" style={styles.label}>
                Highlight Gaps
              </label>
            </div>
          </div>

          <div style={styles.exportButtons}>
            <button
              style={styles.button}
              onClick={() => handleExport('png')}
              onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
              onMouseLeave={(e) => Object.assign(e.target.style, { backgroundColor: '#00C2A8' })}
            >
              Export PNG
            </button>
            <button
              style={styles.button}
              onClick={() => handleExport('svg')}
              onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
              onMouseLeave={(e) => Object.assign(e.target.style, { backgroundColor: '#00C2A8' })}
            >
              Export SVG
            </button>
            <button
              style={styles.backButton}
              onClick={() => navigate(`/project/${projectId}/dashboard`)}
              onMouseEnter={(e) => Object.assign(e.target.style, styles.backButtonHover)}
              onMouseLeave={(e) => Object.assign(e.target.style, { backgroundColor: '#F4F6F9' })}
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Diagram */}
      <div style={styles.diagramCard}>
        {diagram ? (
          <DiagramRenderer
            mermaidDefinition={diagram}
            title={`Workflow ${parseInt(workflowIndex) + 1} Diagram`}
            showExportButtons={false}
          />
        ) : (
          <div style={styles.loading}>
            <p style={{ color: '#9CA3AF' }}>No diagram available</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendTitle}>Legend</div>
        <div style={styles.legendGrid}>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#0F2040' }}></div>
            <span>Human Agent Lane</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#00C2A8' }}></div>
            <span>Autonomous Agent Lane</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#F59E0B' }}></div>
            <span>Human-in-Loop Lane</span>
          </div>
          {withGaps && (
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendColor, backgroundColor: '#EF4444' }}></div>
              <span>Identified Gap</span>
            </div>
          )}
          {withScores && (
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendColor, backgroundColor: '#10B981' }}></div>
              <span>High Readiness Score</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
