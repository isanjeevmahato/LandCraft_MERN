
const User = require("../models/User");

const adminMiddleware = async (req, res, next) => {
  try {
    // Authentication middleware must run first.
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Check the role stored in MongoDB.
    const user = await User.findById(req.user.userId).select("role");

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin authorization error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify admin access.",
    });
  }
};

module.exports = adminMiddleware;
