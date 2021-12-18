import { MONGO_DB_URL } from '../config';
import { setupConnection } from './db/connection';
import { startBot } from './bot';
import startParser from './parser';

(async function () {
  await setupConnection(MONGO_DB_URL);
  console.log('Mongo connected..');

  await startBot();
  console.log('Bot started...');

  for (const workerId of [1, 2, 3, 4]) {
    startParser(workerId);
    console.log(`Parser started for worker=${workerId}..`);
  }
})();
