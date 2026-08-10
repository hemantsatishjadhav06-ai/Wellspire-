// Express application: security-lite middleware, the /api router, and static
// serving of the built React app (web/dist) with SPA fallback.
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import config from './config.js';
import api from './routes/index.js';
import { attachProfile, notFound, errorHandler } from './middleware/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(__dirname, '../../web/dist');

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(config.isProd ? 'combined' : 'dev'));
  app.use(attachProfile);

  // API
  app.use('/api', api);
  app.use('/api', notFound);

  // Static frontend (built by `npm run build`)
  if (fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get('*', (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
  } else {
    app.get('/', (_req, res) =>
      res.status(200).send(
        '<h1>Wellspire SMS API</h1><p>The API is running. Build the frontend with ' +
        '<code>npm run build</code> to serve the dashboard, or hit <code>/api/health</code>.</p>'
      )
    );
  }

  app.use(errorHandler);
  return app;
}

export default createApp;
