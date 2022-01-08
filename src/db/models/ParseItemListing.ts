import { Schema, model } from 'mongoose';

export enum LISTING_TYPE {
  BUY = 'buy',
  SELL = 'sell'
}

export interface IParseItemlisting {
  parseItem: Schema.Types.ObjectId;
  listingId: string;
  type: LISTING_TYPE;
  serverId: number;
  playerName: string;
  registeredAt: Date;
  price: number;
  amount?: number;
  enchantmentLvl?: number;
}

const ParseItemListingSchema = new Schema<IParseItemlisting>({
  parseItem: {
    type: Schema.Types.ObjectId,
    ref: 'parse_item'
  },
  listingId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(LISTING_TYPE),
    required: true,
    index: true
  },
  serverId: {
    type: Number,
    required: true,
    index: true
  },
  playerName: {
    type: String,
    required: true,
    index: true
  },
  registeredAt: {
    type: Date,
    required: true,
    index: true
  },
  price: {
    type: Number,
    required: true
  },
  amount: {
    type: Number
  },
  enchantmentLvl: {
    type: Number
  }
});

export default model<IParseItemlisting>(
  'parse_item_listing',
  ParseItemListingSchema
);
