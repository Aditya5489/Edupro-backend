const express = require("express");
const { addSkill, getSkills, deleteSkill,addMultipleSkills} = require("../controller/skill.controller");
const authMiddleware = require("../middlewares/auth.middleware"); 

const skillRouter = express.Router();


skillRouter.post("/", authMiddleware, addSkill);
skillRouter.get("/", authMiddleware, getSkills);
skillRouter.delete("/:id", authMiddleware, deleteSkill);
skillRouter.post("/multiple", authMiddleware, addMultipleSkills);

module.exports = skillRouter;
