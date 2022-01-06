import { createLogger, format, transports } from 'winston';
import { BufferedMetricsLogger } from 'datadog-metrics';
import { DATADOG_API_KEY } from '../config';

const formatLogMessage = format.printf(
  ({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`
);

const textLogger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), formatLogMessage),
  transports: [new transports.Console()]
});

const metricsLogger = DATADOG_API_KEY
  ? new BufferedMetricsLogger({
      apiHost: 'datadoghq.eu',
      apiKey: DATADOG_API_KEY,
      flushIntervalSeconds: 15
    })
  : null;

const logMetricFn =
  <TMetricType extends keyof BufferedMetricsLogger>(metricType: TMetricType) =>
  (...args: Parameters<BufferedMetricsLogger[TMetricType]>) => {
    if (metricsLogger) {
      // @ts-expect-error
      metricsLogger[metricType](...args);
    } else {
      textLogger.info(args.join(' - '));
    }
  };

const executeMetric = (fn: Function | undefined, args: any) => {
  if (fn) {
    fn.apply(metricsLogger, args);
  } else {
    textLogger.info(args.join(' - '));
  }
};

export default {
  info: textLogger.info.bind(textLogger),
  error: textLogger.error.bind(textLogger),
  metric: {
    gauge: logMetricFn('gauge'),
    increment: logMetricFn('increment'),
    histogram: logMetricFn('histogram'),
    flush: logMetricFn('flush')
  }
};
