const mongoose = require("mongoose");

const SkillSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  skillName: {
    type: String,
    required: true,
  },
  proficiency: {
    type: String, 
    default: "Beginner",
  }
}, { timestamps: true });

const Skill = mongoose.model("Skill", SkillSchema);

module.exports =Skill;
