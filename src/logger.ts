import { createLogger, format, transports } from 'winston';

const formatLogMessage = format.printf(
  ({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`
);

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), formatLogMessage),
  transports: [new transports.Console()]
});

export default logger;
