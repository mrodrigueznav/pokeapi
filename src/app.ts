import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './utils/middleware';
import { logInfo } from './utils/logger';

export function createApp() {
  const app = express();

  app.use(cors());

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, _res, next) => {
    logInfo(`${req.method} ${req.path}`);
    next();
  });

  app.use(routes);

  app.use(errorHandler);

  return app;
}
