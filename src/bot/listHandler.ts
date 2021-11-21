import { Composer } from 'grammy';
import { table } from 'table';
import ParseItemSubscription, {
  IParseItemSubscription
} from '../db/models/ParseItemSubscription';
import { parseMessageData, isValidSubscription } from './utils';

function renderResult(items: IParseItemSubscription[]) {
  const result: any[] = [['Title', 'Price', 'Servers']];

  items.forEach(item => {
    const values = [
      item.parseItem.title,
      item.priceLimit.toLocaleString(),
      item.servers.join(', ')
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
