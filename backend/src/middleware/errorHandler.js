// Global error handler — all unhandled errors funnel here
const isProd = process.env.NODE_ENV === 'production';

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // Errors we threw intentionally carry a status — safe to show their message
  const status = err.status || err.statusCode;
  if (status && status < 500) {
    return res.status(status).json({
      success: false,
      error: { code: err.code || 'BAD_REQUEST', message: err.message },
    });
  }

  // Everything else (DB errors, bugs): log full detail, return a generic
  // message in production so internals never leak to the client.
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProd ? 'Something went wrong. Please try again.' : (err.message || 'Unexpected error'),
    },
  });
}

module.exports = errorHandler;
