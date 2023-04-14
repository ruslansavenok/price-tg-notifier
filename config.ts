import dotEnv from 'dotenv';

dotEnv.config();

function getEnvVariable(key: string, required?: true): string;
function getEnvVariable(key: string, required: false): string | undefined;
function getEnvVariable(key: string, required = true) {
  const value = process.env[key];

  if (required && value === undefined) {
    throw new Error(`Env variable "${key}" is required`);
  }

  return value;
}

const envApiPort = getEnvVariable('UI_API_PORT', false);
const envDatasourceFetchTiemout = getEnvVariable(
  'DATASOURCE_FETCH_TIMEOUT',
  false
);

export const UI_API_PORT = envApiPort ? parseInt(envApiPort) : 3000;

export const MONGO_DB_URL = getEnvVariable('MONGO_DB_URL');
export const DATASOURCE_HOSTNAME = getEnvVariable('DATASOURCE_HOSTNAME');
export const DATASOURCE_FETCH_TIMEOUT = envDatasourceFetchTiemout
  ? parseInt(envDatasourceFetchTiemout, 10)
  : 3000;
export const TELEGRAM_BOT_TOKEN = getEnvVariable('TELEGRAM_BOT_TOKEN');

export const SENTRY_DSN = getEnvVariable('SENTRY_DSN', false);
export const DATADOG_API_KEY = getEnvVariable('DATADOG_API_KEY', false);

export const MAX_ITEM_PRICE = 99_000_000_000_000;

export const SERVERS: { [key: string]: number } = {
  AIRIN: 45,
  ELCARDIA: 27,
  HATOS: 12,
  NAGA: 15,
  SIRRA: 16
};
