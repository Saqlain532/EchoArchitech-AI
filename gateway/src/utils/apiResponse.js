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
  const responseStatusCode =
    typeof error === 'object' && error !== null
      ? error.statusCode || error.status || statusCode
      : statusCode;
  const errorMessage = typeof error === 'string' ? error : error?.message || 'An error occurred';
  const isExpectedError = responseStatusCode < 500 || error?.expose === true;

  if (!isExpectedError) {
    console.error('[API Error]:', error);
  }

  return res.status(responseStatusCode).json({
    success: false,
    error: isExpectedError ? errorMessage : 'Something went wrong. Please try again later.',
  });
}
