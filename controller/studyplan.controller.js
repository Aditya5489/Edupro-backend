const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const StudyPlan = require('../models/studyplan.model');
const { fetchYouTubeVideo } = require('../config/youtube'); 
const { get } = require('mongoose');
const allocateBadge = require("../utils/badgeAllocator");
const User = require('../models/user.model');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "models/gemini-pro",
});

const generatePlan = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { studyGoal, timePerDay, skillLevel, durationInDays } = req.body;

    if (!studyGoal || !timePerDay || !skillLevel || !durationInDays || !userId) {
      return res.status(400).json({ error: "Missing required fields or user not authenticated" });
    }

    const prompt = `
You are an AI study plan generator. Output ONLY a valid JSON array of days.
Each day must have:
- dayNumber (number)
- tasks (array of { topic: string, resources: array of strings, youtube: [] })
- milestone (string or empty string)
- motivationTip (string or empty string)

No explanations, markdown, or extra text — ONLY JSON.

Example output:
[
  {
    "dayNumber": 1,
    "tasks": [
      { "topic": "Introduction to React", "resources": ["https://react.dev"], "youtube": [] }
    ],
    "milestone": "Setup complete",
    "motivationTip": "Keep going!"
  }
]

Generate a ${skillLevel} level "${studyGoal}" plan with ${timePerDay} hours/day for ${durationInDays} days.
    `;

    // Ask Gemini
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "AI did not return valid JSON" });
    }

    let parsedPlan;
    try {
      parsedPlan = JSON.parse(jsonMatch[0]);
    } catch (err) {
      return res.status(500).json({ error: "Invalid JSON format from AI" });
    }

    
    for (let day of parsedPlan) {
      for (let task of day.tasks) {
        if (task.topic) {
          try {
            const ytVideos = await fetchYouTubeVideo(task.topic);
            task.youtube = Array.isArray(ytVideos) ? ytVideos.map(v => v.url) : [];
          } catch (err) {
            console.error(`❌ Failed fetching YouTube for ${task.topic}`, err);
            task.youtube = [];
          }
        }else {
          task.youtube = [];
        }
      }
    }
    console.log("Plan before saving:", JSON.stringify(parsedPlan, null, 2));

    
    const savedPlan = await StudyPlan.create({
      userId,
      studyGoal,
      timePerDay,
      skillLevel,
      durationInDays, 
      plan: parsedPlan
    });

    res.status(200).json(savedPlan);

  } catch (err) {
    console.error("Error generating plan:", err);
    res.status(500).json({ error: "Failed to generate study plan" });
  }
};

const markPlanCompleted = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user?.id;

    if (!planId || !userId) {
      return res.status(400).json({ error: "Missing planId or user not authenticated" });
    }

    const plan = await StudyPlan.findOne({ _id: planId, userId });
    if (!plan) {
      return res.status(404).json({ error: "Study plan not found" });
    }

    plan.completed = true;
    await plan.save();

    const user = await User.findById(userId);
    user.xpPoints += 10;
    user.badges= allocateBadge(user.xpPoints);

    await user.save();

    res.status(200).json({
      message: "Plan completed and XP updated ✅",
      plan,
      xpPoints: user.xpPoints,
      levelBadge: user.badges,
    });
  } catch (err) {
    console.error("Error marking plan completed:", err);
    res.status(500).json({ error: "Failed to mark plan as completed" });
  }
};

const getUserStudyPlans = async (req, res) => {
  try {
    const userId = req.user.id;

    const plans = await StudyPlan.find({ userId }).sort({ createdAt: -1 }); 
    if (!plans || plans.length === 0) {
      return res.status(404).json({ message: "No study plans found for this user" });
    }

    res.status(200).json(plans);
  } catch (err) {
    console.error("Error fetching study plans:", err);
    res.status(500).json({ message: "Server error fetching study plans" });
  }
};

const getStudyPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const plan = await StudyPlan.findOne({ _id: id, userId });
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.status(200).json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



const deletePlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user?.id;

    if (!planId || !userId) {
      return res.status(400).json({ error: "Missing planId or user not authenticated" });
    }

    const plan = await StudyPlan.findOneAndDelete({ _id: planId, userId });
    if (!plan) {
      return res.status(404).json({ error: "Study plan not found or already deleted" });
    }

    res.status(200).json({ message: "Study plan deleted successfully ✅", plan });
  } catch (err) {
    console.error("Error deleting study plan:", err);
    res.status(500).json({ error: "Failed to delete study plan" });
  }
};

module.exports = { generatePlan ,markPlanCompleted,getUserStudyPlans,deletePlan,getStudyPlanById};
