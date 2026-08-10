// Entry point: boot the HTTP server and start the automation scheduler.
import { createApp } from './app.js';
import { startScheduler } from './automations/scheduler.js';
import config from './config.js';
import logger from './lib/logger.js';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`Wellspire SMS listening on :${config.port} (${config.env})`);
  logger.info(`Data mode: ${config.supabase.configured ? 'Supabase' : 'DEMO (in-memory)'} | AI: ${config.openrouter.configured ? 'on' : 'off'} | Email: ${config.smtp.configured ? 'on' : 'off'}`);
  startScheduler();
});

// Graceful shutdown
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    logger.info(`${sig} received — shutting down.`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}

process.on('unhandledRejection', (err) => logger.error('Unhandled rejection', err));

export default server;
