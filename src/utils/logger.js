/**
 * Winston Logger Configuration
 * Centralized logging for the entire system
 */

const winston = require('winston');
const config = require('../config/config');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create logger
const logger = winston.createLogger({
  level: config.server.logLevel,
  format: logFormat,
  defaultMeta: { service: 'ibovi-system' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: config.server.env === 'development' ? consoleFormat : logFormat,
    }),

    // Write all logs with level 'error' to error.log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Write all logs to combined.log
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Create specialized loggers for different components
const createComponentLogger = (component) => {
  return {
    info: (message, meta = {}) => logger.info(message, { component, ...meta }),
    error: (message, meta = {}) => logger.error(message, { component, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { component, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { component, ...meta }),
  };
};

module.exports = {
  logger,
  createComponentLogger,

  // Specialized loggers
  scraperLogger: createComponentLogger('scraper'),
  processorLogger: createComponentLogger('processor'),
  enrichmentLogger: createComponentLogger('enrichment'),
  verificationLogger: createComponentLogger('verification'),
  storageLogger: createComponentLogger('storage'),
  monitoringLogger: createComponentLogger('monitoring'),
};
