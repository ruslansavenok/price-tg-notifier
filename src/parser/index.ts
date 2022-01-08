import { Document } from 'mongoose';
import * as Sentry from '@sentry/node';
import '../db/models/TgBotUser';
import '../db/models/TgBotAccessKey';
import '../db/models/ParseItem';
import ParseItemSubscription, {
  IParseItemSubscription
} from '../db/models/ParseItemSubscription';
import { serverNameFromId } from '../bot/utils';
import logger from '../logger';
import { processTask, markTaskParsed } from './task';

async function sleep(ms: number) {
  return await new Promise(r => setTimeout(r, ms));
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

  while (true) {
    await sleep(2000);
    const startedAtTs = new Date().getTime();
    let task:
      | (Document<any, any, IParseItemSubscription> & IParseItemSubscription)
      | undefined;

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
        logger.info(
          `Processed ${task.parseItem.parseId} for server=${serverNameFromId(
            task.serverId
          )}, worker=${workerId}`
        );
      } else {
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
