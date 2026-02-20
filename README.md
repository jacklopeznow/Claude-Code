# Enscope — Enterprise Scoping for ServiceNow Implementations

Enscope is a structured knowledge capture tool for consulting teams conducting ServiceNow ITOM Event Management engagements. It guides interviews with enterprise clients, formalizes operational workflows, generates swimlane diagrams, and assesses agentic AI readiness.

## Architecture

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite via better-sqlite3
- **Diagrams**: Mermaid.js (abstracted behind DiagramRenderer for future React Flow swap)
- **AI**: Anthropic Claude API (real-time interview assistance)
- **PDF Export**: Puppeteer (server-side rendering)

## Local Development

### Prerequisites

- Node.js 20+
- npm 9+
- Anthropic API key

### Setup

```bash
# Clone and install
git clone <repo-url> && cd enscope
npm install
cd client && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY

# Initialize database
npm run db:init

# Start development servers (Express + Vite)
npm run dev
```

The app will be available at `http://localhost:5173` (Vite dev server proxies API requests to port 3001).

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key for Claude | Required |
| `SESSION_SECRET` | Secret for session management | Required |
| `PORT` | Server port | `3001` |
| `DATABASE_PATH` | SQLite database file path | `./data/enscope.db` |

## Production Build

```bash
cd client && npx vite build && cd ..
NODE_ENV=production node server/index.js
```

## Docker Deployment

```bash
docker build -t enscope .
docker run -p 3001:3001 \
  -e ANTHROPIC_API_KEY=your-key \
  -e SESSION_SECRET=your-secret \
  -v enscope-data:/app/data \
  enscope
```

## Railway / Render Deployment

1. Connect your Git repository
2. Set environment variables: `ANTHROPIC_API_KEY`, `SESSION_SECRET`
3. Build command: `cd client && npm install && npx vite build && cd .. && npm install`
4. Start command: `node server/index.js`
5. The SQLite database persists at `DATABASE_PATH` — use a persistent volume on Railway or Render's disk feature

## Modules

1. **Landing & Project Management** — Create/join projects, configure observability tools
2. **Guided Interview** — Step-by-step workflow capture with real-time Claude AI assistance
3. **Foundational Dependency Assessment** — CMDB, Discovery, and observability gap register
4. **Swimlane Diagram Generator** — Auto-generated Mermaid.js diagrams from captured data
5. **Agentic Readiness Scorer** — 5-dimension scoring with contextual reliability modifiers
6. **Report Export** — Per-workflow and engagement rollup reports as PDF
