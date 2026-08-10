// Shared Express middleware: async error wrapping, a standard error handler,
// and (optional) Supabase JWT extraction.
import supabase, { supabaseConfigured } from '../lib/supabaseClient.js';
import logger from '../lib/logger.js';

/** Wrap an async route so thrown errors reach the error handler. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** A small typed error helper. */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Attach `req.user` when a valid Supabase bearer token is present. Never blocks. */
export async function attachUser(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || !supabaseConfigured) return next();
  try {
    const { data } = await supabase.auth.getUser(token);
    if (data?.user) req.user = data.user;
  } catch {
    /* ignore — treat as anonymous */
  }
  next();
}

/** 404 for unknown /api routes. */
export function notFound(req, res) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

/** Central error handler. */
export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) logger.error(`${req.method} ${req.originalUrl} → ${err.message}`, err.stack);
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    details: err.details,
  });
}
