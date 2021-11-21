import { Composer } from 'grammy';
import ParseItem from '../db/models/ParseItem';
import ParseItemSubscription from '../db/models/ParseItemSubscription';
import { parseMessageData, isValidSubscription, parseItemId } from './utils';

const invalidFormatMsg = (command: string) => `
Invalid format:
/${command} <itemUrlOrId>
`;

function handleUnsubsribeCommandFactory(command: string) {
  const bot = new Composer();

  bot.command(command, async ctx => {
    const { args, user } = await parseMessageData(ctx);
    if (!isValidSubscription(ctx, user)) return;

    const [itemUrlOrId] = args;
    const itemId = parseItemId(itemUrlOrId);

    if (isNaN(itemId)) return ctx.reply(invalidFormatMsg(command));

    const parseItem = await ParseItem.findOne({ parseId: itemId });
    if (!parseItem) return ctx.reply('Invalid <itemUrlOrId>');

    const itemSubscription = await ParseItemSubscription.findOne({
      tgUser: user,
      parseItem
    }).populate('parseItem');

    if (itemSubscription) {
      await itemSubscription.remove();
      ctx.reply(`Unsubscribed: ${itemSubscription.parseItem.title}`);
    } else {
      ctx.reply('Nothing found :/');
    }
  });

  return bot;
}

export default handleUnsubsribeCommandFactory;
