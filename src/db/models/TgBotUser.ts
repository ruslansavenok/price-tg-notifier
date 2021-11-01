import { Schema, model } from 'mongoose';

interface TgBotUser {
  tgUserId: string;
  tgUsername: string;
  tgName: string;
  accessCode: Schema.Types.ObjectId;
}

const TgBotUserSchema = new Schema<TgBotUser>({
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
  accessCode: {
    type: Schema.Types.ObjectId,
    ref: 'TgBotAccessCode',
    unique: true
  }
});

export default model('tg_bot_user', TgBotUserSchema);
