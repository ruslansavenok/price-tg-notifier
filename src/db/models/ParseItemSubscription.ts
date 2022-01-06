import { Schema, model } from 'mongoose';
import { ITgBotUser } from './TgBotUser';
import { IParseItem } from './ParseItem';

export interface IParseItemSubscription {
  tgUser: ITgBotUser;
  parseItem: IParseItem;
  serverId: number;
  priceLimit: number | null;
  buyPriceLimit: number | null;
  minEnchantmentLevel: number;
  lastParsedAt: Date;
  currentWorkerId: number | null;
  createdAt: Date;
}

const ParseItemSubscriptionSchema = new Schema<IParseItemSubscription>({
  tgUser: {
    type: Schema.Types.ObjectId,
    ref: 'tg_bot_user',
    required: true,
    index: true
  },
  parseItem: {
    type: Schema.Types.ObjectId,
    ref: 'parse_item',
    required: true,
    index: true
  },
  serverId: {
    type: Number,
    index: true
  },
  priceLimit: {
    type: Number,
    required: function (this: IParseItemSubscription) {
      return [null, undefined].includes(this.buyPriceLimit as any)
        ? true
        : false;
    }
  },
  buyPriceLimit: {
    type: Number,
    required: function (this: IParseItemSubscription) {
      return [null, undefined].includes(this.priceLimit as any) ? true : false;
    }
  },
  minEnchantmentLevel: {
    type: Number
  },
  lastParsedAt: {
    type: Date,
    index: true
  },
  currentWorkerId: {
    type: Number
  },
  createdAt: {
    type: Date,
    index: true
  }
});

export default model<IParseItemSubscription>(
  'parse_item_subscription',
  ParseItemSubscriptionSchema
);
