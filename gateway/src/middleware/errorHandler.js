import { errorResponse } from '../utils/apiResponse.js';

/**
 * Centralized Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  return errorResponse(res, err, statusCode);
}
