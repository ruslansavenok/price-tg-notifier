import qs from 'qs';
import { DATASOURCE_HOSTNAME, SERVERS } from '../../config';

export function parseMessage(command: string, message: string = ''): string[] {
  const regex = new RegExp(`\/${command}\s*`);
  return message.replace(regex, '').toLowerCase().split(' ');
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
