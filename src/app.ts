import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './utils/middleware';
import { logInfo } from './utils/logger';

const API_BASE_PATH = '/api/v1';

export function createApp() {
  const app = express();

  app.use(cors());

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, _res, next) => {
    logInfo(`${req.method} ${req.path}`);
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use(API_BASE_PATH, routes);

  app.use(errorHandler);

  return app;
}
