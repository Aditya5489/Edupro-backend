const express = require("express");
const {
  generateChallenge,
  validateSolution,
  correctUserCode,
} = require("../controller/game.controller");
const authMiddleware=require("../middlewares/auth.middleware");

const gameRouter = express.Router();

gameRouter.post("/challenge",authMiddleware, generateChallenge);   
gameRouter.post("/validate", authMiddleware,validateSolution);     
gameRouter.post("/correct",authMiddleware, correctUserCode);      

module.exports = gameRouter;
