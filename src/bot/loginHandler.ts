import { Composer } from 'grammy';
import { parseMessage } from './utils';

function handleLoginCommandFactory(command: string) {
  const bot = new Composer();

  bot.command(command, ctx => {
    const [authKey] = parseMessage(command, ctx.message?.text);

    if (authKey) {
      ctx.reply(`ok ${authKey}`);
    } else {
      ctx.reply(`
Invalid format:
/${command} <key>
`);
    }
  });

  return bot;
}

export default handleLoginCommandFactory;
