// Shared Express middleware: async error wrapping, error handler, and
// authentication/authorisation.
//
// Two modes, transparent to routes:
//   • Supabase configured  → real auth. A valid Supabase JWT is required; the
//     caller's `profiles` row (with role) is attached as req.profile.
//   • Demo (no Supabase)   → auth is bypassed. A synthetic profile is attached,
//     its role taken from the `X-Demo-Role` header (default 'admin') so the UI
//     role-switcher still works.
import supabase, { supabaseConfigured } from '../lib/supabaseClient.js';
import logger from '../lib/logger.js';

const STAFF_ROLES = ['admin', 'principal', 'teacher', 'librarian', 'accountant', 'staff'];

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Resolve the caller into req.user / req.profile / req.role. Never blocks.
export async function attachProfile(req, _res, next) {
  if (!supabaseConfigured) {
    // DEMO: synthesise a profile so the app is fully usable without a login.
    const role = String(req.headers['x-demo-role'] || 'admin').toLowerCase();
    req.demo = true;
    req.profile = { id: 'demo', role, full_name: `Demo ${role}`, email: 'demo@wellspire.school' };
    req.role = role;
    return next();
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const { data } = await supabase.auth.getUser(token);
    if (data?.user) {
      req.user = data.user;
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('auth_user_id', data.user.id).maybeSingle();
      req.profile = profile || { role: 'parent', full_name: data.user.email, email: data.user.email };
      req.role = req.profile.role;
    }
  } catch (err) {
    logger.warn(`attachProfile: ${err.message}`);
  }
  next();
}

// Require any authenticated user (passes automatically in demo mode).
export function requireAuth(req, _res, next) {
  if (req.profile) return next();
  next(new HttpError(401, 'Authentication required'));
}

// Require a staff-level role.
export function requireStaff(req, _res, next) {
  if (!req.profile) return next(new HttpError(401, 'Authentication required'));
  if (STAFF_ROLES.includes(req.role)) return next();
  next(new HttpError(403, 'Staff role required for this action'));
}

// Require one of the given roles.
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.profile) return next(new HttpError(401, 'Authentication required'));
  if (roles.includes(req.role)) return next();
  next(new HttpError(403, `Requires role: ${roles.join(', ')}`));
};

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) logger.error(`${req.method} ${req.originalUrl} → ${err.message}`, err.stack);
  res.status(status).json({ error: err.message || 'Internal Server Error', details: err.details });
}
