import * as Sentry from '@sentry/node';
import DataSourceConfig from './models/DataSourceConfig';
import logger from '../logger';

let runtimeCookie: string | undefined;

// NOTE:
// Force swap cookie in runtime if admin changes it in mongo
// (works because datasoruce doesn't not send set-cookie on every request)
setInterval(async () => {
  const configRecord = await DataSourceConfig.findOne({});
  if (
    configRecord &&
    configRecord.sessionCookie &&
    configRecord.sessionCookie !== runtimeCookie
  ) {
    runtimeCookie = configRecord.sessionCookie;
  }
}, 30 * 1000);

export async function getSessionCookie() {
  if (!runtimeCookie) {
    try {
      const configRecord = await DataSourceConfig.findOne({});
      if (configRecord) runtimeCookie = configRecord.sessionCookie;
    } catch (e) {
      logger.error(e);
      Sentry.captureException(e);
    }
  }
  return runtimeCookie;
}

export async function setSessionCookie(value: string) {
  if (value !== runtimeCookie) {
    try {
      logger.info(`Upadating runtimeCookie=${value}`);
      await DataSourceConfig.findOneAndUpdate({}, { sessionCookie: value });
    } catch (e) {
      logger.error(e);
      Sentry.captureException(e);
    }
  }
  runtimeCookie = value;
}
