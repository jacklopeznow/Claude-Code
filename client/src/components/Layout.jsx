import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Logo from './Logo';
import '../styles/layout.css';

/**
 * Layout Component
 * Provides top navigation, sidebar, and main content area
 * Responsive mobile hamburger menu
 */
export default function Layout({ children }) {
  const { projectId } = useParams();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when location changes
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Extract project name from URL or use default
  // In a real app, this would come from ProjectContext
  const projectName = 'Project Name';

  return (
    <div className="layout">
      {/* Top Navigation Bar */}
      <nav className="topbar">
        <div className="topbar-left">
          <button
            className="topbar-hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>

          <Link to="/" className="topbar-logo">
            <Logo />
          </Link>

          {projectId && <div className="topbar-project-name">{projectName}</div>}
        </div>

        <div className="topbar-right">
          <button className="btn-tertiary btn-sm">Help</button>
          <button className="btn-tertiary btn-sm">⚙️</button>
        </div>
      </nav>

      {/* Sidebar Navigation */}
      {projectId && (
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Project</div>

            <Link
              to={`/project/${projectId}`}
              className={`sidebar-item ${isActive(`/project/${projectId}`) ? 'active' : ''}`}
            >
              <span className="sidebar-icon">📊</span>
              Dashboard
            </Link>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Workflows</div>

            {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
              <Link
                key={index}
                to={`/project/${projectId}/workflow/${index}`}
                className={`sidebar-item ${
                  isActive(`/project/${projectId}/workflow/${index}`) ? 'active' : ''
                }`}
              >
                <span className="sidebar-icon">⚙️</span>
                Workflow {index + 1}
              </Link>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Analysis</div>

            <Link
              to={`/project/${projectId}/gaps`}
              className={`sidebar-item ${isActive(`/project/${projectId}/gaps`) ? 'active' : ''}`}
            >
              <span className="sidebar-icon">🔗</span>
              Dependencies
            </Link>

            <Link
              to={`/project/${projectId}/scores`}
              className={`sidebar-item ${isActive(`/project/${projectId}/scores`) ? 'active' : ''}`}
            >
              <span className="sidebar-icon">📈</span>
              Readiness
            </Link>

            <Link
              to={`/project/${projectId}/reports`}
              className={`sidebar-item ${isActive(`/project/${projectId}/reports`) ? 'active' : ''}`}
            >
              <span className="sidebar-icon">📄</span>
              Reports
            </Link>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>

      {/* Overlay for mobile sidebar */}
      {projectId && sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
