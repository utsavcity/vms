// Global error handler — all unhandled errors funnel here
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // Supabase / PostgREST errors
  if (err.code && err.details) {
    return res.status(400).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  res.status(status).json({ success: false, error: { code, message } });
}

module.exports = errorHandler;
