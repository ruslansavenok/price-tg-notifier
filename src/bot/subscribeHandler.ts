import { Composer } from 'grammy';
import parseArguments from 'minimist';
import { DATASOURCE_HOSTNAME, SERVERS, MAX_ITEM_PRICE } from '../../config';
import ParseItem from '../db/models/ParseItem';
import ParseItemSubscription from '../db/models/ParseItemSubscription';
import parseItemPage from '../parser/parseItemPage';
import {
  parseMessageData,
  isValidSubscription,
  parseItemId,
  serverNameFromId
} from './utils';

const invalidFormatMessage = (command: string) => `
Invalid format:
/${command} <itemUrlOrId>
-s  (REQUIRED) serverName,serverName2
-p  (default: MAX) Price in kk
-bp (default: -) Buy Price in kk
-e  (default: ANY) Enchantment Level

/${command} http://${DATASOURCE_HOSTNAME}/?c=market&a=item&id=48576 -s airin -p 100kk
/${command} 48576 -s airin,elcardia
/${command} 48576 -s airin -p 100kk
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

function parseServerIds(serverNameOrNames: string = ''): [boolean, number[]] {
  let isValidFormat = true;
  let result = [];

  for (const rawKey of serverNameOrNames.split(',')) {
    const key = rawKey.trim().toUpperCase();
    const keyVal = SERVERS[key];
    if (keyVal) {
      result.push(keyVal);
    } else {
      isValidFormat = false;
      break;
    }
  }

  return [isValidFormat, result];
}

function handleSubsribeCommandFactory(command: string) {
  const bot = new Composer();

  bot.command(command, async ctx => {
    const { args, user } = await parseMessageData(ctx);
    if (!isValidSubscription(ctx, user)) return;

    const {
      _: [itemUrlOrId],
      s: argServerNameOrNames,
      p: argPriceInkk,
      bp: argBuyPriceInkk,
      e: argEnchantmentLevel
    } = parseArguments(args);

    const [isServerIdsValid, serverIds] = parseServerIds(argServerNameOrNames);
    const itemId = parseItemId(itemUrlOrId);
    const buyPrice = argBuyPriceInkk ? parsePrice(argBuyPriceInkk) : undefined;
    const price = argPriceInkk
      ? parsePrice(argPriceInkk)
      : buyPrice
      ? undefined
      : MAX_ITEM_PRICE;
    const minEnchantmentLevel =
      argEnchantmentLevel === undefined ? 0 : parseInt(argEnchantmentLevel, 10);
    const priceValue = price || buyPrice;

    if (
      typeof itemId !== 'number' ||
      typeof priceValue !== 'number' ||
      !isServerIdsValid ||
      typeof minEnchantmentLevel !== 'number'
    ) {
      ctx.reply(invalidFormatMessage(command), {
        parse_mode: 'Markdown'
      });
    } else {
      let parseItem = await ParseItem.findOne({ parseId: itemId });

      if (!parseItem) {
        try {
          const { title } = await parseItemPage(itemId, SERVERS.AIRIN);
          parseItem = await ParseItem.create({ parseId: itemId, title });
        } catch (e) {
          return ctx.reply('Invalid <itemUrlOrId>');
        }
      }

      for (const serverId of serverIds) {
        await ParseItemSubscription.findOneAndUpdate(
          {
            tgUser: user,
            parseItem,
            serverId
          },
          {
            serverId,
            priceLimit: price,
            buyPriceLimit: buyPrice,
            minEnchantmentLevel,
            createdAt: new Date()
          },
          {
            new: true,
            upsert: true
          }
        );
        ctx.reply(
          `OK ${parseItem.title} - ${
            priceValue === MAX_ITEM_PRICE ? 'MAX' : priceValue.toLocaleString()
          } - ${serverNameFromId(serverId)}`
        );
      }
    }
  });

  return bot;
}

export default handleSubsribeCommandFactory;
