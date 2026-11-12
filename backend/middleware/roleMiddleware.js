
const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Please login first.",
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this resource.",
        });
      }

      next();
    } catch (error) {
      console.error("Role Middleware Error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Authorization failed.",
      });
    }
  };
};

module.exports = allowRoles;
