const User = require('../models/user.model');
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  // Get token from cookie or Authorization header
  const token =
    req.cookies?.token ||
    (req.headers.authorization ? req.headers.authorization.split(" ")[1] : null);

  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: "Unauthorized: User not found" });

    req.user = { id: user._id, name: user.firstName, username: user.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authMiddleware;
