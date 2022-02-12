import { Composer } from 'grammy';
import { table } from 'table';
import chunk from 'lodash/chunk';
import { MAX_ITEM_PRICE } from '../../config';
import { formatPrice, parseItemUrl } from '../format';
import ParseItemSubscription, {
  IParseItemSubscription
} from '../db/models/ParseItemSubscription';
import { serverNameFromId, getSubscriptionCommand } from '../format';
import { parseMessageData, isValidSubscription } from './utils';

const ITEMS_PER_GROUP = 30;

function getSubscriptionInfo(item: IParseItemSubscription) {
  const enchStr =
    item.minEnchantmentLevel > 0 ? `(+${item.minEnchantmentLevel}) ` : '';
  const title = enchStr + item.parseItem.title;
  const url = parseItemUrl({
    itemId: item.parseItem.parseId,
    serverId: item.serverId
  });

  const formattedSellBuyPrice = [
    `SELL: *${
      item.priceLimit
        ? item.priceLimit === MAX_ITEM_PRICE
          ? 'MAX'
          : item.priceLimit.toLocaleString()
        : '-'
    }*`
  ];
  if (item.buyPriceLimit)
    formattedSellBuyPrice.push(`BUY: *${item.buyPriceLimit.toLocaleString()}*`);

  return `[${title}](${url}) - ${formattedSellBuyPrice.join(' / ')}`;
}

function renderResult(items: IParseItemSubscription[], groupIndex: number) {
  return items
    .map((item, itemIndex) => {
      const itemNumber = ITEMS_PER_GROUP * groupIndex + itemIndex + 1;
      const info = getSubscriptionInfo(item);
      const command = getSubscriptionCommand(item);
      return `${itemNumber}. ${info}\n\`${command}\``;
    })
    .join('\n\n');
}

function handleListCommandFactory(command: string) {
  const bot = new Composer();

  bot.command(command, async ctx => {
    const { user } = await parseMessageData(ctx);

    if (!isValidSubscription(ctx, user)) return;

    const itemSubscriptions = await ParseItemSubscription.find({
      tgUser: user
    }).populate('parseItem');

    chunk(itemSubscriptions, ITEMS_PER_GROUP).forEach((group, i) => {
      ctx.reply(renderResult(group, i), {
        parse_mode: 'Markdown'
      });
    });
  });

  return bot;
}

export default handleListCommandFactory;
