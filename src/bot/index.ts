import { Bot } from 'grammy';
import { TELEGRAM_BOT_TOKEN } from '../../config';
import loginHandler from './loginHandler';
import subscribeHandler from './subscribeHandler';
import unsubscribeHandler from './unsubsribeHandler';

const bot = new Bot(TELEGRAM_BOT_TOKEN);

// TODO: add command description
// await bot.api.setMyCommands([
//   { command: "start", description: "Start the bot" },
//   { command: "help", description: "Show help text" },
//   { command: "settings", description: "Open settings" },
// ]);

bot.use(loginHandler('login'));
bot.use(subscribeHandler('sub'));
bot.use(unsubscribeHandler('unsub'));

export default bot;
