import { Document } from 'mongoose';
import * as Sentry from '@sentry/node';
import '../db/models/TgBotUser';
import '../db/models/TgBotAccessKey';
import '../db/models/ParseItem';
import ParseItemSubscription, {
  IParseItemSubscription
} from '../db/models/ParseItemSubscription';
import { serverNameFromId } from '../format';
import logger from '../logger';
import { processTask, markTaskParsed } from './task';

interface IWorkerState {
  id: number;
  lastTickAt: number;
  isWorking: boolean;
}

const WORKER_STATE = <Record<number, IWorkerState>>{};

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

  WORKER_STATE[workerId] = {
    id: workerId,
    lastTickAt: Date.now(),
    isWorking: false
  };

  let tickInterval: any;
  const tickOptions = {
    worker: WORKER_STATE[workerId],
    timerId: `${workerId}-${Date.now().toString().slice(-4)}`,
    restartWorker: () => {
      clearInterval(tickInterval);
      startParser(workerId);
    }
  };

  tickInterval = setInterval(() => parseTick(tickOptions), 50);
}

async function parseTick({
  worker,
  timerId,
  restartWorker
}: {
  worker: IWorkerState;
  timerId: String;
  restartWorker: Function;
}) {
  // NOTE:
  // Restart worker if working too long
  if (Date.now() - worker.lastTickAt > 1000 * 60) {
    logger.error('Parser tick is taking too long, restarting...');
    Sentry.captureException('Parser tick is taking too long', {
      extra: {
        id: worker.id,
        ts: Date.now(),
        lastTickAt: worker.lastTickAt
      }
    });
    return restartWorker();
  }

  // NOTE:
  // Skip if worker is busy
  if (worker.isWorking) return;
  worker.isWorking = true;

  // NOTE:
  // Datasource refusing too many req/sec so we sleep for 1500 before every task
  await sleep(1500);

  worker.lastTickAt = Date.now();
  let task:
    | (Document<any, any, IParseItemSubscription> & IParseItemSubscription)
    | undefined;

  try {
    task = await ParseItemSubscription.findOneAndUpdate(
      {
        currentWorkerId: null
      },
      {
        currentWorkerId: worker.id
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
        )}, worker=${timerId}`
      );
    }
  } catch (e) {
    Sentry.captureException(e);
    console.log(e);

    if (task) {
      logger.error(
        `Task crashed ${task.parseItem.parseId} for server=${serverNameFromId(
          task.serverId
        )}, worker=${timerId}`
      );
      logger.metric.increment(`parser.worker.fail`, 1);

      try {
        await markTaskParsed(task);
      } catch (e) {
        Sentry.captureException(e);
        console.log(e);
        return restartWorker();
      }
    }

    return restartWorker();
  } finally {
    logger.metric.gauge(
      `parser.worker.${worker.id}.taskDuration`,
      Date.now() - worker.lastTickAt
    );
    worker.isWorking = false;
  }
}

async function sleep(ms: number) {
  return await new Promise(r => setTimeout(r, ms));
}
