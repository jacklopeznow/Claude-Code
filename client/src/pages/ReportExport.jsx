import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../services/api';

/**
 * Report Export Page
 * Generate and export reports in various formats (PDF, CSV, JSON)
 */
export default function ReportExport() {
  const { projectId } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [selectedReport, setSelectedReport] = useState('project');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await api.reportsApi.getProject(projectId);
        setReportData(data);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchReport();
    }
  }, [projectId]);

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      const blob = await api.reportsApi.downloadPdf(projectId, selectedReport);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enscope-${selectedReport}-report-${Date.now()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError(err.message || 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const blob = await api.reportsApi.exportCsv(projectId, selectedReport);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enscope-${selectedReport}-report-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError(err.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleExportJson = async () => {
    try {
      setExporting(true);
      const data = await api.reportsApi.exportJson(projectId, selectedReport);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enscope-${selectedReport}-report-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting JSON:', err);
      setError(err.message || 'Failed to export JSON');
    } finally {
      setExporting(false);
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
    reportSelector: {
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    label: {
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
    exportGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '24px',
    },
    exportCard: {
      padding: '24px',
      borderRadius: '8px',
      border: '1px solid #E5EBF2',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s',
      backgroundColor: '#FFFFFF',
    },
    exportCardHover: {
      borderColor: '#00C2A8',
      boxShadow: '0 4px 12px rgba(0, 194, 168, 0.2)',
    },
    exportCardDisabled: {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
    exportIcon: {
      fontSize: '40px',
      marginBottom: '12px',
    },
    exportName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#0F2040',
      marginBottom: '8px',
    },
    exportDesc: {
      fontSize: '12px',
      color: '#5A6B7D',
      lineHeight: '1.5',
      margin: 0,
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
    },
    summaryItem: {
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: '#F9FAFB',
    },
    summaryLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#5A6B7D',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '8px',
    },
    summaryValue: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#0F2040',
    },
    summarySubtext: {
      fontSize: '12px',
      color: '#9CA3AF',
      marginTop: '4px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableRow: {
      borderBottom: '1px solid #E5EBF2',
    },
    tableCell: {
      padding: '16px',
      fontSize: '14px',
      color: '#0F2040',
      textAlign: 'left',
    },
    tableLabel: {
      fontWeight: '600',
      width: '40%',
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
    comingSoon: {
      opacity: '0.6',
      textDecoration: 'line-through',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p style={{ color: '#5A6B7D' }}>Loading report...</p>
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
        <h1 style={styles.title}>Generate & Export Reports</h1>
        <p style={styles.subtitle}>Download your project assessment in multiple formats</p>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Report Type Selector */}
      <div style={styles.card}>
        <div style={styles.cardBody}>
          <div style={styles.reportSelector}>
            <label style={styles.label}>Report Type:</label>
            <select
              style={styles.select}
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
            >
              <option value="project">Full Engagement Rollup</option>
              <option value="workflow">Per-Workflow Detail</option>
              <option value="gaps">Dependency Analysis</option>
              <option value="scores">Readiness Scoring</option>
            </select>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Export Formats</h2>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.exportGrid}>
            <div
              style={styles.exportCard}
              onClick={handleExportPdf}
              onMouseEnter={(e) => !exporting && Object.assign(e.currentTarget.style, styles.exportCardHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, {})}
            >
              <div style={styles.exportIcon}>📄</div>
              <div style={styles.exportName}>PDF Report</div>
              <p style={styles.exportDesc}>
                Professional formatted report for printing and sharing with stakeholders
              </p>
            </div>

            <div
              style={styles.exportCard}
              onClick={handleExportCsv}
              onMouseEnter={(e) => !exporting && Object.assign(e.currentTarget.style, styles.exportCardHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, {})}
            >
              <div style={styles.exportIcon}>📊</div>
              <div style={styles.exportName}>CSV Export</div>
              <p style={styles.exportDesc}>
                Spreadsheet format for detailed analysis and data import into other tools
              </p>
            </div>

            <div
              style={{
                ...styles.exportCard,
                ...styles.exportCardDisabled,
                opacity: '0.6',
              }}
              onClick={handleExportJson}
              onMouseEnter={(e) => !exporting && Object.assign(e.currentTarget.style, styles.exportCardHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, {})}
            >
              <div style={styles.exportIcon}>📋</div>
              <div style={styles.exportName}>JSON Data</div>
              <p style={styles.exportDesc}>
                Raw JSON data for integration and automation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Summary */}
      {reportData && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Report Summary</h2>
          </div>
          <div style={styles.cardBody}>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Overall Readiness</div>
                <div style={styles.summaryValue} style={{ color: '#00C2A8' }}>
                  {reportData.overallReadiness || 0}%
                </div>
                <div style={styles.summarySubtext}>Project readiness score</div>
              </div>

              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Workflows</div>
                <div style={styles.summaryValue}>
                  {reportData.completedWorkflows || 0} / {reportData.totalWorkflows || 0}
                </div>
                <div style={styles.summarySubtext}>Completed workflows</div>
              </div>

              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Critical Issues</div>
                <div style={styles.summaryValue} style={{ color: '#EF4444' }}>
                  {reportData.criticalGaps || 0}
                </div>
                <div style={styles.summarySubtext}>Unresolved gaps</div>
              </div>

              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Generated</div>
                <div style={styles.summaryValue} style={{ fontSize: '16px' }}>
                  {reportData.generatedAt
                    ? new Date(reportData.generatedAt).toLocaleDateString()
                    : 'Never'}
                </div>
                <div style={styles.summarySubtext}>Last generated date</div>
              </div>
            </div>

            <table style={styles.table}>
              <tbody>
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableLabel }}>
                    <strong>Project Name</strong>
                  </td>
                  <td style={styles.tableCell}>{reportData.projectName}</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableLabel }}>
                    <strong>Engagement Type</strong>
                  </td>
                  <td style={styles.tableCell}>{reportData.engagementType || 'N/A'}</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableLabel }}>
                    <strong>Total Steps Captured</strong>
                  </td>
                  <td style={styles.tableCell}>{reportData.totalSteps || 0}</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableLabel }}>
                    <strong>Readiness Tiers</strong>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={{ color: '#00C2A8', fontWeight: '600' }}>
                      {reportData.autonomousTiers || 0}
                    </span>
                    {' '}Autonomous,{' '}
                    <span style={{ color: '#F59E0B', fontWeight: '600' }}>
                      {reportData.humanInLoopTiers || 0}
                    </span>
                    {' '}Human-in-Loop,{' '}
                    <span style={{ color: '#0F2040', fontWeight: '600' }}>
                      {reportData.humanOnlyTiers || 0}
                    </span>
                    {' '}Human-only
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Contents Info */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>What's Included in Your Report</h2>
        </div>
        <div style={styles.cardBody}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F2040', marginBottom: '8px' }}>
                Executive Summary
              </h3>
              <p style={{ fontSize: '13px', color: '#5A6B7D', lineHeight: '1.6' }}>
                High-level overview of project readiness, key metrics, and recommendations
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F2040', marginBottom: '8px' }}>
                Workflow Details
              </h3>
              <p style={{ fontSize: '13px', color: '#5A6B7D', lineHeight: '1.6' }}>
                Comprehensive breakdown of each workflow, steps, and assessment details
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F2040', marginBottom: '8px' }}>
                Readiness Scores
              </h3>
              <p style={{ fontSize: '13px', color: '#5A6B7D', lineHeight: '1.6' }}>
                Detailed scoring across all dimensions with tier classifications
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F2040', marginBottom: '8px' }}>
                Gap Analysis
              </h3>
              <p style={{ fontSize: '13px', color: '#5A6B7D', lineHeight: '1.6' }}>
                All identified dependencies, gaps, and their severity ratings
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F2040', marginBottom: '8px' }}>
                Risk Assessment
              </h3>
              <p style={{ fontSize: '13px', color: '#5A6B7D', lineHeight: '1.6' }}>
                Risk matrix and recommendations for mitigation
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F2040', marginBottom: '8px' }}>
                Action Items
              </h3>
              <p style={{ fontSize: '13px', color: '#5A6B7D', lineHeight: '1.6' }}>
                Prioritized recommendations and next steps for improvement
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
