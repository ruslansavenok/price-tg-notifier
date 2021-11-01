import { Bot, GrammyError, HttpError } from 'grammy';
import { apiThrottler } from '@grammyjs/transformer-throttler';
import { run } from '@grammyjs/runner';
import { TELEGRAM_BOT_TOKEN } from '../../config';
import loginHandler from './loginHandler';
import subscribeHandler from './subscribeHandler';
import unsubscribeHandler from './unsubsribeHandler';
import listHandler from './listHandler';

const bot = new Bot(TELEGRAM_BOT_TOKEN);
bot.api.config.use(apiThrottler());

bot.use(loginHandler('login'));
bot.use(subscribeHandler('sub'));
bot.use(unsubscribeHandler('unsub'));
bot.use(listHandler('list'));

bot.catch(err => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});

async function startBot() {
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

export default startBot;
