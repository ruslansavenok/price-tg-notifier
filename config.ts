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

export const TELEGRAM_BOT_TOKEN = getEnvVariable('TELEGRAM_BOT_TOKEN');

export const SERVERS = {
  AIRIN: 45,
  ELCARDIA: 27,
  HATOS: 12
};
