import { Document } from 'mongoose';
import dateSub from 'date-fns/sub';
import formatDate from 'date-fns/format';
import { IParseItemSubscription } from '../db/models/ParseItemSubscription';
import ParseItemListing, {
  IParseItemlisting,
  LISTING_TYPE
} from '../db/models/ParseItemListing';
import { serverNameFromId } from '../bot/utils';
import { itemUrl, IItemListing } from './parseItemPage';

export const newListingMessage = (
  task: Document<any, any, IParseItemSubscription> & IParseItemSubscription,
  listing: Document<any, any, IParseItemlisting> & IParseItemlisting
) => `🚨🚨
*Title:* ${task.parseItem.title}
*Price:* ${listing.price.toLocaleString()}
*${listing.type === LISTING_TYPE.SELL ? 'SELLER' : 'BUYER'}:* ${
  listing.playerName
}
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

interface ListingProcessingResult {
  isNew: boolean;
  listing: Document<any, any, IParseItemlisting> & IParseItemlisting;
}

export async function processListing(
  task: Document<any, any, IParseItemSubscription> & IParseItemSubscription,
  listingType: LISTING_TYPE,
  listing: IItemListing
): Promise<ListingProcessingResult> {
  const aDayAgo = dateSub(new Date(), { days: 1 });

  const { ok, value, lastErrorObject } =
    await ParseItemListing.findOneAndUpdate(
      {
        listingId: listing.id
      },
      {
        type: listingType,
        parseItem: task.parseItem._id,
        listingId: listing.id,
        serverId: task.serverId,
        playerName: listing.playerName,
        registeredAt: listing.registeredAt,
        price: listing.price,
        amount: listing.amount,
        enchantmentLvl: listing.enchantmentLvl
      },
      {
        new: true,
        upsert: true,
        rawResult: true
      }
    );

  if (ok === 0 || !value || !lastErrorObject) {
    throw { value, lastErrorObject };
  } else if (
    listing.registeredAt > aDayAgo &&
    lastErrorObject.updatedExisting === false
  ) {
    return { listing: value, isNew: true };
  } else {
    return { listing: value, isNew: false };
  }
}
