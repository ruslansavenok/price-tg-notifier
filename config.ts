import dotEnv from 'dotenv';

dotEnv.config();

function getEnvVariable(key: string, required: boolean = true) {
  const value = process.env[key];
  if (required && typeof value === 'undefined') {
    throw new Error(`Env variable "${key}" is required`);
  }
  return value;
}

export const TELEGRAM_BOT_TOKEN = getEnvVariable('TELEGRAM_BOT_TOKEN');

export const SERVERS = {
  AIRIN: 45,
  ELCARDIA: 27,
  HATOS: 12
};
