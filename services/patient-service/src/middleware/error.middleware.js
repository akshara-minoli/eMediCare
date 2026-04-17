const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

const errorHandler = (err, req, res, next) => {
  // Delegate to Express default handler if response already started.
  if (res.headersSent) {
    return next(err);
  }

  // Handle duplicate key errors from Mongo unique indexes.
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // Flatten mongoose validation messages for client-friendly output.
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details,
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
