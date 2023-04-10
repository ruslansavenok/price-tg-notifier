import TgBotUser from '../db/models/TgBotUser';
import TgBotAccessKey from '../db/models/TgBotAccessKey';
import ParseItem from './models/ParseItem';
import logger from '../logger';
import parseItemPage from '../parser/parseItemPage';
import { parseItemUrl } from '../format';
import { SERVERS } from '../../config';

const createLogger = (fnName: string) => (str: string) =>
  logger.info(`[${fnName}] ${str}`);

// NOTE:
// Fixes DB artifacts on startup (caused by old code)
// TODO: replace with mongo-migrate
async function normalizeDB() {
  await dec20_2021_fix_access_key_assignments();
  await apr10_2023_update_parse_item_images();
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

async function apr10_2023_update_parse_item_images() {
  const log = createLogger('apr10_2023_update_parse_item_images');

  const items = await ParseItem.find({ imagePath: { $exists: false } });
  log(`Found ${items.length} items...`);

  for (const item of items) {
    log(`Processing item=${item.parseId}`);
    const { imagePath } = await parseItemPage(item.parseId, SERVERS.AIRIN);
    log(`Image found path=${imagePath}`);
    item.imagePath = imagePath;
    await item.save();
    log(`Processing done`);
  }
}

export default normalizeDB;
