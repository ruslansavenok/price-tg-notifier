import { Schema, model } from 'mongoose';

export interface IDataSourceConfig {
  sessionCookie: string;
}

const DataSourceConfigSchema = new Schema<IDataSourceConfig>({
  sessionCookie: {
    type: String,
    required: true
  }
});

export default model('data_source_config', DataSourceConfigSchema);
