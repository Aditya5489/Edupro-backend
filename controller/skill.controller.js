
const Skill = require("../models/skill.model");

const addSkill = async (req, res) => {
  try {
    const { skillName, proficiency } = req.body;
    const userId = req.user.id; 

    if (!skillName) {
      return res.status(400).json({ success: false, message: "Skill name is required" });
    }

    const newSkill = new Skill({
      userId,
      skillName,
      proficiency: proficiency || "Beginner",
    });

    await newSkill.save();

    res.json({ success: true, message: "Skill added successfully", skill: newSkill });
  } catch (error) {
    console.error("Error adding skill:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const addMultipleSkills = async (req, res) => {
  try {
    const { skills } = req.body; 
    const userId = req.user.id;

    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ success: false, message: "Skills array is required" });
    }

    const toInsert = skills
      .filter(s => s.skillName && s.skillName.trim() !== "")
      .map(s => ({
        userId,
        skillName: s.skillName.trim(),
        proficiency: s.proficiency || "Beginner",
      }));

    const savedSkills = await Skill.insertMany(toInsert);

    res.json({
      success: true,
      message: `${savedSkills.length} skills added successfully`,
      skills: savedSkills,
    });
  } catch (error) {
    console.error("Error adding multiple skills:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const getSkills = async (req, res) => {
  try {
    const userId = req.user.id;
    const skills = await Skill.find({ userId });

    res.json({ success: true, skills });
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const skill = await Skill.findOneAndDelete({ _id: id, userId });
    if (!skill) {
      return res.status(404).json({ success: false, message: "Skill not found" });
    }

    res.status(200).json({ success: true, message: "Skill deleted successfully" });
  } catch (error) {
    console.error("Error deleting skill:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { addSkill, getSkills, deleteSkill,addMultipleSkills };
