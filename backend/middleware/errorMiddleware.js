
const notFound = (req, res, next) => {
  const error = new Error(
    `Route not found: ${req.originalUrl}`
  );

  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode =
    res.statusCode && res.statusCode !== 200
      ? res.statusCode
      : 500;

  let message = err.message || "Internal Server Error";

  // MongoDB Invalid ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID.";
  }

  // MongoDB Duplicate Field
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field
      ? `${field} already exists.`
      : "Duplicate record already exists.";
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  // Invalid JSON
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Invalid JSON request body.";
  }

  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "Internal Server Error";
  }

  console.error("API Error:", err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
    }),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
