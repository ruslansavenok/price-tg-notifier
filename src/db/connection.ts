import { connect } from 'mongoose';

export async function setupConnection(url: string) {
  try {
    await connect(url);
  } catch (e) {
    console.error('Connection to DB failed', e);
    process.exit(1);
  }
}
