import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';

/**
 * Interview Module Page
 * Two-panel workflow interview with AI sidebar assistance
 * Left panel: 60% - main form with 9 fields per step
 * Right panel: 40% - AI guidance sidebar
 */
export default function InterviewModule() {
  const { projectId, workflowIndex } = useParams();
  const navigate = useNavigate();

  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepData, setStepData] = useState({});
  const [saving, setSaving] = useState(false);
  const [aiGuidance, setAiGuidance] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastFocusedField, setLastFocusedField] = useState(null);

  const autoSaveTimerRef = useRef(null);
  const aiTimerRef = useRef(null);

  const STEP_FIELDS = [
    { key: 'step_name', label: 'Step Name', placeholder: 'Enter the name of this step' },
    { key: 'description', label: 'Plain-Language Description', placeholder: 'Describe what happens in this step in simple terms' },
    { key: 'role_team', label: 'Role / Team Performing This Step', placeholder: 'Who is responsible for executing this step?' },
    { key: 'trigger_input', label: 'Trigger / Input', placeholder: 'What triggers this step to begin?' },
    { key: 'systems_tools', label: 'Systems & Tools Used', placeholder: 'List all systems and tools used in this step' },
    { key: 'decision_points', label: 'Decision Points & Branching Conditions', placeholder: 'What decisions are made? What are the different paths?' },
    { key: 'output_handoff', label: 'Output / Handoff to Next Step', placeholder: 'What is the output? How is it passed to the next step?' },
    { key: 'pain_points', label: 'Pain Points & Failure Modes', placeholder: 'What could go wrong? What are the pain points?' },
    { key: 'time_effort', label: 'Estimated Time / Effort', placeholder: 'How long does this step take? What is the effort required?' },
  ];

  // Fetch workflow on mount
  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        setLoading(true);

        // Get project first to find the workflow by index
        const projectData = await api.projectsApi.get(projectId);
        const workflowInfo = projectData.workflows.find(w => w.workflow_index === parseInt(workflowIndex));

        if (!workflowInfo) {
          throw new Error('Workflow not found');
        }

        // Fetch the workflow details by its ID
        const data = await api.workflowsApi.getById(projectId, workflowInfo.id);
        setWorkflow(data);

        // Initialize step data from fetched workflow
        if (data?.steps && data.steps.length > 0) {
          const initialData = {};
          data.steps.forEach((step, idx) => {
            initialData[idx] = step || {};
          });
          setStepData(initialData);
        }
      } catch (err) {
        console.error('Error fetching workflow:', err);
        setError(err.message || 'Failed to load workflow');
      } finally {
        setLoading(false);
      }
    };

    if (projectId && workflowIndex !== undefined) {
      fetchWorkflow();
    }
  }, [projectId, workflowIndex]);

  // Auto-save field changes (debounced 500ms)
  const saveCurrentStep = useCallback(async () => {
    if (!workflow || !stepData[currentStepIndex] || !workflow.steps[currentStepIndex]) return;

    try {
      setSaving(true);
      const stepId = workflow.steps[currentStepIndex].id;
      await api.workflowsApi.updateStep(
        projectId,
        workflow.id,
        stepId,
        stepData[currentStepIndex]
      );
    } catch (err) {
      console.error('Error saving step:', err);
    } finally {
      setSaving(false);
    }
  }, [projectId, currentStepIndex, stepData, workflow]);

  // Debounced auto-save
  const debouncedAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      saveCurrentStep();
    }, 500);
  }, [saveCurrentStep]);

  // AI guidance (debounced 1500ms)
  const fetchAiGuidance = useCallback(async () => {
    if (!lastFocusedField || !stepData[currentStepIndex] || !workflow) return;

    try {
      setAiLoading(true);
      const response = await api.aiApi.getAssistance(
        projectId,
        parseInt(workflowIndex),
        lastFocusedField,
        stepData[currentStepIndex][lastFocusedField] || ''
      );
      setAiGuidance(response);
    } catch (err) {
      console.error('Error fetching AI guidance:', err);
      setAiGuidance({ error: 'Failed to get AI guidance' });
    } finally {
      setAiLoading(false);
    }
  }, [projectId, workflowIndex, currentStepIndex, stepData, lastFocusedField, workflow]);

  const debouncedAiGuidance = useCallback(() => {
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
    }
    aiTimerRef.current = setTimeout(() => {
      fetchAiGuidance();
    }, 1500);
  }, [fetchAiGuidance]);

  // Handle field changes
  const handleFieldChange = (fieldKey, value) => {
    setStepData(prev => ({
      ...prev,
      [currentStepIndex]: {
        ...prev[currentStepIndex],
        [fieldKey]: value,
      },
    }));
    debouncedAutoSave();
  };

  const handleFieldFocus = (fieldKey) => {
    setLastFocusedField(fieldKey);
    debouncedAiGuidance();
  };

  const handleAddStep = async () => {
    try {
      setSaving(true);
      const newStep = {
        step_name: `Step ${(workflow?.steps?.length || 0) + 1}`,
        description: '',
        role_team: '',
        trigger_input: '',
        systems_tools: '',
        decision_points: '',
        output_handoff: '',
        pain_points: '',
        time_effort: '',
      };

      await api.workflowsApi.createStep(projectId, workflow.id, newStep);

      // Refetch workflow
      const updatedWorkflow = await api.workflowsApi.getById(projectId, workflow.id);
      setWorkflow(updatedWorkflow);

      // Add to step data
      setStepData(prev => ({
        ...prev,
        [(updatedWorkflow?.steps?.length || 1) - 1]: newStep,
      }));

      // Navigate to new step
      setCurrentStepIndex((updatedWorkflow?.steps?.length || 1) - 1);
    } catch (err) {
      console.error('Error adding step:', err);
      setError('Failed to add step');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStep = async () => {
    if (!window.confirm('Are you sure you want to delete this step?')) return;

    try {
      setSaving(true);
      const stepId = workflow.steps[currentStepIndex].id;
      await api.workflowsApi.deleteStep(projectId, workflow.id, stepId);

      // Refetch workflow
      const updatedWorkflow = await api.workflowsApi.getById(projectId, workflow.id);
      setWorkflow(updatedWorkflow);

      // Move to previous step or first step
      const newIndex = Math.max(0, currentStepIndex - 1);
      setCurrentStepIndex(newIndex);
    } catch (err) {
      console.error('Error deleting step:', err);
      setError('Failed to delete step');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      setSaving(true);
      await api.workflowsApi.updateStatus(projectId, workflow.id, 'complete');
      // Refetch to confirm
      const updatedWorkflow = await api.workflowsApi.getById(projectId, workflow.id);
      setWorkflow(updatedWorkflow);
    } catch (err) {
      console.error('Error marking workflow complete:', err);
      setError('Failed to update workflow status');
    } finally {
      setSaving(false);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      backgroundColor: '#F4F6F9',
      fontFamily: 'Inter, sans-serif',
    },
    header: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#0F2040',
      color: '#FFFFFF',
      padding: '16px 32px',
      zIndex: 100,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
    headerTitle: {
      fontSize: '20px',
      fontWeight: '600',
    },
    headerActions: {
      display: 'flex',
      gap: '12px',
    },
    headerButton: {
      padding: '8px 16px',
      backgroundColor: 'rgba(255,255,255,0.1)',
      color: '#FFFFFF',
      border: '1px solid rgba(255,255,255,0.3)',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      fontFamily: 'Inter, sans-serif',
      transition: 'all 0.2s',
    },
    headerButtonHover: {
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    mainContent: {
      marginTop: '64px',
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
    },
    leftPanel: {
      flex: '0 0 60%',
      padding: '32px',
      overflowY: 'auto',
      backgroundColor: '#F4F6F9',
    },
    rightPanel: {
      flex: '0 0 40%',
      padding: '32px',
      backgroundColor: '#FFFFFF',
      borderLeft: '1px solid #E5EBF2',
      overflowY: 'auto',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.05)',
    },
    stepNavigator: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      flexWrap: 'wrap',
    },
    stepTab: {
      padding: '8px 16px',
      borderRadius: '6px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #D4DFE8',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      color: '#5A6B7D',
      fontFamily: 'Inter, sans-serif',
      transition: 'all 0.2s',
    },
    stepTabActive: {
      backgroundColor: '#00C2A8',
      color: '#FFFFFF',
      borderColor: '#00C2A8',
    },
    stepTabHover: {
      borderColor: '#00C2A8',
    },
    addStepButton: {
      padding: '8px 16px',
      borderRadius: '6px',
      backgroundColor: '#E8F5F1',
      border: '2px dashed #00C2A8',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      color: '#00C2A8',
      fontFamily: 'Inter, sans-serif',
      transition: 'all 0.2s',
    },
    workflowHeader: {
      marginBottom: '32px',
      paddingBottom: '24px',
      borderBottom: '1px solid #E5EBF2',
    },
    workflowTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#0F2040',
      marginBottom: '8px',
    },
    workflowSubtitle: {
      fontSize: '13px',
      color: '#5A6B7D',
    },
    formField: {
      marginBottom: '24px',
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
    textarea: {
      width: '100%',
      minHeight: '100px',
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #D4DFE8',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      color: '#0F2040',
      boxSizing: 'border-box',
      transition: 'all 0.3s',
      resize: 'vertical',
    },
    textareaFocus: {
      borderColor: '#00C2A8',
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(0, 194, 168, 0.1)',
    },
    aiSidebar: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    },
    aiSection: {
      paddingBottom: '20px',
      borderBottom: '1px solid #E5EBF2',
    },
    aiSectionTitle: {
      fontSize: '13px',
      fontWeight: '700',
      color: '#0F2040',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    aiContent: {
      fontSize: '13px',
      lineHeight: '1.6',
      color: '#5A6B7D',
    },
    aiLoading: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#00C2A8',
      fontSize: '13px',
    },
    spinner: {
      width: '16px',
      height: '16px',
      border: '2px solid #E5EBF2',
      borderTop: '2px solid #00C2A8',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    navigationButtons: {
      display: 'flex',
      gap: '12px',
      marginTop: '32px',
      paddingTop: '24px',
      borderTop: '1px solid #E5EBF2',
    },
    navButton: {
      flex: 1,
      padding: '12px 20px',
      borderRadius: '6px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: 'Inter, sans-serif',
      transition: 'all 0.3s',
    },
    navButtonPrimary: {
      backgroundColor: '#00C2A8',
      color: '#FFFFFF',
    },
    navButtonSecondary: {
      backgroundColor: '#F4F6F9',
      color: '#0F2040',
      border: '1px solid #D4DFE8',
    },
    navButtonDisabled: {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
    dangerButton: {
      backgroundColor: '#FEE2E2',
      color: '#991B1B',
      fontSize: '13px',
      padding: '8px 12px',
      marginTop: '12px',
    },
    loading: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
    },
    error: {
      backgroundColor: '#FEE2E2',
      color: '#991B1B',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '16px',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p style={{ color: '#5A6B7D', fontFamily: 'Inter, sans-serif' }}>Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.leftPanel, padding: '32px' }}>
          <div style={styles.error}>
            <strong>Error</strong>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!workflow || !workflow.steps || workflow.steps.length === 0) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.leftPanel, padding: '32px' }}>
          <div style={styles.error}>
            <strong>No Steps</strong>
            <p>This workflow has no steps yet. Click "Add Step" to begin.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = workflow.steps[currentStepIndex];
  const currentStepFields = stepData[currentStepIndex] || {};

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          Workflow {parseInt(workflowIndex) + 1} - Interview Module
        </div>
        <div style={styles.headerActions}>
          <button
            style={{ ...styles.headerButton }}
            onClick={() => navigate(`/project/${projectId}/dashboard`)}
            onMouseEnter={(e) => Object.assign(e.target.style, styles.headerButtonHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, {})}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Left Panel */}
        <div style={styles.leftPanel}>
          {/* Workflow Header */}
          <div style={styles.workflowHeader}>
            <h2 style={styles.workflowTitle}>Step {currentStepIndex + 1} of {workflow.steps.length}</h2>
            <p style={styles.workflowSubtitle}>
              {saving ? 'Saving...' : 'Auto-saving changes'}
            </p>
          </div>

          {/* Step Navigator */}
          <div style={styles.stepNavigator}>
            {workflow.steps.map((step, idx) => (
              <button
                key={idx}
                style={{
                  ...styles.stepTab,
                  ...(idx === currentStepIndex ? styles.stepTabActive : {}),
                }}
                onClick={() => setCurrentStepIndex(idx)}
                onMouseEnter={(e) => !styles.stepTabActive && Object.assign(e.target.style, styles.stepTabHover)}
                onMouseLeave={(e) => Object.assign(e.target.style, {})}
              >
                {idx + 1}
              </button>
            ))}
            <button
              style={styles.addStepButton}
              onClick={handleAddStep}
              disabled={saving}
              onMouseEnter={(e) => !saving && Object.assign(e.target.style, { backgroundColor: '#D4F3EA' })}
              onMouseLeave={(e) => Object.assign(e.target.style, { backgroundColor: '#E8F5F1' })}
            >
              + Add Step
            </button>
          </div>

          {/* Form Fields */}
          {STEP_FIELDS.map((field) => (
            <div key={field.key} style={styles.formField}>
              <label style={styles.label}>{field.label}</label>
              <textarea
                style={styles.textarea}
                value={currentStepFields[field.key] || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                onFocus={() => handleFieldFocus(field.key)}
                onMouseEnter={(e) => Object.assign(e.target.style, styles.textareaFocus)}
                onMouseLeave={(e) => Object.assign(e.target.style, {})}
                placeholder={field.placeholder}
              />
            </div>
          ))}

          {/* Navigation and Actions */}
          <div style={styles.navigationButtons}>
            <button
              style={{
                ...styles.navButton,
                ...styles.navButtonSecondary,
                ...(currentStepIndex === 0 ? styles.navButtonDisabled : {}),
              }}
              onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
              disabled={currentStepIndex === 0}
              onMouseEnter={(e) => currentStepIndex > 0 && Object.assign(e.target.style, { backgroundColor: '#E5EBF2' })}
              onMouseLeave={(e) => Object.assign(e.target.style, { backgroundColor: '#F4F6F9' })}
            >
              ← Previous Step
            </button>
            <button
              style={{
                ...styles.navButton,
                ...styles.navButtonPrimary,
                ...(currentStepIndex === workflow.steps.length - 1 ? styles.navButtonDisabled : {}),
              }}
              onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
              disabled={currentStepIndex === workflow.steps.length - 1}
              onMouseEnter={(e) => currentStepIndex < workflow.steps.length - 1 && Object.assign(e.target.style, { backgroundColor: '#00B399' })}
              onMouseLeave={(e) => Object.assign(e.target.style, { backgroundColor: '#00C2A8' })}
            >
              Next Step →
            </button>
          </div>

          {/* Step Actions */}
          <button
            style={{ ...styles.dangerButton }}
            onClick={handleDeleteStep}
            disabled={saving || workflow.steps.length <= 1}
            onMouseEnter={(e) => !saving && Object.assign(e.target.style, { backgroundColor: '#FECACA' })}
            onMouseLeave={(e) => Object.assign(e.target.style, { backgroundColor: '#FEE2E2' })}
          >
            Delete This Step
          </button>

          {currentStepIndex === workflow.steps.length - 1 && (
            <button
              style={{
                ...styles.navButton,
                ...styles.navButtonPrimary,
                marginTop: '12px',
              }}
              onClick={handleMarkComplete}
              disabled={saving}
              onMouseEnter={(e) => !saving && Object.assign(e.target.style, { backgroundColor: '#00B399' })}
              onMouseLeave={(e) => Object.assign(e.target.style, { backgroundColor: '#00C2A8' })}
            >
              {saving ? 'Completing...' : 'Mark Workflow Complete'}
            </button>
          )}
        </div>

        {/* Right Panel - AI Sidebar */}
        <div style={styles.rightPanel}>
          <div style={styles.aiSidebar}>
            {/* Contextual Guidance */}
            <div style={styles.aiSection}>
              <div style={styles.aiSectionTitle}>
                <span>🤖</span> Contextual Guidance
              </div>
              {aiLoading ? (
                <div style={styles.aiLoading}>
                  <div style={styles.spinner} />
                  Analyzing...
                </div>
              ) : aiGuidance?.error ? (
                <div style={styles.aiContent}>Unable to load guidance at this time.</div>
              ) : aiGuidance?.guidance ? (
                <div style={styles.aiContent}>{aiGuidance.guidance}</div>
              ) : (
                <div style={styles.aiContent}>Focus on a field to get AI-powered guidance.</div>
              )}
            </div>

            {/* Gap Detection */}
            {aiGuidance?.gaps && aiGuidance.gaps.length > 0 && (
              <div style={styles.aiSection}>
                <div style={styles.aiSectionTitle}>
                  <span>⚠️</span> Potential Gaps
                </div>
                <div style={styles.aiContent}>
                  {aiGuidance.gaps.map((gap, idx) => (
                    <div key={idx} style={{ marginBottom: '12px' }}>
                      • {gap}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Field Info */}
            {lastFocusedField && (
              <div style={styles.aiSection}>
                <div style={styles.aiSectionTitle}>
                  <span>ℹ️</span> Field Information
                </div>
                <div style={styles.aiContent}>
                  Currently editing: <strong>{STEP_FIELDS.find(f => f.key === lastFocusedField)?.label}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
