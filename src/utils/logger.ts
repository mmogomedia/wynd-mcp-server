import { config } from '../config/index.js';
import winston from 'winston';
import { format } from 'winston';

const { combine, timestamp, printf, colorize, json } = format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  // Don't show timestamp in test environment for cleaner test output
  const ts = config.isTest ? '' : `${timestamp} `;
  
  // Handle error objects
  if (message instanceof Error) {
    return `${ts}${level}: ${message.message}\n${message.stack}`;
  }
  
  // Handle meta objects
  const metaString = Object.keys(meta).length > 0 
    ? `\n${JSON.stringify(meta, null, 2)}` 
    : '';
    
  return `${ts}${level}: ${message}${metaString}`;
});

// Create the logger instance
const logger = winston.createLogger({
  level: config.server.logLevel,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'wynd' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        consoleFormat
      ),
      silent: config.isTest, // Disable logging during tests
    }),
  ],
});

// Add file transport in production
if (config.isProd) {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error',
    format: combine(
      timestamp(),
      json()
    )
  }));
  
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log',
    format: combine(
      timestamp(),
      json()
    )
  }));
}

// Create a stream for morgan (HTTP request logging)
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
