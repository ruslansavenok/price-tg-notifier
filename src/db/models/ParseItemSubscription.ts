import { Schema, model } from 'mongoose';
import { ITgBotUser } from './TgBotUser';
import { IParseItem } from './ParseItem';

export interface IParseItemSubscription {
  tgUser: ITgBotUser;
  parseItem: IParseItem;
  servers: number[];
  priceLimit: number;
}

const ParseItemSubscriptionSchema = new Schema<IParseItemSubscription>({
  tgUser: {
    type: Schema.Types.ObjectId,
    ref: 'tg_bot_user',
    required: true
  },
  parseItem: {
    type: Schema.Types.ObjectId,
    ref: 'parse_item',
    required: true
  },
  servers: {
    type: [Number]
  },
  priceLimit: {
    type: Number,
    required: true
  }
});

export default model('parse_item_subscription', ParseItemSubscriptionSchema);
