import { Schema, model } from 'mongoose';

interface TgBotAccessKey {
  key: string;
  expireAt: Date;
  maxSubscribtions: number;
  assignedToUser: Schema.Types.ObjectId;
}

const TgBotAccessKeySchema = new Schema<TgBotAccessKey>({
  key: {
    type: 'String',
    unique: true,
    index: true,
    required: true
  },
  expireAt: {
    type: Date,
    required: true
  },
  maxSubscribtions: {
    type: Number,
    required: true
  },
  assignedToUser: {
    type: Schema.Types.ObjectId,
    ref: 'TgBotUser'
  }
});

export default model('tg_bot_access_key', TgBotAccessKeySchema);
