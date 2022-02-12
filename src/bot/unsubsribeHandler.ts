import { Composer } from 'grammy';
import ParseItem from '../db/models/ParseItem';
import ParseItemSubscription from '../db/models/ParseItemSubscription';
import { serverNameFromId } from '../format';
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

    const itemSubscriptions = await ParseItemSubscription.find({
      tgUser: user,
      parseItem
    }).populate('parseItem');

    if (itemSubscriptions) {
      for (const sub of itemSubscriptions) {
        await sub.remove();
        ctx.reply(
          `Unsubscribed: ${sub.parseItem.title} on ${serverNameFromId(
            sub.serverId
          )}`
        );
      }
    } else {
      ctx.reply('Nothing found :/');
    }
  });

  return bot;
}

export default handleUnsubsribeCommandFactory;
