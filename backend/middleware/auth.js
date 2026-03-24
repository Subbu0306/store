const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = (allowedRoles = []) => {   // ← Default empty array
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization header missing or invalid" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User no longer exists" });
      }

      // Role check - allow if no roles specified OR if user's role is in allowed list
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: "Permission denied: Insufficient role" 
        });
      }

      req.user = user;
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired, please login again" });
      }
      console.error("Auth error:", err.message);
      return res.status(401).json({ message: "Authentication failed" });
    }
  };
};

module.exports = authMiddleware;
