import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '@/config/config';

type TErrorProps = {
  statusCode?: number;
  message?: string;
  errors?: unknown[];
  stack?: string;
};

const errorHandlerMiddleware = (
  err: TErrorProps,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const environment = config.nodeEnv || 'development';

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong, try again later.',
    errors: err.errors || [],
    ...(environment === 'development' && { stack: err.stack })
  });
};

export default errorHandlerMiddleware;
