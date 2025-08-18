import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about the colors
winston.addColors(colors);

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  ),
);

// Define console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  ),
);

// Define which transports to use
const transports = [];

// Always log to files
transports.push(
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format,
  }),
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    format,
  })
);

// Log to console in development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
        consoleFormat
      ),
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports,
  // Don't exit on uncaught errors
  exitOnError: false,
});

// Create specialized loggers for different components
export const createComponentLogger = (component: string) => {
  return {
    error: (message: string, meta?: any) => 
      logger.error(`[${component}] ${message}`, meta),
    warn: (message: string, meta?: any) => 
      logger.warn(`[${component}] ${message}`, meta),
    info: (message: string, meta?: any) => 
      logger.info(`[${component}] ${message}`, meta),
    http: (message: string, meta?: any) => 
      logger.http(`[${component}] ${message}`, meta),
    debug: (message: string, meta?: any) => 
      logger.debug(`[${component}] ${message}`, meta),
  };
};

// HTTP request logger middleware
export const httpLogger = winston.createLogger({
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      filename: path.join('logs', 'http.log'),
    }),
  ],
});

// Middleware for logging HTTP requests
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    httpLogger.http({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.session?.userId,
    });
  });
  
  next();
};

// Error logger for unhandled errors
export const logError = (error: Error, req?: any) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...(req && {
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        ip: req.ip,
        userId: req.session?.userId,
      },
    }),
  };
  
  logger.error('Unhandled error:', errorInfo);
};

// Performance logger
export const performanceLogger = createComponentLogger('PERFORMANCE');

// Security logger
export const securityLogger = createComponentLogger('SECURITY');

// Business logic logger
export const businessLogger = createComponentLogger('BUSINESS');

// Database logger
export const dbLogger = createComponentLogger('DATABASE');

// AI Service logger
export const aiLogger = createComponentLogger('AI_SERVICE');

export default logger;