import '../db/models/ParseItem';
import '../db/models/TgBotUser';
import '../db/models/TgBotAccessKey';
import ParseItemSubscription from '../db/models/ParseItemSubscription';
import parseItemPage from './parseItemPage';

async function sleep(ms: number) {
  return await new Promise(r => setTimeout(r, ms));
}

async function processOldestTask() {
  const task = await ParseItemSubscription.findOne(
    {},
    {},
    {
      sort: { lastParsedAt: 1 }
    }
  ).populate([
    'parseItem',
    {
      path: 'tgUser',
      populate: {
        path: 'accessCode'
      }
    }
  ]);

  if (task && task.tgUser.accessCode.expireAt < new Date()) {
    for (const serverId of task.servers) {
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
