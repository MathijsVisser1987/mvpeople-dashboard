import { Router } from 'express';
import { getLoginUrl, handleCallback, isAuthenticated } from '../services/vincereAuth.js';

const router = Router();

/**
 * GET /auth/vincere/status - Check authentication status
 */
router.get('/vincere/status', (req, res) => {
  res.json({ authenticated: isAuthenticated() });
});

/**
 * GET /auth/vincere/login - Redirect to Vincere OAuth
 */
router.get('/vincere/login', (req, res) => {
  const url = getLoginUrl();
  res.redirect(url);
});

/**
 * GET /auth/vincere/callback - OAuth callback
 */
router.get('/vincere/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('Missing authorization code');
    }

    await handleCallback(code);
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h1>Vincere verbonden!</h1>
          <p>De agent is nu gekoppeld aan Vincere.</p>
          <a href="/">Terug naar agent</a>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('[Auth] Callback error:', err);
    res.status(500).send(`Authentication failed: ${err.message}`);
  }
});

export default router;
