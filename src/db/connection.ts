import { connect } from 'mongoose';
import normalizeDB from './normalizeDB';

export async function setupConnection(url: string) {
  try {
    await connect(url);
    await normalizeDB();
  } catch (e) {
    console.error('Connection to DB failed', e);
    process.exit(1);
  }
}
