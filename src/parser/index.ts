import '../db/models/ParseItem';
import '../db/models/TgBotUser';
import '../db/models/TgBotAccessKey';
import ParseItemSubscription, {
  IParseItemSubscription
} from '../db/models/ParseItemSubscription';
import ParseItemListing from '../db/models/ParseItemListing';
import parseItemPage from './parseItemPage';

async function sleep(ms: number) {
  return await new Promise(r => setTimeout(r, ms));
}

async function processTask(task: IParseItemSubscription) {
  const { listings } = await parseItemPage(
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
}

export default async function startParser(workerId: number) {
  await ParseItemSubscription.updateMany(
    { currentWorkerId: workerId },
    {
      currentWorkerId: null
    }
  );

  while (true) {
    let task;

    try {
      task = await ParseItemSubscription.findOneAndUpdate(
        {
          currentWorkerId: null
        },
        {
          currentWorkerId: workerId
        },
        {
          returnDocument: 'after',
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

      if (task && task.tgUser.accessCode.expireAt > new Date()) {
        await processTask(task);
        console.log(
          `Processed ${task.parseItem.title} for server=${task.serverId} on worker ${workerId}`
        );
        task.currentWorkerId = null;
        await task.save();
      }
    } catch (e) {
      console.log(e);

      if (task) {
        console.log(
          `Task crashed ${task.parseItem.parseId} for server=${task.serverId}`
        );
        task.currentWorkerId = null;
        task.lastParsedAt = new Date();
        await task.save();
      }
    }
    await sleep(5000);
  }
}
