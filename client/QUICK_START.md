# Enscope Frontend - Quick Start Guide

## Installation

```bash
cd client
npm install
npm run dev
```

Access at: `http://localhost:5173`

## Project Structure Quick Reference

```
src/
├── main.jsx              → React entry point
├── App.jsx               → Router (all routes defined here)
├── components/           → Reusable UI components
│   ├── Layout.jsx        → Sidebar + Topbar
│   ├── Logo.jsx
│   ├── ProgressRing.jsx
│   ├── RAGBadge.jsx
│   └── DiagramRenderer.jsx
├── pages/                → Page components for each route
│   ├── LandingPage.jsx
│   ├── Dashboard.jsx
│   ├── InterviewModule.jsx
│   ├── DependencyAssessment.jsx
│   ├── ReadinessScorer.jsx
│   ├── DiagramView.jsx
│   └── ReportExport.jsx
├── hooks/                → Custom React hooks
│   ├── useAutoSave.js    → Auto-save with debounce
│   └── useProject.js     → Access project data
├── context/              → React context providers
│   └── ProjectContext.jsx → Project state provider
├── services/
│   └── api.js            → All backend API calls
└── styles/               → CSS files
    ├── global.css        → Design system & base styles
    └── *.css             → Component-specific styles
```

## Common Tasks

### Add a New Page

1. Create component in `/pages/YourPage.jsx`
2. Add route in `App.jsx`:
```jsx
<Route path="/your-path" element={<YourPage />} />
```

### Use Project Data

```jsx
import { useProject } from '../hooks/useProject';

export default function MyComponent() {
  const { projectData, workflowsData, loading, error } = useProject();
  // Use data...
}
```

### Auto-Save Form Fields

```jsx
import useAutoSave from '../hooks/useAutoSave';
import * as api from '../services/api';

const { value, onChange, isSaving } = useAutoSave(
  'fieldName',
  initialValue,
  async (newValue) => {
    await api.workflowsApi.updateStep(projectId, workflowIndex, stepIndex, { field: newValue });
  }
);

<textarea value={value} onChange={(e) => onChange(e.target.value)} />
```

### Call Backend API

```jsx
import * as api from '../services/api';

// Projects
const project = await api.projectsApi.get(projectId);
const dashboard = await api.projectsApi.getDashboard(projectId);

// Workflows
const workflows = await api.workflowsApi.get(projectId);
await api.workflowsApi.updateStep(projectId, workflowIndex, stepIndex, data);

// Scores
const scores = await api.scoresApi.getForProject(projectId);

// Gaps
const gaps = await api.gapsApi.getAll(projectId);

// Reports
const pdf = await api.reportsApi.downloadPdf(projectId);

// Diagrams
const diagram = await api.diagramsApi.getForWorkflow(projectId, workflowIndex);
```

### Display a Progress Ring

```jsx
import ProgressRing from '../components/ProgressRing';

<ProgressRing
  percentage={75}
  size="medium"
  showLabel={true}
  label="Readiness"
/>
```

### Display RAG Badge

```jsx
import RAGBadge from '../components/RAGBadge';

<RAGBadge severity="red" label="At Risk" />
<RAGBadge severity="amber" label="Caution" />
<RAGBadge severity="green" label="Ready" />
```

### Render Mermaid Diagram

```jsx
import DiagramRenderer from '../components/DiagramRenderer';

<DiagramRenderer
  mermaidDefinition="graph LR..."
  title="Workflow Diagram"
  showExportButtons={true}
/>
```

## Styling

### Using CSS Classes

```jsx
<button className="btn btn-primary">Primary Button</button>
<button className="btn btn-secondary">Secondary Button</button>

<div className="card">
  <div className="card-header">
    <h2 className="card-title">Title</h2>
  </div>
  <div className="card-body">Content</div>
</div>

<span className="badge badge-red">Critical</span>
<span className="badge badge-amber">Warning</span>
<span className="badge badge-green">Ready</span>
```

### Responsive Classes

```jsx
<div className="flex gap-lg items-center justify-between">
  <span>Text</span>
  <button>Action</button>
</div>

<div className="card mt-lg mb-xl">Content</div>
```

### Custom Styles with CSS Variables

All brand colors available as CSS variables:
- `--color-primary-navy`: Main brand color
- `--color-accent-teal`: Interactive elements
- `--color-bg-light`: Page background
- `--color-rag-red`, `--color-rag-amber`, `--color-rag-green`

```css
.my-component {
  color: var(--color-primary-navy);
  background: var(--color-bg-light);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
}
```

## Routes Reference

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | LandingPage | Home page |
| `/project/:projectId` | Dashboard | Project overview |
| `/project/:projectId/workflow/:index` | InterviewModule | Workflow Q&A |
| `/project/:projectId/gaps` | DependencyAssessment | Gap management |
| `/project/:projectId/scores` | ReadinessScorer | Readiness scores |
| `/project/:projectId/diagrams/:index` | DiagramView | Workflow diagram |
| `/project/:projectId/reports` | ReportExport | Report generation |

## Environment Setup

Create `.env.local`:
```env
VITE_API_URL=http://localhost:3000/api
```

## Build & Deploy

```bash
npm run build  # Creates /dist folder
npm run preview  # Preview production build
```

Deploy `/dist` to Vercel, Netlify, or any static host.

## Debug Tips

### Check API Responses
```jsx
// In browser console
await fetch('http://localhost:3000/api/projects/123').then(r => r.json())
```

### Check Component State
Use React DevTools browser extension to inspect component props and state.

### Check Network Requests
Open browser DevTools → Network tab to see all API calls.

## Performance

- API calls use debounced auto-save (500ms)
- Mermaid diagrams lazy-render
- Route-based code splitting
- CSS uses custom properties for efficient theming

## Accessibility

- All buttons and links are keyboard navigable
- Focus states clearly visible
- Color contrast ratios 7:1 (WCAG AA)
- Semantic HTML used throughout

## Support

For issues or questions:
1. Check `/client/README.md` for detailed docs
2. Review `/FRONTEND_SETUP.md` for architecture overview
3. Check `App.jsx` for routing structure
4. Check `services/api.js` for API endpoints

## Common CSS Utilities

| Class | Purpose |
|-------|---------|
| `.flex` | Flexbox display |
| `.flex-col` | Column direction |
| `.gap-lg` | Gap between items |
| `.items-center` | Center items vertically |
| `.justify-between` | Space between items |
| `.mt-lg` / `.mb-lg` | Top/bottom margin |
| `.px-lg` / `.py-lg` | Horizontal/vertical padding |
| `.w-full` | 100% width |
| `.max-w-md` | Max width container |
| `.btn-primary` | Primary button style |
| `.card` | Card component |
| `.badge-red` | Red badge |
| `.alert` | Alert box |

## Hot Tips

1. **Auto-save**: Use `useAutoSave` hook for form fields - automatically saves on change
2. **Loading states**: Wrap async operations in try/catch and show loading spinner
3. **Error handling**: Always display user-friendly error messages
4. **Responsive**: Test with mobile view (Ctrl+Shift+M in Chrome)
5. **Accessibility**: Tab through pages to test keyboard navigation

---

**Happy coding! 🎉**
