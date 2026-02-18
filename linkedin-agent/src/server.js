import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import agentRoutes from './routes/agent.js';
import authRoutes from './routes/auth.js';
import lushaRoutes from './routes/lusha.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3002;

// CORS - allow Chrome extension requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Allow Chrome extension and localhost origins
  if (origin?.startsWith('chrome-extension://') || origin?.startsWith('http://localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/agent', agentRoutes);
app.use('/api/lusha', lushaRoutes);
app.use('/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'linkedin-vincere-agent',
    lusha: !!process.env.LUSHA_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n LinkedIn → Vincere AI Agent`);
  console.log(`  Server running on http://localhost:${PORT}`);
  console.log(`  Vincere domain: ${process.env.VINCERE_DOMAIN || '(not configured)'}\n`);
});
