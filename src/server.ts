import 'dotenv/config';
import { createApp } from './app';
import { logInfo, logError } from './utils/logger';
import prisma from './utils/prisma';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

async function main() {
  const app = createApp();

  const server = app.listen(PORT, () => {
    logInfo(`TCG Deck Inventory API listening on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    logInfo(`Received ${signal}, shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  logError('Failed to start server', error);
  process.exit(1);
});
