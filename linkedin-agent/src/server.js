import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import agentRoutes from './routes/agent.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/agent', agentRoutes);
app.use('/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'linkedin-vincere-agent' });
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
