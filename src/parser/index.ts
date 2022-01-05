import { Document } from 'mongoose';
import * as Sentry from '@sentry/node';
import '../db/models/TgBotUser';
import '../db/models/TgBotAccessKey';
import '../db/models/ParseItem';
import ParseItemSubscription, {
  IParseItemSubscription
} from '../db/models/ParseItemSubscription';
import { LISTING_TYPE } from '../db/models/ParseItemListing';
import bot from '../bot';
import { serverNameFromId } from '../bot/utils';
import logger from '../logger';
import parseItemPage from './parseItemPage';
import { processListing, newListingMessage } from './listings';

async function sleep(ms: number) {
  return await new Promise(r => setTimeout(r, ms));
}

async function processTask(
  task: Document<any, any, IParseItemSubscription> & IParseItemSubscription
) {
  const { sellListings, buyListings } = await parseItemPage(
    task.parseItem.parseId,
    task.serverId
  );
  const allSubscriptionsForGivenServer = await ParseItemSubscription.find({
    parseItem: task.parseItem,
    serverId: task.serverId
  }).populate(['parseItem', 'tgUser']);

  for (const rawListing of sellListings) {
    const { isNew, listing } = await processListing(
      task,
      LISTING_TYPE.SELL,
      rawListing
    );
    if (!isNew) continue;

    for (const subscription of allSubscriptionsForGivenServer) {
      const validEnchantmentLevel =
        typeof listing.enchantmentLvl === 'number' &&
        typeof subscription.minEnchantmentLevel === 'number'
          ? listing.enchantmentLvl >= subscription.minEnchantmentLevel
          : true;

      if (
        listing.price <= subscription.priceLimit &&
        listing.registeredAt >= subscription.createdAt &&
        validEnchantmentLevel
      ) {
        bot.api.sendMessage(
          subscription.tgUser.tgUserId,
          newListingMessage(subscription, listing),
          {
            parse_mode: 'Markdown'
          }
        );
      }
      subscription.lastParsedAt = new Date();
      await subscription.save();
    }
  }

  for (const rawListing of buyListings) {
    await processListing(task, LISTING_TYPE.BUY, rawListing);
  }
}

async function markTaskParsed(
  task: Document<any, any, IParseItemSubscription> & IParseItemSubscription
) {
  task.currentWorkerId = null;
  task.lastParsedAt = new Date();
  await task.save();
}

export default async function startParser(workerId: number): Promise<any> {
  try {
    await ParseItemSubscription.updateMany(
      { currentWorkerId: workerId },
      {
        currentWorkerId: null
      }
    );
  } catch (e) {
    console.log(`Failed to start worker, trying again in 3s...`);
    await sleep(3000);
    return startParser(workerId);
  }

  let tickStartedAt: any;
  let tickInterval: any;

  while (true) {
    await sleep(2000);
    const startedAtTs = new Date().getTime();
    let task:
      | (Document<any, any, IParseItemSubscription> & IParseItemSubscription)
      | undefined;

    // TODO:
    // Trying to get some clues on when and why while loop get stuck
    tickStartedAt = new Date().getTime();
    clearInterval(tickInterval);
    tickInterval = setInterval(() => {
      const ts = new Date().getTime();

      if (ts - tickStartedAt > 1000 * 60 * 2) {
        Sentry.captureMessage(`Parser tick is taking too long`, {
          extra: {
            workerId,
            task: task ? JSON.stringify(task) : null,
            startedAtTs,
            now: new Date().getTime()
          }
        });
        clearInterval(tickInterval);
      }
    }, 5000);

    try {
      Sentry.addBreadcrumb({
        message: 'Try to find a task',
        level: Sentry.Severity.Info
      });

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
        Sentry.addBreadcrumb({
          message: `Task found ${task._id}, processing...`,
          level: Sentry.Severity.Info
        });

        await processTask(task);
        await markTaskParsed(task);
        logger.info(
          `Processed ${task.parseItem.parseId} for server=${serverNameFromId(
            task.serverId
          )}, worker=${workerId}`
        );
      } else {
        Sentry.addBreadcrumb({
          message: `No task found`,
          level: Sentry.Severity.Info
        });
        continue;
      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);

      if (task) {
        try {
          await markTaskParsed(task);
        } catch (e) {
          Sentry.captureException(e);
          console.log(e);
        }

        logger.error(
          `Task crashed ${task.parseItem.parseId} for server=${serverNameFromId(
            task.serverId
          )}, worker=${workerId}`
        );
      }

      return startParser(workerId);
    } finally {
      logger.metric.gauge(
        `parser.worker.${workerId}.taskDuration`,
        new Date().getTime() - startedAtTs
      );
    }
  }
}
