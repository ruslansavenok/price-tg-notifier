import { Schema, model } from 'mongoose';
import { ITgBotAccessKey } from './TgBotAccessKey';

export interface ITgBotUser {
  _id: Schema.Types.ObjectId;
  tgUserId: string;
  tgUsername: string;
  tgName: string;
  isAdmin: boolean;
  accessCode: ITgBotAccessKey;
}

const TgBotUserSchema = new Schema<ITgBotUser>({
  tgUserId: {
    type: String,
    index: true,
    required: true
  },
  tgUsername: {
    type: String,
    index: true,
    required: true
  },
  tgName: {
    type: String,
    index: true,
    required: true
  },
  isAdmin: {
    type: Boolean,
    index: true
  },
  accessCode: {
    type: Schema.Types.ObjectId,
    ref: 'tg_bot_access_key',
    unique: true,
    sparse: true
  }
});

export default model<ITgBotUser>('tg_bot_user', TgBotUserSchema);
