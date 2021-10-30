import { Bot } from 'grammy';
import { TELEGRAM_BOT_TOKEN } from '../../config';

const bot = new Bot(TELEGRAM_BOT_TOKEN);

bot.command('start', ctx => {
  ctx.reply('PONG');
});

export default bot;
