import { Schema, model } from 'mongoose';
import { ITgBotUser } from './TgBotUser';

export interface ITgBotAccessKey {
  _id: Schema.Types.ObjectId;
  value: string;
  durationInDays: number;
  expireAt: Date;
  maxCheckItems: number;
  assignedToUser: ITgBotUser;
}

const TgBotAccessKeySchema = new Schema<ITgBotAccessKey>({
  value: {
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
    ref: 'tg_bot_user'
  }
});

export default model<ITgBotAccessKey>(
  'tg_bot_access_key',
  TgBotAccessKeySchema
);
