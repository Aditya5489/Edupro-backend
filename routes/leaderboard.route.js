const express = require("express");
const { getLeaderboard } = require("../controller/leaderboard.controller");

const leaderboardRouter = express.Router();

leaderboardRouter.get("/", getLeaderboard);

module.exports = leaderboardRouter;