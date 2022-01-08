import { Document } from 'mongoose';
import formatDate from 'date-fns/format';
import ParseItemSubscription, {
  IParseItemSubscription
} from '../db/models/ParseItemSubscription';
import ParseItemListing, {
  IParseItemlisting,
  LISTING_TYPE
} from '../db/models/ParseItemListing';
import { serverNameFromId } from '../bot/utils';
import bot from '../bot';
import parseItemPage, { itemUrl } from './parseItemPage';

export const newListingMessage = (
  task: Document<any, any, IParseItemSubscription> & IParseItemSubscription,
  listing: Document<any, any, IParseItemlisting> & IParseItemlisting
) => `🚨🚨 ${listing.type === LISTING_TYPE.SELL ? 'SELL' : 'BUY'}
*Title:* ${task.parseItem.title}
*Price:* ${listing.price.toLocaleString()}
*Player*: ${listing.playerName}
*Amount:* ${listing.amount ? listing.amount.toLocaleString() : '-'}
*Added At:* ${formatDate(listing.registeredAt, 'MM/dd/yyyy - HH:mm')}
*ENH:* ${listing.enchantmentLvl ? `+${listing.enchantmentLvl}` : '-'}
*ID:* ${listing.listingId}
*SERVER:* ${serverNameFromId(task.serverId)}
[OPEN L2ON](${itemUrl({
  itemId: task.parseItem.parseId,
  serverId: task.serverId
})})
`;

export async function markTaskParsed(
  task: Document<any, any, IParseItemSubscription> & IParseItemSubscription
) {
  task.currentWorkerId = null;
  task.lastParsedAt = new Date();
  await task.save();
}

export async function processTask(
  task: Document<any, any, IParseItemSubscription> & IParseItemSubscription
) {
  const { sellListings, buyListings } = await parseItemPage(
    task.parseItem.parseId,
    task.serverId
  );
  const parsedListings = [
    ...sellListings.map(listing => ({ ...listing, type: LISTING_TYPE.SELL })),
    ...buyListings.map(listing => ({ ...listing, type: LISTING_TYPE.BUY }))
  ];
  const existingListings = await ParseItemListing.find({
    listingId: {
      $in: parsedListings.map(listing => listing.id)
    }
  });

  if (parsedListings.length === existingListings.length) return;

  const allSubscriptionsForGivenServer = await ParseItemSubscription.find({
    parseItem: task.parseItem,
    serverId: task.serverId
  }).populate(['parseItem', 'tgUser']);

  const existingListingsById = existingListings.reduce<
    Record<string, Document<any, any, IParseItemlisting> & IParseItemlisting>
  >((acc, listing) => {
    acc[listing.listingId] = listing;
    return acc;
  }, {});

  for (const listing of parsedListings) {
    if (existingListingsById[listing.id]) continue;

    const newRecord = await ParseItemListing.create({
      parsedItem: task.parseItem._id,
      serverId: task.serverId,
      type: listing.type,
      listingId: listing.id,
      playerName: listing.playerName,
      registeredAt: listing.registeredAt,
      price: listing.price,
      enchantmentLvl: listing.enchantmentLvl
    });

    for (const subscription of allSubscriptionsForGivenServer) {
      if (listing.registeredAt < subscription.createdAt) continue;

      const isValidEnchantmentLevel =
        typeof listing.enchantmentLvl === 'number' &&
        typeof subscription.minEnchantmentLevel === 'number'
          ? listing.enchantmentLvl >= subscription.minEnchantmentLevel
          : true;
      const isValidSell =
        typeof subscription.priceLimit === 'number' &&
        listing.type === LISTING_TYPE.SELL &&
        listing.price <= subscription.priceLimit;
      const isValidBuy =
        typeof subscription.buyPriceLimit === 'number' &&
        listing.type === LISTING_TYPE.BUY &&
        listing.price >= subscription.buyPriceLimit;

      if (isValidEnchantmentLevel && (isValidSell || isValidBuy)) {
        bot.api.sendMessage(
          subscription.tgUser.tgUserId,
          newListingMessage(subscription, newRecord),
          {
            parse_mode: 'Markdown'
          }
        );
      }
    }
  }

  await ParseItemSubscription.updateMany(
    {
      parseItem: task.parseItem,
      serverId: task.serverId
    },
    {
      lastParsedAt: new Date()
    }
  );
}
