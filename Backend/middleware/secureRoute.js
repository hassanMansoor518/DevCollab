const jwt = require("jsonwebtoken");
const userModel = require("../model/user.model");

async function secureRoute(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "No token Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = secureRoute; // ✅ IMPORTANT
