import { Composer } from 'grammy';
import { SERVERS } from '../../config';
import { parseMessage, parseItemId } from './utils';

function handleUnsubsribeCommandFactory(command: string) {
  const bot = new Composer();

  bot.command(command, ctx => {
    const [itemUrlOrId, serverName] = parseMessage(command, ctx.message?.text);
    const itemId = parseItemId(itemUrlOrId);
    let serverIds = null;

    if (serverName) {
      const serverId = SERVERS[serverName.toUpperCase()];
      if (serverId) serverIds = [serverId];
    } else {
      serverIds = Object.values(SERVERS);
    }

    if (isNaN(itemId) || !serverIds) {
      ctx.reply(`
Invalid format:
/${command} <itemUrlOrId> <serverName>
/${command} <itemUrlOrId>
`);
    } else {
      ctx.reply(`
itemId: ${itemId}
server: ${serverIds.join(',')}
`);
    }
  });

  return bot;
}

export default handleUnsubsribeCommandFactory;
