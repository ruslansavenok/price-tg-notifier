import { Composer } from 'grammy';
import { add } from 'date-fns';
import { parseMessageData } from './utils';
import TgBotUser from '../db/models/TgBotUser';
import TgBotAccessKey from '../db/models/TgBotAccessKey';

function handleLoginCommandFactory(command: string) {
  const bot = new Composer();

  bot.command(command, async ctx => {
    const { args, user } = await parseMessageData(ctx);
    const authKey = args[0];

    if (!authKey) {
      return ctx.reply(
        user.accessCode
          ? `Logged in! key=${user.accessCode.value}, expire at ${user.accessCode.expireAt}`
          : `Invalid format:\n /${command} <key>`
      );
    }

    const key = await TgBotAccessKey.findOne({ value: authKey }).populate(
      'assignedToUser'
    );

    if (
      !key ||
      key.expireAt < new Date() ||
      (key.assignedToUser && key.assignedToUser !== user)
    )
      return ctx.reply('Invalid key');

    await TgBotUser.findOneAndUpdate(
      { tgUserId: user.tgUserId },
      {
        accessCode: key._id
      }
    );
    key.assignedToUser = user;
    await key.save();

    if (!key.expireAt) {
      key.expireAt = add(new Date(), {
        days: key.durationInDays
      });
      await key.save();
    }

    ctx.reply(`Logged in! Key valid till \`${key.expireAt}\``, {
      parse_mode: 'Markdown'
    });
  });

  return bot;
}

export default handleLoginCommandFactory;
