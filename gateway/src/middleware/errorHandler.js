import { errorResponse } from '../utils/apiResponse.js';

/**
 * Centralized Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  console.error(`💥 [Error]: ${err.stack || err.message}`);

  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  return errorResponse(res, err.message || 'Server Internal Error', statusCode);
}
