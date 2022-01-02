import { Composer } from 'grammy';
import { table } from 'table';
import { MAX_ITEM_PRICE } from '../../config';
import ParseItemSubscription, {
  IParseItemSubscription
} from '../db/models/ParseItemSubscription';
import {
  parseMessageData,
  isValidSubscription,
  serverNameFromId
} from './utils';

function renderResult(items: IParseItemSubscription[]) {
  const result: (string | number)[][] = [
    ['ID', 'Title', 'Price', 'Buy Price', 'Server']
  ];

  items.forEach(item => {
    const enchStr =
      item.minEnchantmentLevel > 0 ? `(+${item.minEnchantmentLevel}) ` : '';

    const values = [
      item.parseItem.parseId,
      enchStr + item.parseItem.title,
      item.priceLimit === MAX_ITEM_PRICE
        ? 'MAX'
        : item.priceLimit
        ? item.priceLimit.toLocaleString()
        : '-',
      item.buyPriceLimit ? item.buyPriceLimit.toLocaleString() : '-',
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

    ctx.reply(renderResult(itemSubscriptions), { parse_mode: 'Markdown' });
  });

  return bot;
}

export default handleListCommandFactory;
