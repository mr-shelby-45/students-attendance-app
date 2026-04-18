const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  if (err.code === "P2002") {
    return res.status(409).json({ error: "A record with this value already exists." });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found." });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(403).json({ error: "Invalid token." });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(403).json({ error: "Token has expired. Please log in again." });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error.",
  });
};

module.exports = errorHandler;