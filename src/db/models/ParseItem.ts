import { Schema, model } from 'mongoose';

export interface IParseItem {
  parseId: number;
  title: string;
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
  }
});

export default model('parse_item', ParseItemSchema);
