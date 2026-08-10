// Tiny structured logger — no dependency, plays nicely with Render logs.
const levels = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = process.env.LOG_LEVEL ? levels[process.env.LOG_LEVEL] ?? 20 : 20;

function emit(level, msg, meta) {
  if (levels[level] < threshold) return;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${msg}`;
  const out = level === 'error' || level === 'warn' ? console.error : console.log;
  if (meta !== undefined) out(line, meta);
  else out(line);
}

export const logger = {
  debug: (m, meta) => emit('debug', m, meta),
  info: (m, meta) => emit('info', m, meta),
  warn: (m, meta) => emit('warn', m, meta),
  error: (m, meta) => emit('error', m, meta),
};

export default logger;
