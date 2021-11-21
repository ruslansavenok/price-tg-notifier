import { MONGO_DB_URL } from '../../config';
import { setupConnection } from '../db/connection';
import ParseItemSubscription from '../db/models/ParseItemSubscription';
import parseItemPage from './parseItemPage';

require('../db/models/ParseItem');

async function sleep(ms: number) {
  return await new Promise(r => setTimeout(r, ms));
}

// TODO:
// must check for user license
async function processOldestTask() {
  const task = await ParseItemSubscription.findOne(
    {},
    {},
    {
      sort: { lastParsedAt: 1 }
    }
  ).populate('parseItem');

  if (task) {
    for (let serverId of task.servers) {
      await parseItemPage(task.parseItem.parseId, serverId);
      console.log(`parsed ${task.parseItem.parseId}-${serverId}`);
    }

    task.lastParsedAt = new Date();
    await task.save();
  }
}

export default async function startParser() {
  while (true) {
    try {
      await processOldestTask();
    } catch (e) {
      console.log(`Parser crashed`, e);
    }
    await sleep(5000);
  }
}
