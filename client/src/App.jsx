import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import Layout from './components/Layout';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import InterviewModule from './pages/InterviewModule';
import DependencyAssessment from './pages/DependencyAssessment';
import ReadinessScorer from './pages/ReadinessScorer';
import DiagramView from './pages/DiagramView';
import ReportExport from './pages/ReportExport';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/project/:projectId/*"
        element={
          <ProjectProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="workflow/:workflowIndex" element={<InterviewModule />} />
                <Route path="gaps" element={<DependencyAssessment />} />
                <Route path="scores" element={<ReadinessScorer />} />
                <Route path="diagrams/:workflowIndex" element={<DiagramView />} />
                <Route path="reports" element={<ReportExport />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProjectProvider>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
