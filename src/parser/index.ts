import { Document } from 'mongoose';
import formatDate from 'date-fns/format';
import '../db/models/TgBotUser';
import '../db/models/TgBotAccessKey';
import '../db/models/ParseItem';
import ParseItemSubscription, {
  IParseItemSubscription
} from '../db/models/ParseItemSubscription';
import ParseItemListing, {
  IParseItemlisting
} from '../db/models/ParseItemListing';
import bot from '../bot';
import parseItemPage, { itemUrl } from './parseItemPage';

async function sleep(ms: number) {
  return await new Promise(r => setTimeout(r, ms));
}

const newListingMessage = (
  task: Document<any, any, IParseItemSubscription> & IParseItemSubscription,
  listing: Document<any, any, IParseItemlisting> & IParseItemlisting
) => `🚨🚨
*ID*: ${task.parseItem.parseId}
*Title:* ${task.parseItem.title}
*Price:* ${listing.price.toLocaleString()}
*Amount:* ${listing.amount ? listing.amount.toLocaleString() : '-'}
*Added At:* ${formatDate(listing.registeredAt, 'MM/dd/yyyy - HH:mm')}
*ENH:* ${listing.enchantmentLvl ? `+${listing.enchantmentLvl}` : '-'}
*SELLER:* ${listing.sellerName}
*ID:* ${listing.listingId}
*SERVER:* ${task.serverId}
[OPEN L2ON](${itemUrl({
  itemId: task.parseItem.parseId,
  serverId: task.serverId
})})
`;

async function processTask(
  task: Document<any, any, IParseItemSubscription> & IParseItemSubscription
) {
  const { listings } = await parseItemPage(
    task.parseItem.parseId,
    task.serverId
  );

  for (const listing of listings) {
    const { ok, value, lastErrorObject } =
      await ParseItemListing.findOneAndUpdate(
        {
          listingId: listing.id
        },
        {
          parseItem: task.parseItem._id,
          listingId: listing.id,
          serverId: task.serverId,
          sellerName: listing.sellerName,
          registeredAt: new Date(listing.registeredAt),
          price: listing.price,
          amount: listing.amount,
          enchantmentLvl: listing.enchantmentLvl
        },
        {
          new: true,
          upsert: true,
          rawResult: true
        }
      );

    if (ok === 0 || !value || !lastErrorObject) {
      throw { value, lastErrorObject };
    } else if (
      lastErrorObject.updatedExisting === false &&
      listing.price <= task.priceLimit
    ) {
      await bot.api.sendMessage(
        task.tgUser.tgUserId,
        newListingMessage(task, value),
        {
          parse_mode: 'Markdown'
        }
      );
    }
  }
}

async function markTaskParsed(
  task: Document<any, any, IParseItemSubscription> & IParseItemSubscription
) {
  task.currentWorkerId = null;
  task.lastParsedAt = new Date();
  await task.save();
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
        await markTaskParsed(task);
        console.log(
          `Processed ${task.parseItem.title} for server=${task.serverId} on worker ${workerId}`
        );
      }
    } catch (e) {
      console.log(e);

      if (task) {
        await markTaskParsed(task);
        console.log(
          `Task crashed ${task.parseItem.parseId} for server=${task.serverId}`
        );
      }
    }
    await sleep(5000);
  }
}
