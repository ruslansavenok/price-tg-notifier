import { Schema, model } from 'mongoose';

export interface IParseItem {
  _id: Schema.Types.ObjectId;
  parseId: number;
  title: string;
  imagePath: string;
}

const ParseItemSchema = new Schema<IParseItem>({
  parseId: {
    type: Number,
    index: true,
    required: true
  },
  title: {
    type: String,
    index: true,
    required: true
  },
  imagePath: {
    type: String,
    required: true
  }
});

export default model('parse_item', ParseItemSchema);
