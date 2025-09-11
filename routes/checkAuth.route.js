const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const checkAuthRouter = express.Router();

// 🔹 Middleware to check auth from cookies
const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token; // 👈 get token from cookie
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // decoded contains user id & other payload
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

checkAuthRouter.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Return only needed fields
    res.json({
      id: user._id,
      username: user.username,
      name: user.firstName,
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


// 🔹 Route to get current user
checkAuthRouter.get("/current-user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

checkAuthRouter.get("/check", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("username firstName lastName email xpPoints badges");
    if (!user) {
      return res.status(404).json({ isLoggedIn: false, error: "User not found" });
    }
    res.json({ isLoggedIn: true, user });
  } catch (err) {
    res.status(500).json({ isLoggedIn: false, error: "Server error" });
  }
});

module.exports = checkAuthRouter;
