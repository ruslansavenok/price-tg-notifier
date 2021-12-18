import { Composer } from 'grammy';
import { table } from 'table';
import ParseItemSubscription, {
  IParseItemSubscription
} from '../db/models/ParseItemSubscription';
import {
  parseMessageData,
  isValidSubscription,
  serverNameFromId
} from './utils';

function renderResult(items: IParseItemSubscription[]) {
  const result: (string | number)[][] = [['ID', 'Title', 'Price', 'Server']];

  items.forEach(item => {
    const values = [
      item.parseItem.parseId,
      item.parseItem.title,
      item.priceLimit.toLocaleString(),
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
