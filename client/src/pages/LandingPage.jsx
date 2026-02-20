import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import * as api from '../services/api';

/**
 * Landing Page
 * Home page with project creation and joining capabilities
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  // Create Project Form State
  const [createForm, setCreateForm] = useState({
    clientName: '',
    engagementName: '',
    engagementType: 'ITOM Event Management',
    teamMembers: '',
    observabilityTools: [],
    observabilityOther: '',
    passphrase: '',
  });

  // Join Project Form State
  const [joinForm, setJoinForm] = useState({
    projectName: '',
    passphrase: '',
  });

  const OBSERVABILITY_TOOLS = [
    'Dynatrace',
    'Datadog',
    'Splunk',
    'Nagios',
    'Zabbix',
    'Prometheus',
    'PagerDuty',
    'SolarWinds',
    'New Relic',
    'Grafana',
    'AppDynamics',
    'Instana',
  ];

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError(null);

    if (!createForm.clientName.trim() || !createForm.engagementName.trim() || !createForm.passphrase.trim()) {
      setError('Client Name, Engagement Name, and Passphrase are required');
      return;
    }

    try {
      setCreating(true);
      const teamMembersList = createForm.teamMembers
        .split(',')
        .map(m => m.trim())
        .filter(m => m);

      const tools = [...createForm.observabilityTools];
      if (createForm.observabilityOther.trim()) {
        tools.push(createForm.observabilityOther.trim());
      }

      const projectData = {
        clientName: createForm.clientName,
        engagementName: createForm.engagementName,
        engagementType: createForm.engagementType,
        teamMembers: teamMembersList,
        observabilityTools: tools,
        passphrase: createForm.passphrase,
      };

      const response = await api.projectsApi.create(projectData);
      setShowCreateModal(false);
      navigate(`/project/${response.id}/dashboard`);
    } catch (err) {
      setError(err.message || 'Failed to create project');
      console.error('Error creating project:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinProject = async (e) => {
    e.preventDefault();
    setError(null);

    if (!joinForm.projectName.trim() || !joinForm.passphrase.trim()) {
      setError('Project Name and Passphrase are required');
      return;
    }

    try {
      setJoining(true);
      const response = await api.projectsApi.join({
        projectCode: joinForm.projectName,
        passphrase: joinForm.passphrase,
      });
      setShowJoinModal(false);
      navigate(`/project/${response.id}/dashboard`);
    } catch (err) {
      setError(err.message || 'Failed to join project');
      console.error('Error joining project:', err);
    } finally {
      setJoining(false);
    }
  };

  const toggleToolSelection = (tool) => {
    setCreateForm(prev => ({
      ...prev,
      observabilityTools: prev.observabilityTools.includes(tool)
        ? prev.observabilityTools.filter(t => t !== tool)
        : [...prev.observabilityTools, tool],
    }));
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#F4F6F9',
    },
    navbar: {
      backgroundColor: '#0F2040',
      padding: '16px 32px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    navLogo: {
      color: '#00C2A8',
      fontSize: '20px',
      fontWeight: '600',
      fontFamily: 'Inter, sans-serif',
    },
    main: {
      flex: 1,
      padding: '60px 32px',
    },
    heroSection: {
      textAlign: 'center',
      marginBottom: '80px',
    },
    heroTitle: {
      fontSize: '48px',
      fontWeight: '700',
      color: '#0F2040',
      marginBottom: '16px',
      fontFamily: 'Inter, sans-serif',
    },
    heroSubtitle: {
      fontSize: '16px',
      color: '#5A6B7D',
      marginBottom: '40px',
      maxWidth: '600px',
      margin: '0 auto',
      lineHeight: '1.6',
      fontFamily: 'Inter, sans-serif',
    },
    heroActions: {
      display: 'flex',
      gap: '16px',
      justifyContent: 'center',
      flexWrap: 'wrap',
    },
    actionButton: {
      padding: '12px 32px',
      fontSize: '16px',
      fontWeight: '600',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'Inter, sans-serif',
      transition: 'all 0.3s ease',
    },
    primaryButton: {
      backgroundColor: '#00C2A8',
      color: '#FFFFFF',
    },
    primaryButtonHover: {
      backgroundColor: '#00B399',
      boxShadow: '0 4px 12px rgba(0, 194, 168, 0.3)',
    },
    secondaryButton: {
      backgroundColor: '#FFFFFF',
      color: '#00C2A8',
      border: '2px solid #00C2A8',
    },
    secondaryButtonHover: {
      backgroundColor: '#F0FFFE',
    },
    featuresSection: {
      marginTop: '60px',
    },
    featuresTitle: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#0F2040',
      textAlign: 'center',
      marginBottom: '40px',
      fontFamily: 'Inter, sans-serif',
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
    },
    featureCard: {
      backgroundColor: '#FFFFFF',
      padding: '32px 24px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      textAlign: 'center',
      transition: 'all 0.3s ease',
    },
    featureCardHover: {
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    },
    featureIcon: {
      fontSize: '40px',
      marginBottom: '16px',
    },
    featureCardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#0F2040',
      marginBottom: '12px',
      fontFamily: 'Inter, sans-serif',
    },
    featureCardDesc: {
      fontSize: '14px',
      color: '#5A6B7D',
      lineHeight: '1.6',
      fontFamily: 'Inter, sans-serif',
    },
    footer: {
      backgroundColor: '#0F2040',
      color: '#FFFFFF',
      textAlign: 'center',
      padding: '24px 32px',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
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
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#0F2040',
      marginBottom: '24px',
      fontFamily: 'Inter, sans-serif',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#0F2040',
      marginBottom: '8px',
      fontFamily: 'Inter, sans-serif',
    },
    input: {
      width: '100%',
      padding: '12px',
      fontSize: '14px',
      border: '1px solid #D4DFE8',
      borderRadius: '6px',
      fontFamily: 'Inter, sans-serif',
      boxSizing: 'border-box',
      transition: 'border-color 0.3s',
    },
    inputFocus: {
      borderColor: '#00C2A8',
      outline: 'none',
    },
    select: {
      width: '100%',
      padding: '12px',
      fontSize: '14px',
      border: '1px solid #D4DFE8',
      borderRadius: '6px',
      fontFamily: 'Inter, sans-serif',
      boxSizing: 'border-box',
    },
    toolsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '8px',
      marginTop: '8px',
    },
    toolTag: {
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      border: '2px solid #D4DFE8',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Inter, sans-serif',
      transition: 'all 0.2s',
    },
    toolTagSelected: {
      backgroundColor: '#00C2A8',
      color: '#FFFFFF',
      borderColor: '#00C2A8',
    },
    formActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
    },
    submitButton: {
      flex: 1,
      padding: '12px 24px',
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
    submitButtonDisabled: {
      opacity: '0.6',
      cursor: 'not-allowed',
    },
    cancelButton: {
      flex: 1,
      padding: '12px 24px',
      backgroundColor: '#F4F6F9',
      color: '#0F2040',
      border: '1px solid #D4DFE8',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: 'Inter, sans-serif',
    },
    errorMessage: {
      backgroundColor: '#FEE2E2',
      color: '#991B1B',
      padding: '12px 16px',
      borderRadius: '6px',
      marginBottom: '16px',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
    },
  };

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <nav style={styles.navbar}>
        <div style={styles.navLogo}>
          <Logo tagline={false} />
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Hero Section */}
        <section style={styles.heroSection}>
          <div style={{ marginBottom: '24px' }}>
            <Logo size="large" tagline={true} />
          </div>
          <h1 style={styles.heroTitle}>Enterprise Scoping for ServiceNow Implementations</h1>
          <p style={styles.heroSubtitle}>
            Enscope helps you evaluate organizational readiness across complex workflow implementation
            processes. Get AI-powered insights, dependency analysis, and readiness scoring.
          </p>

          <div style={styles.heroActions}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ ...styles.actionButton, ...styles.primaryButton }}
              onMouseEnter={(e) => Object.assign(e.target.style, styles.primaryButtonHover)}
              onMouseLeave={(e) => Object.assign(e.target.style, styles.primaryButton)}
            >
              Create New Project
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              style={{ ...styles.actionButton, ...styles.secondaryButton }}
              onMouseEnter={(e) => Object.assign(e.target.style, styles.secondaryButtonHover)}
              onMouseLeave={(e) => Object.assign(e.target.style, styles.secondaryButton)}
            >
              Join Existing Project
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section style={styles.featuresSection}>
          <h2 style={styles.featuresTitle}>Key Features</h2>
          <div style={styles.featuresGrid}>
            {[
              { icon: '⚙️', title: 'Workflow Analysis', desc: 'Break down complex workflows into manageable steps and track progress.' },
              { icon: '🔗', title: 'Dependency Mapping', desc: 'Identify and assess dependencies between workflow steps and systems.' },
              { icon: '📊', title: 'Readiness Scoring', desc: 'Get comprehensive readiness assessments with detailed breakdowns.' },
              { icon: '🤖', title: 'AI Insights', desc: 'Leverage AI assistance to identify gaps and recommend improvements.' },
              { icon: '📈', title: 'Progress Tracking', desc: 'Monitor readiness across time with historical tracking and reporting.' },
              { icon: '📄', title: 'Report Export', desc: 'Generate professional reports for stakeholders and documentation.' },
            ].map((feature, idx) => (
              <div
                key={idx}
                style={styles.featureCard}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.featureCardHover)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.featureCard)}
              >
                <div style={styles.featureIcon}>{feature.icon}</div>
                <h3 style={styles.featureCardTitle}>{feature.title}</h3>
                <p style={styles.featureCardDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>&copy; 2024 Enscope. Professional workflow readiness assessment.</p>
      </footer>

      {/* Create Project Modal */}
      <div style={{ ...styles.modal, ...styles[showCreateModal ? 'modalActive' : ''] }}>
        <div style={styles.modalContent}>
          <h2 style={styles.modalTitle}>Create New Project</h2>

          {error && <div style={styles.errorMessage}>{error}</div>}

          <form onSubmit={handleCreateProject}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Client Name *</label>
              <input
                type="text"
                style={styles.input}
                value={createForm.clientName}
                onChange={(e) => setCreateForm({ ...createForm, clientName: e.target.value })}
                placeholder="e.g., Acme Corporation"
                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={(e) => Object.assign(e.target.style, { borderColor: '#D4DFE8' })}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Engagement Name *</label>
              <input
                type="text"
                style={styles.input}
                value={createForm.engagementName}
                onChange={(e) => setCreateForm({ ...createForm, engagementName: e.target.value })}
                placeholder="e.g., Q1 2024 Implementation"
                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={(e) => Object.assign(e.target.style, { borderColor: '#D4DFE8' })}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Engagement Type</label>
              <select
                style={styles.select}
                value={createForm.engagementType}
                onChange={(e) => setCreateForm({ ...createForm, engagementType: e.target.value })}
              >
                <option>ITOM Event Management</option>
                <option>ITOM Incident Management</option>
                <option>ITOM Change Management</option>
                <option>ITOM Asset Management</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Team Member Names</label>
              <textarea
                style={{ ...styles.input, minHeight: '80px' }}
                value={createForm.teamMembers}
                onChange={(e) => setCreateForm({ ...createForm, teamMembers: e.target.value })}
                placeholder="Comma-separated: John Doe, Jane Smith, Bob Johnson"
                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={(e) => Object.assign(e.target.style, { borderColor: '#D4DFE8' })}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Observability Tools</label>
              <div style={styles.toolsContainer}>
                {OBSERVABILITY_TOOLS.map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    style={{
                      ...styles.toolTag,
                      ...(createForm.observabilityTools.includes(tool) ? styles.toolTagSelected : {}),
                    }}
                    onClick={() => toggleToolSelection(tool)}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Other Tools</label>
              <input
                type="text"
                style={styles.input}
                value={createForm.observabilityOther}
                onChange={(e) => setCreateForm({ ...createForm, observabilityOther: e.target.value })}
                placeholder="Enter any other tools (optional)"
                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={(e) => Object.assign(e.target.style, { borderColor: '#D4DFE8' })}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Passphrase *</label>
              <input
                type="password"
                style={styles.input}
                value={createForm.passphrase}
                onChange={(e) => setCreateForm({ ...createForm, passphrase: e.target.value })}
                placeholder="Enter a secure passphrase"
                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={(e) => Object.assign(e.target.style, { borderColor: '#D4DFE8' })}
              />
            </div>

            <div style={styles.formActions}>
              <button
                type="submit"
                style={{
                  ...styles.submitButton,
                  ...(creating ? styles.submitButtonDisabled : {}),
                }}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Project'}
              </button>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Join Project Modal */}
      <div style={{ ...styles.modal, ...styles[showJoinModal ? 'modalActive' : ''] }}>
        <div style={styles.modalContent}>
          <h2 style={styles.modalTitle}>Join Existing Project</h2>

          {error && <div style={styles.errorMessage}>{error}</div>}

          <form onSubmit={handleJoinProject}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Project Name/Code *</label>
              <input
                type="text"
                style={styles.input}
                value={joinForm.projectName}
                onChange={(e) => setJoinForm({ ...joinForm, projectName: e.target.value })}
                placeholder="Enter the project name or code"
                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={(e) => Object.assign(e.target.style, { borderColor: '#D4DFE8' })}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Passphrase *</label>
              <input
                type="password"
                style={styles.input}
                value={joinForm.passphrase}
                onChange={(e) => setJoinForm({ ...joinForm, passphrase: e.target.value })}
                placeholder="Enter the project passphrase"
                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={(e) => Object.assign(e.target.style, { borderColor: '#D4DFE8' })}
              />
            </div>

            <div style={styles.formActions}>
              <button
                type="submit"
                style={{
                  ...styles.submitButton,
                  ...(joining ? styles.submitButtonDisabled : {}),
                }}
                disabled={joining}
              >
                {joining ? 'Joining...' : 'Join Project'}
              </button>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => setShowJoinModal(false)}
                disabled={joining}
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
