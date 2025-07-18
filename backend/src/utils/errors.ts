export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public context?: any;

  constructor(message: string, statusCode: number, context?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleAsyncError = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const globalErrorHandler = (err: any, req: any, res: any, next: any) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'production') {
    // Log error for monitoring
    console.error('Production Error:', {
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // Send sanitized error to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: 'error',
        message: err.message,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong',
      });
    }
  } else {
    // Development - send full error
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      stack: err.stack,
      context: err.context,
    });
  }
};
