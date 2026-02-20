import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import RAGBadge from '../components/RAGBadge';
import * as api from '../services/api';

/**
 * Dependency Assessment Page
 * View and manage workflow dependencies and gaps
 */
export default function DependencyAssessment() {
  const { projectId } = useParams();
  const [gaps, setGaps] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filteredGaps, setFilteredGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [sortBy, setSortBy] = useState('severity');
  const [showAddGapForm, setShowAddGapForm] = useState(false);
  const [newGap, setNewGap] = useState({
    gapType: '',
    description: '',
    severity: 'amber',
    workflowIndex: 0,
    impact: '',
  });

  const GAP_TYPES = ['CMDB Health', 'Discovery Cadence', 'Observability Integration', 'Tool Integration', 'Other'];
  const DIMENSIONS = [
    { key: 'cmdbHealth', label: 'CMDB Health' },
    { key: 'discoveryCadence', label: 'Discovery Cadence' },
    { key: 'observabilityIntegration', label: 'Observability Integration' },
  ];

  useEffect(() => {
    const fetchGaps = async () => {
      try {
        setLoading(true);
        const [gapsData, summaryData] = await Promise.all([
          api.gapsApi.getAll(projectId),
          api.gapsApi.getSummary(projectId),
        ]);
        setGaps(gapsData || []);
        setSummary(summaryData);
        applyFilters(gapsData, filterSeverity, sortBy);
      } catch (err) {
        console.error('Error fetching gaps:', err);
        setError(err.message || 'Failed to load dependencies');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchGaps();
    }
  }, [projectId]);

  const applyFilters = (data, severity, sort) => {
    let filtered = [...data];

    // Filter by severity
    if (severity !== 'all') {
      filtered = filtered.filter(g => g.severity === severity);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sort === 'severity') {
        const severityOrder = { red: 0, amber: 1, green: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      } else if (sort === 'workflow') {
        return a.workflowIndex - b.workflowIndex;
      }
      return 0;
    });

    setFilteredGaps(filtered);
  };

  const handleFilterChange = (severity) => {
    setFilterSeverity(severity);
    applyFilters(gaps, severity, sortBy);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    applyFilters(gaps, filterSeverity, sort);
  };

  const handleResolveGap = async (gapId) => {
    try {
      await api.gapsApi.markResolved(projectId, gapId);
      const updated = gaps.filter(g => g.id !== gapId);
      setGaps(updated);
      applyFilters(updated, filterSeverity, sortBy);
    } catch (err) {
      console.error('Error resolving gap:', err);
      setError('Failed to resolve gap');
    }
  };

  const handleAddGap = async (e) => {
    e.preventDefault();
    if (!newGap.gapType.trim() || !newGap.description.trim()) {
      setError('Gap type and description are required');
      return;
    }

    try {
      const response = await api.gapsApi.create(projectId, newGap);
      setGaps([...gaps, response]);
      applyFilters([...gaps, response], filterSeverity, sortBy);
      setNewGap({
        gapType: '',
        description: '',
        severity: 'amber',
        workflowIndex: 0,
        impact: '',
      });
      setShowAddGapForm(false);
    } catch (err) {
      console.error('Error adding gap:', err);
      setError('Failed to add gap');
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
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: '14px',
      color: '#5A6B7D',
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '24px',
      marginBottom: '32px',
    },
    summaryCard: {
      backgroundColor: '#FFFFFF',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    summaryLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#5A6B7D',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '12px',
    },
    summaryValue: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#0F2040',
    },
    dimensionLabel: {
      fontSize: '11px',
      fontWeight: '600',
      color: '#9CA3AF',
      marginTop: '8px',
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: '24px',
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
    controls: {
      display: 'flex',
      gap: '16px',
      marginBottom: '24px',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    controlGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    controlLabel: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#5A6B7D',
    },
    select: {
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #D4DFE8',
      fontSize: '13px',
      fontFamily: 'Inter, sans-serif',
      color: '#0F2040',
      cursor: 'pointer',
    },
    button: {
      padding: '10px 16px',
      borderRadius: '6px',
      border: 'none',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: 'Inter, sans-serif',
      transition: 'all 0.3s',
    },
    primaryButton: {
      backgroundColor: '#00C2A8',
      color: '#FFFFFF',
    },
    primaryButtonHover: {
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
    table: {
      width: '100%',
      borderCollapse: 'collapse',
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
    emptyState: {
      textAlign: 'center',
      padding: '40px 24px',
      color: '#9CA3AF',
    },
    modal: {
      display: 'none',
      position: 'fixed',
      zIndex: 1000,
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalActive: {
      display: 'flex',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      padding: '32px',
      borderRadius: '12px',
      maxWidth: '500px',
      width: '90%',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#0F2040',
      marginBottom: '24px',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      color: '#0F2040',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #D4DFE8',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      boxSizing: 'border-box',
    },
    textarea: {
      width: '100%',
      minHeight: '100px',
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #D4DFE8',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      boxSizing: 'border-box',
      resize: 'vertical',
    },
    formActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
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
          <p style={{ color: '#5A6B7D', fontFamily: 'Inter, sans-serif' }}>Loading dependencies...</p>
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
        <h1 style={styles.title}>Dependency Assessment</h1>
        <p style={styles.subtitle}>Identify and track workflow dependencies and gaps</p>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Summary Cards */}
      {summary && (
        <div style={styles.summaryGrid}>
          {DIMENSIONS.map(dim => (
            <div key={dim.key} style={styles.summaryCard}>
              <div style={styles.summaryLabel}>{dim.label}</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <RAGBadge severity="red" size="sm" label="R" />
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#EF4444' }}>
                      {summary[dim.key]?.red || 0}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <RAGBadge severity="amber" size="sm" label="A" />
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#F59E0B' }}>
                      {summary[dim.key]?.amber || 0}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <RAGBadge severity="green" size="sm" label="G" />
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#10B981' }}>
                      {summary[dim.key]?.green || 0}
                    </div>
                  </div>
                </div>
              </div>
              <div style={styles.dimensionLabel}>
                Overall: {summary[dim.key]?.overall || 'AMBER'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gaps Table Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Identified Gaps</h2>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={() => setShowAddGapForm(true)}
            onMouseEnter={(e) => Object.assign(e.target.style, styles.primaryButtonHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, styles.primaryButton)}
          >
            + Add Gap
          </button>
        </div>

        {/* Filters */}
        <div style={{ ...styles.cardBody, borderBottom: '1px solid #E5EBF2' }}>
          <div style={styles.controls}>
            <div style={styles.controlGroup}>
              <label style={styles.controlLabel}>Filter by Severity:</label>
              <select
                style={styles.select}
                value={filterSeverity}
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="all">All</option>
                <option value="red">Critical (Red)</option>
                <option value="amber">Caution (Amber)</option>
                <option value="green">Resolved (Green)</option>
              </select>
            </div>
            <div style={styles.controlGroup}>
              <label style={styles.controlLabel}>Sort by:</label>
              <select
                style={styles.select}
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <option value="severity">Severity</option>
                <option value="workflow">Workflow</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={styles.cardBody}>
          {filteredGaps && filteredGaps.length > 0 ? (
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={styles.tableHeaderCell}>Severity</th>
                  <th style={styles.tableHeaderCell}>Gap Type</th>
                  <th style={styles.tableHeaderCell}>Description</th>
                  <th style={styles.tableHeaderCell}>Workflow</th>
                  <th style={styles.tableHeaderCell}>Impact</th>
                  <th style={styles.tableHeaderCell}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredGaps.map((gap) => (
                  <tr
                    key={gap.id}
                    style={styles.tableRow}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.tableRowHover)}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, {})}
                  >
                    <td style={styles.tableCell}>
                      <RAGBadge severity={gap.severity} size="sm" />
                    </td>
                    <td style={styles.tableCell}>
                      <strong>{gap.gapType}</strong>
                    </td>
                    <td style={styles.tableCell}>{gap.description}</td>
                    <td style={styles.tableCell}>WF {gap.workflowIndex + 1}</td>
                    <td style={{ ...styles.tableCell, fontSize: '13px' }}>
                      {gap.impact || 'N/A'}
                    </td>
                    <td style={styles.tableCell}>
                      <button
                        style={{
                          ...styles.button,
                          ...styles.secondaryButton,
                          fontSize: '12px',
                          padding: '6px 12px',
                        }}
                        onClick={() => handleResolveGap(gap.id)}
                        onMouseEnter={(e) => Object.assign(e.target.style, styles.secondaryButtonHover)}
                        onMouseLeave={(e) => Object.assign(e.target.style, styles.secondaryButton)}
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.emptyState}>
              <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No gaps found</p>
              <p>Great job! All identified gaps have been addressed.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Gap Modal */}
      <div style={{ ...styles.modal, ...styles[showAddGapForm ? 'modalActive' : ''] }}>
        <div style={styles.modalContent}>
          <h2 style={styles.modalTitle}>Add Dependency Gap</h2>

          <form onSubmit={handleAddGap}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Gap Type *</label>
              <select
                style={styles.input}
                value={newGap.gapType}
                onChange={(e) => setNewGap({ ...newGap, gapType: e.target.value })}
              >
                <option value="">Select a gap type...</option>
                {GAP_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description *</label>
              <textarea
                style={styles.textarea}
                value={newGap.description}
                onChange={(e) => setNewGap({ ...newGap, description: e.target.value })}
                placeholder="Describe the gap or dependency issue"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Severity</label>
              <select
                style={styles.input}
                value={newGap.severity}
                onChange={(e) => setNewGap({ ...newGap, severity: e.target.value })}
              >
                <option value="green">Resolved (Green)</option>
                <option value="amber">Caution (Amber)</option>
                <option value="red">Critical (Red)</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Impact</label>
              <input
                type="text"
                style={styles.input}
                value={newGap.impact}
                onChange={(e) => setNewGap({ ...newGap, impact: e.target.value })}
                placeholder="e.g., High, Medium, Low"
              />
            </div>

            <div style={styles.formActions}>
              <button
                type="submit"
                style={{ ...styles.button, ...styles.primaryButton, flex: 1 }}
                onMouseEnter={(e) => Object.assign(e.target.style, styles.primaryButtonHover)}
                onMouseLeave={(e) => Object.assign(e.target.style, styles.primaryButton)}
              >
                Add Gap
              </button>
              <button
                type="button"
                style={{ ...styles.button, ...styles.secondaryButton, flex: 1 }}
                onClick={() => setShowAddGapForm(false)}
                onMouseEnter={(e) => Object.assign(e.target.style, styles.secondaryButtonHover)}
                onMouseLeave={(e) => Object.assign(e.target.style, styles.secondaryButton)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
