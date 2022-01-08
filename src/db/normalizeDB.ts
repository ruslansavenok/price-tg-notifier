import TgBotUser from '../db/models/TgBotUser';
import TgBotAccessKey from '../db/models/TgBotAccessKey';
import ParseItemSubscription from './models/ParseItemSubscription';
import ParseItemListing, { LISTING_TYPE } from './models/ParseItemListing';
import logger from '../logger';

const createLogger = (fnName: string) => (str: string) =>
  logger.info(`[${fnName}] ${str}`);

// NOTE:
// Fixes DB artifacts on startup (caused by old code)
// TODO: replace with mongo-migrate
async function normalizeDB() {
  await dec20_2021_fix_access_key_assignments();
}

// Legacy logins which didn't update accessKey assignments
async function dec20_2021_fix_access_key_assignments() {
  const log = createLogger('dec20_2021_fix_access_key_assignments');

  const usersWithKey = await TgBotUser.find({
    accessCode: { $exists: true }
  }).populate('accessCode');

  log(`Checking ${usersWithKey.length} users...`);

  for (const user of usersWithKey) {
    const key = await TgBotAccessKey.findOne({
      value: user.accessCode.value
    });
    if (key && !key.assignedToUser) {
      key.assignedToUser = user;
      await key.save();
      log(`Modified key=${key._id}`);
    }
  }
}

export default normalizeDB;
