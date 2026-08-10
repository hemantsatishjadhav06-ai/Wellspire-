// Auth endpoints. Sign-in itself happens client-side via the Supabase JS SDK
// (anon key); the browser then sends the JWT as a Bearer token. These endpoints
// report the session identity and the auth mode.
import { Router } from 'express';
import config from '../config.js';
import db from '../lib/db.js';
import { asyncHandler } from '../middleware/index.js';

const router = Router();

// What kind of auth is active + public config the client needs.
router.get('/config', (_req, res) => {
  res.json({
    mode: db.mode,                        // 'supabase' | 'demo'
    authRequired: db.mode === 'supabase', // demo mode needs no login
    school: 'Wellspire International School',
  });
});

// The current caller's profile (or null). Works in both modes.
router.get('/me', asyncHandler(async (req, res) => {
  res.json({
    authenticated: Boolean(req.user) || req.demo === true,
    demo: req.demo === true,
    profile: req.profile || null,
    role: req.role || null,
  });
}));

export default router;
