/**
 * Standardized API Response Utilities
 */

export function successResponse(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(res, error = 'Internal Server Error', statusCode = 500) {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'An error occurred';
  return res.status(statusCode).json({
    success: false,
    error: errorMessage,
  });
}
