import { Composer } from 'grammy';
import { parseMessageData, isValidSubscription } from './utils';

function handleListCommandFactory(command: string) {
  const bot = new Composer();

  bot.command(command, async ctx => {
    const { user } = await parseMessageData(ctx);

    if (!isValidSubscription(ctx, user)) return;

    ctx.reply('list');
  });

  return bot;
}

export default handleListCommandFactory;
