import { Composer } from 'grammy';
import { DATASOURCE_HOSTNAME, SERVERS } from '../../config';
import ParseItem from '../db/models/ParseItem';
import ParseItemSubscription from '../db/models/ParseItemSubscription';
import parseItemPage from '../parser/parseItemPage';
import { parseMessageData, isValidSubscription, parseItemId } from './utils';

const invalidFormatMessage = (command: string) => `
Invalid format:
/${command} <itemUrlOrId> <serverName> <priceInkk>
/${command} <itemUrlOrId> <priceInkk>
/${command} <itemUrlOrId> <serverName>
/${command} <itemUrlOrId>

/${command} http://${DATASOURCE_HOSTNAME}/?c=market&a=item&id=48576 airin 100kk
/${command} 48576
/${command} 48576 100kk
`;

function parsePrice(value: string): number {
  const kRegex = /k/g;
  const kMatch = value.match(kRegex);

  if (kMatch) {
    const valueWithoutK = parseFloat(
      parseFloat(value.replace(kRegex, '')).toFixed(kMatch.length)
    );
    return valueWithoutK * Math.pow(1000, kMatch.length);
  } else {
    return parseInt(value, 10);
  }
}

function handleSubsribeCommandFactory(command: string) {
  const bot = new Composer();

  bot.command(command, async ctx => {
    const { args: allArgs, user } = await parseMessageData(ctx);
    if (!isValidSubscription(ctx, user)) return;

    const [itemUrlOrId, ...args] = allArgs;
    let serverIds = null;
    let strPrice = null;

    if (args[0]) {
      const possibleServerKey = args[0].toUpperCase();
      const serverId = SERVERS[possibleServerKey];
      if (serverId) serverIds = [serverId];
    }

    if (args.length === 0) {
      serverIds = Object.values(SERVERS);
    } else if (args.length === 1 && !serverIds) {
      strPrice = args[0];
      serverIds = Object.values(SERVERS);
    } else if (args.length === 2) {
      strPrice = args[1];
    }

    const itemId = parseItemId(itemUrlOrId);
    const price = strPrice ? parsePrice(strPrice) : 99_000_000_000_000;

    if (isNaN(itemId) || isNaN(price) || !serverIds) {
      ctx.reply(invalidFormatMessage(command));
    } else {
      let parseItem = await ParseItem.findOne({ parseId: itemId });

      if (!parseItem) {
        try {
          const { title } = await parseItemPage(itemId);
          parseItem = await ParseItem.create({ parseId: itemId, title });
        } catch (e) {
          return ctx.reply('Invalid <itemUrlOrId>');
        }
      }

      await ParseItemSubscription.findOneAndUpdate(
        {
          tgUser: user,
          parseItem
        },
        {
          servers: serverIds,
          priceLimit: price
        },
        {
          new: true,
          upsert: true
        }
      );

      ctx.reply(`OK ${parseItem.title} - ${price.toLocaleString()}`);
    }
  });

  return bot;
}

export default handleSubsribeCommandFactory;
