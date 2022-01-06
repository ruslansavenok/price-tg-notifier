import { Composer } from 'grammy';
import { table } from 'table';
import chunk from 'lodash/chunk';
import { MAX_ITEM_PRICE } from '../../config';
import ParseItemSubscription, {
  IParseItemSubscription
} from '../db/models/ParseItemSubscription';
import {
  parseMessageData,
  isValidSubscription,
  serverNameFromId
} from './utils';

function renderResult(items: IParseItemSubscription[], withHeader = true) {
  const result: (string | number)[][] = [];

  if (withHeader) {
    result.push(['ID', 'Title', 'Sell/Buy Price', 'Server']);
  }

  items.forEach(item => {
    const enchStr =
      item.minEnchantmentLevel > 0 ? `(+${item.minEnchantmentLevel}) ` : '';

    const sellBuyPrice = [
      item.priceLimit
        ? item.priceLimit === MAX_ITEM_PRICE
          ? 'MAX'
          : item.priceLimit.toLocaleString()
        : '-'
    ];
    if (item.buyPriceLimit)
      sellBuyPrice.push(item.buyPriceLimit.toLocaleString());

    const values = [
      item.parseItem.parseId,
      enchStr + item.parseItem.title,
      sellBuyPrice.join(' / '),
      serverNameFromId(item.serverId)
    ];
    result.push(values);
  });

  return `\`${table(result)}\``;
}

function handleListCommandFactory(command: string) {
  const bot = new Composer();

  bot.command(command, async ctx => {
    const { user } = await parseMessageData(ctx);

    if (!isValidSubscription(ctx, user)) return;

    const itemSubscriptions = await ParseItemSubscription.find({
      tgUser: user
    }).populate('parseItem');

    chunk(itemSubscriptions, 15).forEach((group, i) => {
      ctx.reply(renderResult(group, i === 0 ? true : false), {
        parse_mode: 'Markdown'
      });
    });
  });

  return bot;
}

export default handleListCommandFactory;
