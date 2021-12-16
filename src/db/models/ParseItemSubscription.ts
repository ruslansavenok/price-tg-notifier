import { Schema, model } from 'mongoose';
import { ITgBotUser } from './TgBotUser';
import { IParseItem } from './ParseItem';

export interface IParseItemSubscription {
  tgUser: ITgBotUser;
  parseItem: IParseItem;
  serverId: number;
  priceLimit: number;
  lastParsedAt: Date;
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
  lastParsedAt: {
    type: Date,
    index: true
  }
});

export default model('parse_item_subscription', ParseItemSubscriptionSchema);
