import { Router } from 'express';
import vincereService from '../services/vincere.js';
import eightByEightService from '../services/eightByEight.js';

const router = Router();

// --- Vincere OAuth ---

// GET /api/auth/vincere/status
router.get('/vincere/status', async (req, res) => {
  res.json({
    authenticated: await vincereService.isAuthenticated(),
    domain: process.env.VINCERE_DOMAIN,
  });
});

// GET /api/auth/vincere/login - Redirect to Vincere login page
router.get('/vincere/login', (req, res) => {
  const url = vincereService.getAuthorizationUrl();
  res.json({ authUrl: url });
});

// GET /api/auth/vincere/callback - Handle OAuth callback
router.get('/vincere/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    await vincereService.exchangeCodeForTokens(code);
    res.redirect('/?vincere=connected');
  } catch (err) {
    console.error('[Auth] Vincere callback error:', err.message);
    res.status(500).json({ error: 'Token exchange failed', message: err.message });
  }
});

// --- 8x8 Auth ---

// GET /api/auth/8x8/status
router.get('/8x8/status', async (req, res) => {
  try {
    await eightByEightService.ensureAuthenticated();
  } catch {
    // Auto-auth failed or no credentials
  }
  res.json({
    authenticated: eightByEightService.isAuthenticated(),
    pbxId: process.env.EIGHT_BY_EIGHT_PBX_ID,
  });
});

// POST /api/auth/8x8/login - Authenticate with 8x8 (username/password)
router.post('/8x8/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const result = await eightByEightService.authenticate(username, password);
    res.json({ success: true, expiresIn: result.expires_in });
  } catch (err) {
    console.error('[Auth] 8x8 login error:', err.message);
    res.status(401).json({ error: '8x8 authentication failed', message: err.message });
  }
});

// POST /api/auth/8x8/login-apikey - Try API key auth
router.post('/8x8/login-apikey', async (req, res) => {
  try {
    const result = await eightByEightService.authenticateWithApiKey();
    res.json({ success: true, expiresIn: result.expires_in });
  } catch (err) {
    console.error('[Auth] 8x8 API key auth error:', err.message);
    res.status(401).json({ error: '8x8 API key auth failed', message: err.message });
  }
});

// --- Combined status ---

// GET /api/auth/status
router.get('/status', async (req, res) => {
  try {
    await eightByEightService.ensureAuthenticated();
  } catch {
    // Auto-auth failed or no credentials
  }
  res.json({
    vincere: {
      authenticated: await vincereService.isAuthenticated(),
      domain: process.env.VINCERE_DOMAIN,
    },
    eightByEight: {
      authenticated: eightByEightService.isAuthenticated(),
      pbxId: process.env.EIGHT_BY_EIGHT_PBX_ID,
    },
  });
});

export default router;
