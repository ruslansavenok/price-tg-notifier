import { Bot, GrammyError, HttpError } from 'grammy';
import * as Sentry from '@sentry/node';
import { generateUpdateMiddleware } from 'telegraf-middleware-console-time';
import { apiThrottler } from '@grammyjs/transformer-throttler';
import { run } from '@grammyjs/runner';
import { TELEGRAM_BOT_TOKEN } from '../../config';
import loginHandler from './loginHandler';
import subscribeHandler from './subscribeHandler';
import unsubscribeHandler from './unsubsribeHandler';
import listHandler from './listHandler';
import adminGenKeyHandler from './admin/genKeyHandler';
import adminListKeysHandler from './admin/listKeysHandler';

const bot = new Bot(TELEGRAM_BOT_TOKEN);
bot.api.config.use(apiThrottler());

bot.use(generateUpdateMiddleware());

bot.use(loginHandler('login'));
bot.use(subscribeHandler('sub'));
bot.use(unsubscribeHandler('unsub'));
bot.use(listHandler('list'));
bot.use(adminGenKeyHandler('adminGenKey'));
bot.use(adminListKeysHandler('adminListKeys'));

bot.catch(({ ctx, error: e }) => {
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  Sentry.captureException(e);

  ctx.reply('Unknown Error :/');

  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});

export async function startBot() {
  await bot.api.setMyCommands([
    { command: 'login', description: 'Login with key' },
    {
      command: 'sub',
      description: 'Subscribe to item updates'
    },
    {
      command: 'unsub',
      description: 'Unscrubscribe from item updates'
    },
    {
      command: 'list',
      description: 'Show subscribed items'
    }
  ]);
  run(bot);
}

export default bot;
