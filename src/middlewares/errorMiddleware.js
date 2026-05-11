export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  // Log the error for server-side debugging (Hostinger stderr.log)
  console.error(`[ERROR] ${req.method} ${req.url} - ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Ensure we don't crash if res.status or res.json fails
  try {
    res.status(statusCode).json({
      message: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    });
  } catch (sendError) {
    console.error('CRITICAL: Failed to send error response:', sendError);
    // Fallback to a simple text response if JSON fails
    if (!res.headersSent) {
      res.status(500).send('A critical error occurred.');
    }
  }
};
