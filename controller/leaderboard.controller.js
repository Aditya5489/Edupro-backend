const User = require("../models/user.model");

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({}, "firstName lastName username xpPoints levelBadge profileImage")
      .sort({ xpPoints: -1 }) 
      .limit(10);

    res.status(200).json(leaderboard);
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

module.exports = { getLeaderboard };