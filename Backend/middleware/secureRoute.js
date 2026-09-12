const jwt = require("jsonwebtoken");
const User = require("../model/user.model");

const JWT_SECRET = process.env.JWT_SECRET || "e972d971df9c5e979d26b7767950a8b5";

const secureRoute = async (req, res, next) => {
  try {
    // Accept cookie named `token` (used by auth controller) or Authorization header
    const headerToken = req.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
    const token = req.cookies?.token || headerToken;

    if (!token) {
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid Token" });
    }

    const userId = decoded.id || decoded.userId || decoded._id;
    const user = await User.findById(userId).select("-password"); // current loggedin user
    if (!user) {
      return res.status(401).json({ error: "No user found" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.log("Error in secureRoute: ", error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};
module.exports = secureRoute;