import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logError } from '../utils/logger';

// Custom error classes
export class AppError extends Error {
  public readonly isOperational: boolean;

  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    isOperational = true,
    stack = ''
  ) {
    super(message);
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly errors?: any) {
    super(400, message, true);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(401, message, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(403, message, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, message, true);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(503, `External service error: ${service}`, true);
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logError(err, req);

  // Handle known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
      }),
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle MongoDB/Database errors
  if (err.name === 'MongoError' || err.name === 'PostgresError') {
    if ((err as any).code === 11000 || (err as any).code === '23505') {
      // Duplicate key error
      return res.status(409).json({
        status: 'error',
        message: 'Duplicate entry found',
      });
    }
    
    // Generic database error
    return res.status(500).json({
      status: 'error',
      message: 'Database operation failed',
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired',
    });
  }

  // Handle multer file upload errors
  if (err.name === 'MulterError') {
    if ((err as any).code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        status: 'error',
        message: 'File too large',
      });
    }
    
    return res.status(400).json({
      status: 'error',
      message: 'File upload error',
    });
  }

  // Default to 500 server error
  const statusCode = (err as any).statusCode || 500;
  const message = statusCode === 500 
    ? 'An unexpected error occurred' 
    : err.message;

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  });
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
};

// Graceful error handling for uncaught exceptions
export const handleUncaughtExceptions = () => {
  process.on('uncaughtException', (error: Error) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logError(error);
    process.exit(1);
  });
};

// Graceful error handling for unhandled promise rejections
export const handleUnhandledRejections = () => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logError(new Error(`Unhandled Rejection: ${reason}`));
    process.exit(1);
  });
};

// Validation middleware factory
export const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Request timeout middleware
export const requestTimeout = (seconds: number = 30) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      next(new AppError(408, 'Request timeout'));
    }, seconds * 1000);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};