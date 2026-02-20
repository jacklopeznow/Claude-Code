# Enscope Frontend

Production-quality React frontend for the Enscope workflow readiness assessment platform.

## Project Structure

```
client/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── Layout.jsx       # App layout with sidebar & topbar
│   │   ├── Logo.jsx         # Enscope brand logo
│   │   ├── ProgressRing.jsx # SVG circular progress indicator
│   │   ├── RAGBadge.jsx     # Red/Amber/Green severity badges
│   │   └── DiagramRenderer.jsx # Mermaid diagram display
│   ├── context/             # React context providers
│   │   └── ProjectContext.jsx # Project data provider
│   ├── hooks/               # Custom React hooks
│   │   ├── useAutoSave.js   # Auto-save with debounce
│   │   └── useProject.js    # Access project context
│   ├── pages/               # Page components (routes)
│   │   ├── LandingPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── InterviewModule.jsx
│   │   ├── DependencyAssessment.jsx
│   │   ├── ReadinessScorer.jsx
│   │   ├── DiagramView.jsx
│   │   └── ReportExport.jsx
│   ├── services/            # API client
│   │   └── api.js           # All backend API calls
│   ├── styles/              # CSS stylesheets
│   │   ├── global.css       # Global styles & design system
│   │   ├── layout.css       # Layout-specific styles
│   │   ├── logo.css         # Logo component styles
│   │   ├── progress-ring.css
│   │   ├── rag-badge.css
│   │   ├── diagram-renderer.css
│   │   └── landing-page.css
│   ├── App.jsx              # Main app router
│   └── main.jsx             # React entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Design System

### Colors
- **Primary Navy**: `#0F2040` - Main brand color
- **Accent Teal**: `#00C2A8` - Interactive elements
- **Background Light**: `#F4F6F9` - Page background
- **RAG Colors**: Red `#ef4444`, Amber `#f59e0b`, Green `#10b981`

### Typography
- **Font Family**: Inter (Google Fonts)
- **Font Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

### Responsive Breakpoints
- Desktop: 1024px and above
- Tablet: 768px - 1024px
- Mobile: 480px - 768px
- Small Mobile: Below 480px

## Setup & Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env.local` file:

```env
VITE_API_URL=http://localhost:3000/api
```

## Core Components

### Layout
Provides top navigation bar and sidebar navigation. Responsive hamburger menu on mobile.

```jsx
<Layout>
  <YourPage />
</Layout>
```

### ProjectContext & useProject Hook
Access current project data throughout the app:

```jsx
const { projectData, dashboardData, workflowsData, loading, error } = useProject();
```

### useAutoSave Hook
Auto-saves form fields with 500ms debounce:

```jsx
const { value, onChange, isSaving, error, isDirty, saveImmediately } = useAutoSave(
  'fieldName',
  initialValue,
  async (value) => {
    // Save logic
  }
);
```

### ProgressRing
Animated SVG circular progress indicator:

```jsx
<ProgressRing
  percentage={75}
  size="medium"
  showLabel={true}
  label="Readiness"
/>
```

### RAGBadge
Red/Amber/Green severity indicator:

```jsx
<RAGBadge
  severity="red"
  label="At Risk"
  size="base"
  icon="⚠️"
/>
```

### DiagramRenderer
Mermaid diagram display with export options:

```jsx
<DiagramRenderer
  mermaidDefinition={diagramString}
  title="Workflow Diagram"
  showExportButtons={true}
/>
```

## API Service

The `services/api.js` file provides centralized fetch wrappers for all backend endpoints:

```jsx
// Projects
projectsApi.create(data)
projectsApi.join(projectCode)
projectsApi.get(projectId)
projectsApi.getDashboard(projectId)

// Workflows
workflowsApi.get(projectId)
workflowsApi.createStep(projectId, workflowIndex, stepData)
workflowsApi.updateStep(projectId, workflowIndex, stepIndex, stepData)

// Scores
scoresApi.generate(projectId, workflowIndex)
scoresApi.getForProject(projectId)
scoresApi.getForWorkflow(projectId, workflowIndex)

// Gaps
gapsApi.getAll(projectId)
gapsApi.create(projectId, gapData)
gapsApi.markResolved(projectId, gapId)

// Diagrams
diagramsApi.getForWorkflow(projectId, workflowIndex)
diagramsApi.getWithScores(projectId, workflowIndex)
diagramsApi.getWithGaps(projectId, workflowIndex)

// Reports
reportsApi.getProject(projectId)
reportsApi.downloadPdf(projectId, type)
reportsApi.exportCsv(projectId, type)
```

## Styling

All styles use CSS custom properties for easy theming. Edit `global.css` to customize colors, spacing, typography, and more.

### Utility Classes
- Layout: `.flex`, `.flex-col`, `.items-center`, `.justify-between`
- Spacing: `.mt-lg`, `.mb-base`, `.px-lg`, `.py-base`
- Width: `.w-full`, `.max-w-md`, `.max-w-xl`
- Components: `.btn-primary`, `.btn-secondary`, `.card`, `.badge-red`

## Form Elements

All form inputs support focus states with teal accent and are fully accessible:

```jsx
<input type="text" placeholder="..." />
<textarea rows="6"></textarea>
<select>
  <option>...</option>
</select>
<label>
  <input type="checkbox" />
  Checkbox
</label>
```

## Responsive Design

The design is fully responsive with mobile-first approach:

- Sidebar collapses to hamburger menu on tablet
- Cards stack vertically on mobile
- Typography scales for readability
- Touch-friendly button sizes on mobile

## Accessibility

- WCAG 2.1 compliant color contrasts
- Keyboard navigation support
- Focus indicators on all interactive elements
- Screen reader friendly with semantic HTML
- Supports reduced motion preferences

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: Latest versions

## Performance Optimizations

- Code splitting with React Router
- Lazy loading of page components
- Mermaid diagram lazy rendering
- Debounced auto-save (500ms)
- CSS custom properties for efficient theming
- SVG for icons (no image files)

## Development Guidelines

1. **Components**: Keep components small and focused
2. **Props**: Use TypeScript JSDoc comments for prop types
3. **Hooks**: Extract reusable logic into custom hooks
4. **Styling**: Use CSS classes with global.css variables
5. **API**: Always use `services/api.js` for backend calls
6. **Error Handling**: Display user-friendly error messages
7. **Loading States**: Show loading indicators while fetching

## Deployment

```bash
# Build optimized production bundle
npm run build

# Output is in /dist directory
# Serve with: npx serve dist
```

Deploy the `/dist` folder to any static hosting (Vercel, Netlify, etc.)

## Dependencies

- **react**: UI framework
- **react-dom**: React DOM rendering
- **react-router-dom**: Client-side routing
- **mermaid**: Diagram rendering library

## Future Enhancements

- TypeScript migration
- Unit tests with Vitest
- E2E tests with Playwright
- Dark mode support
- Offline capabilities
- Real-time collaboration
- Advanced charting with D3/Chart.js
