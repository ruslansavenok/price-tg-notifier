import '../db/models/ParseItem';
import '../db/models/TgBotUser';
import '../db/models/TgBotAccessKey';
import ParseItemSubscription from '../db/models/ParseItemSubscription';
import ParseItemListing from '../db/models/ParseItemListing';
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

  // TODO:
  // 2. find tasks with same server-id pair to bulk them
  // 3. add workers
  // 4. handle crashing task
  if (task && task.tgUser.accessCode.expireAt > new Date()) {
    const { title, listings } = await parseItemPage(
      task.parseItem.parseId,
      task.serverId
    );

    for (const listing of listings) {
      await ParseItemListing.findOneAndUpdate(
        {
          listingId: listing.id
        },
        {
          parseItem: task.parseItem._id,
          listingId: listing.id,
          sellerName: listing.sellerName,
          registeredAt: new Date(listing.addedAt),
          price: listing.price,
          amount: listing.amount,
          enchantmentLvl: listing.enchantmentLvl
        },
        {
          new: true,
          upsert: true
        }
      );
    }

    await ParseItemSubscription.updateMany(
      {
        parseItem: task.parseItem,
        serverId: task.serverId
      },
      {
        lastParsedAt: new Date()
      }
    );

    console.log(
      `Processed ${listings.length} listings for ${title} on server ${task.serverId}`
    );
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
