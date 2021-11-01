import { MONGO_DB_URL } from '../config';
import { setupConnection } from './db/connection';
import startBot from './bot';
import startParser from './parser';

// next steps
// - docker
// - render.com deployment
// - html parsing lib
(async function () {
  await setupConnection(MONGO_DB_URL);
  console.log('Mongo connected..');
  startParser();
  console.log('Parser started..');
  startBot();
  console.log('Bot started...');
})();
