import { MONGO_DB_URL } from '../config';
import logger from './logger';
import { setupConnection } from './db/connection';
import { startBot } from './bot';
import startParser from './parser';

(async function () {
  await setupConnection(MONGO_DB_URL);
  logger.info('Mongo connected..');

  await startBot();
  logger.info('Bot started...');

  for (const workerId of [1, 2, 3, 4]) {
    startParser(workerId);
    logger.info(`Parser started for worker=${workerId}..`);
  }
})();
