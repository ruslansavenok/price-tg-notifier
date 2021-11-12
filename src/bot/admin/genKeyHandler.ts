import { Composer } from 'grammy';
import { v4 as uuidv4 } from 'uuid';
import { parseMessageData } from '../utils';
import TgBotAccessKey from '../../db/models/TgBotAccessKey';

function handleGenKeyFactory(command: string) {
  const bot = new Composer();

  bot.command(command, async ctx => {
    const { args, user } = await parseMessageData(ctx);
    const durationInDays = parseInt(args[0], 10);
    const maxCheckItems = parseInt(args[1], 10);

    if (!user.isAdmin) return false;
    if (
      isNaN(durationInDays) ||
      durationInDays < 1 ||
      isNaN(maxCheckItems) ||
      maxCheckItems < 1
    )
      return ctx.reply(
        `Invalid format: /${command} <durationInDays> <maxCheckItems>`
      );

    try {
      const newKey = await TgBotAccessKey.create({
        value: uuidv4(),
        durationInDays,
        maxCheckItems
      });
      ctx.reply(
        `Added \`${newKey.value}\` duration=${durationInDays}, max=${maxCheckItems}`,
        {
          parse_mode: 'Markdown'
        }
      );
    } catch (e) {
      return ctx.reply('Failed :/');
    }
  });

  return bot;
}

export default handleGenKeyFactory;
