import { Schema, model } from 'mongoose';

export interface IParseItemlisting {
  parseItem: Schema.Types.ObjectId;
  listingId: number;
  sellerName: string;
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
    type: Number,
    required: true,
    index: true
  },
  sellerName: {
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
    type: Number,
    required: true
  },
  enchantmentLvl: {
    type: Number
  }
});

export default model('parse_item_listing', ParseItemListingSchema);
