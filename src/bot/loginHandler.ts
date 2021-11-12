import { Composer } from 'grammy';
import { parseMessageData } from './utils';
import TgBotUser from '../db/models/TgBotUser';

function handleLoginCommandFactory(command: string) {
  const bot = new Composer();

  bot.command(command, async ctx => {
    const { args, user } = await parseMessageData(ctx);
    const authKey = args[0];

    if (!authKey) return ctx.reply(`Invalid format:\n /${command} <key>`);

    ctx.reply(`ok ${authKey}, user: ${user.tgUserId}`);
  });

  return bot;
}

export default handleLoginCommandFactory;
