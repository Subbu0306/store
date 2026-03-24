const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      // Check for Bearer token format
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization header missing or invalid" });
      }

      const token = authHeader.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Security: Check database to ensure user wasn't deleted or banned
      const user = await User.findById(decoded.id).select("-password"); // Don't fetch the password hash
      
      if (!user) {
        return res.status(401).json({ message: "User no longer exists" });
      }

      // RBAC: Role check
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Permission denied: Insufficient role" });
      }

      req.user = user;
      next();
    } catch (err) {
      // Specific error for expired tokens
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired, please login again" });
      }
      return res.status(401).json({ message: "Authentication failed" });
    }
  };
};
