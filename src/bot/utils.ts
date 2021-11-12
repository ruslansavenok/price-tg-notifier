import qs from 'qs';
import { Context } from 'grammy';
import type { User } from '@grammyjs/types';
import { DATASOURCE_HOSTNAME } from '../../config';
import TgBotUser, { ITgBotUser } from '../db/models/TgBotUser';

export function parseMessage(match: string = ''): string[] {
  return match.toLocaleLowerCase().split(' ');
}

export async function parseMessageData(ctx: Context):
  | Promise<{
      user: ITgBotUser;
      args: string[];
    }>
  | never {
  if (!ctx.message?.from) throw new Error('Invalid ctx');

  const user = await findAnSyncTgBotUser(ctx.message.from);
  const args = parseMessage(ctx.match as string);

  return {
    user,
    args
  };
}

export async function findAnSyncTgBotUser(data: User) {
  const userId = data.id.toString();

  return await TgBotUser.findOneAndUpdate(
    { tgUserId: userId },
    {
      tgUserId: userId,
      tgUsername: data.username,
      tgName: `${data.first_name} ${data.last_name}`
    },
    {
      new: true,
      upsert: true
    }
  );
}

export function parseItemId(value: string): number {
  if (typeof value === 'string' && value.includes(DATASOURCE_HOSTNAME)) {
    const { id } = qs.parse(value);
    if (typeof id === 'string') {
      return parseInt(id, 10);
    } else {
      return NaN;
    }
  } else {
    return parseInt(value, 10);
  }
}
