import round from 'lodash/round';
import { DATASOURCE_HOSTNAME, SERVERS, MAX_ITEM_PRICE } from '../config';
import { IParseItemSubscription } from './db/models/ParseItemSubscription';

const TRILLION = Math.pow(10, 12);
const BILLION = Math.pow(10, 9);
const MILLION = Math.pow(10, 6);

export function serverNameFromId(id: number): string {
  for (const [serverKey, serverId] of Object.entries(SERVERS)) {
    if (serverId === id)
      return serverKey.charAt(0) + serverKey.toLowerCase().slice(1);
  }
  return 'unknown';
}

export function formatPrice(value: number): string {
  if (value >= TRILLION) return round(value / TRILLION) + 'kkkk';
  if (value >= BILLION) return round(value / BILLION) + 'kkk';
  if (value >= MILLION) return round(value / MILLION) + 'kk';
  return value.toLocaleString();
}

export function parsePrice(value: string): number {
  const kRegex = /к|k/g;
  const kMatch = value.match(kRegex);

  if (kMatch) {
    const valueWithoutK = parseFloat(
      parseFloat(value.replace(kRegex, '')).toFixed(kMatch.length)
    );
    return valueWithoutK * Math.pow(1000, kMatch.length);
  } else {
    return parseInt(value, 10);
  }
}

export const parseItemUrl = ({
  itemId,
  serverId
}: {
  itemId: number;
  serverId: number;
}) =>
  `http://${DATASOURCE_HOSTNAME}/?c=market&a=item&id=${itemId}&setworld=${serverId}`;

export function getSubscriptionCommand(item: IParseItemSubscription) {
  const command = [
    `/sub ${item.parseItem.parseId}`,
    `-s ${serverNameFromId(item.serverId).toLowerCase()}`
  ];
  if (item.minEnchantmentLevel) command.push(`-e ${item.minEnchantmentLevel}`);
  if (item.priceLimit && item.priceLimit !== MAX_ITEM_PRICE)
    command.push(`-p ${formatPrice(item.priceLimit)}`);
  if (item.buyPriceLimit)
    command.push(`-bp ${formatPrice(item.buyPriceLimit)}`);
  return command.join(' ');
}

export function getUnsubscribeCommand(item: IParseItemSubscription) {
  return `/unsub ${item.parseItem.parseId} -s ${serverNameFromId(
    item.serverId
  ).toLowerCase()}`;
}
