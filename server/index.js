require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const { initializeDatabase } = require('./db/init');
const { getConnection } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize database
let db;
try {
  db = getConnection();
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Routes
const projectsRouter = require('./routes/projects');
const workflowsRouter = require('./routes/workflows');
const scoresRouter = require('./routes/scores');
const gapsRouter = require('./routes/gaps');
const aiRouter = require('./routes/ai');
const reportsRouter = require('./routes/reports');
const diagramsRouter = require('./routes/diagrams');

app.use('/api/projects', projectsRouter);
app.use('/api/projects', reportsRouter);
app.use('/api/workflows', workflowsRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/gaps', gapsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/diagrams', diagramsRouter);

// Serve static files from client/dist in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Fallback to index.html for SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Enscope server running on port ${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('Running in production mode');
  }
});

module.exports = app;
