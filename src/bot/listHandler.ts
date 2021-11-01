import { Composer } from 'grammy';

function handleListCommandFactory(command: string) {
  const bot = new Composer();

  bot.command(command, ctx => {
    ctx.reply('list');
  });

  return bot;
}

export default handleListCommandFactory;
