import { Bot } from 'grammy';
import { TELEGRAM_BOT_TOKEN } from '../../config';
import loginHandler from './loginHandler';
import subscribeHandler from './subscribeHandler';
import unsubscribeHandler from './unsubsribeHandler';

const bot = new Bot(TELEGRAM_BOT_TOKEN);

bot.use(loginHandler('login'));
bot.use(subscribeHandler('sub'));
bot.use(unsubscribeHandler('unsub'));

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
    }
  ]);
  bot.start();
}

export default startBot;
