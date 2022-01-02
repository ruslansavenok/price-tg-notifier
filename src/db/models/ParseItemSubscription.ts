import { Schema, model } from 'mongoose';
import { ITgBotUser } from './TgBotUser';
import { IParseItem } from './ParseItem';

export interface IParseItemSubscription {
  tgUser: ITgBotUser;
  parseItem: IParseItem;
  serverId: number;
  priceLimit: number;
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
    required: true,
    index: true
  },
  priceLimit: {
    type: Number,
    required: true
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
