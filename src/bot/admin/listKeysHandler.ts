import { Composer } from 'grammy';
import { table } from 'table';
import { parseMessageData } from '../utils';
import TgBotAccessKey, {
  ITgBotAccessKey
} from '../../db/models/TgBotAccessKey';

function renderResult(keys: ITgBotAccessKey[]) {
  const result: any[] = [['Key', 'Duration', 'Limit', 'User']];

  keys.forEach(item => {
    const values = [item.key, item.durationInDays, item.maxCheckItems, '-'];
    result.push(values);
  });

  return `\`${table(result)}\``;
}

function handleListKeysFactory(command: string) {
  const bot = new Composer();

  bot.command(command, async ctx => {
    const { user } = await parseMessageData(ctx);
    if (!user.isAdmin) return false;

    const keys = await TgBotAccessKey.find();
    ctx.reply(renderResult(keys), { parse_mode: 'Markdown' });
  });

  return bot;
}

export default handleListKeysFactory;
