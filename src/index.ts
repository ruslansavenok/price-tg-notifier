import * as Sentry from '@sentry/node';
import { MONGO_DB_URL, SENTRY_DSN } from '../config';
import logger from './logger';
import { setupConnection } from './db/connection';
import { startBot } from './bot';
import startParser from './parser';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1
  });
} else {
  console.log(`Running without sentry...`);
}

(async function () {
  await setupConnection(MONGO_DB_URL);
  logger.info('Mongo connected..');

  await startBot();
  logger.info('Bot started...');

  for (const workerId of [1, 2, 3, 4]) {
    //startParser(workerId);
    logger.info(`Parser started for worker=${workerId}..`);
  }
})();
