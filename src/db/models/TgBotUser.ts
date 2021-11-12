import { Schema, model } from 'mongoose';

export interface ITgBotUser {
  tgUserId: string;
  tgUsername: string;
  tgName: string;
  isAdmin: boolean;
  accessCode: Schema.Types.ObjectId;
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
    ref: 'TgBotAccessCode',
    unique: true,
    sparse: true
  }
});

export default model('tg_bot_user', TgBotUserSchema);
