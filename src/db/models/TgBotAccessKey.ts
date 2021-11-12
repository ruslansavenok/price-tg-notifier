import { Schema, model } from 'mongoose';

export interface ITgBotAccessKey {
  key: string;
  durationInDays: number;
  expireAt: Date;
  maxCheckItems: number;
  assignedToUser: Schema.Types.ObjectId;
}

const TgBotAccessKeySchema = new Schema<ITgBotAccessKey>({
  key: {
    type: String,
    unique: true,
    index: true,
    required: true
  },
  durationInDays: {
    type: Number,
    required: true
  },
  expireAt: {
    type: Date
  },
  maxCheckItems: {
    type: Number,
    required: true
  },
  assignedToUser: {
    type: Schema.Types.ObjectId,
    ref: 'TgBotUser'
  }
});

export default model('tg_bot_access_key', TgBotAccessKeySchema);
