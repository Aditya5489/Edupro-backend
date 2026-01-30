const { GoogleGenAI } = require("@google/genai"); // NEW SDK
const User = require("../models/user.model");
const allocateBadge = require("../utils/badgeAllocator");

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateChallenge = async (req, res) => {
  const { language } = req.body;

  if (!["JavaScript", "Python", "Java", "C++"].includes(language)) {
    return res.status(400).json({ error: `Language ${language} not supported.` });
  }

  const prompt = `
Generate a simple ${language} coding challenge with buggy code.
Return in JSON with the fields:
{
  "title": "string",
  "description": "string",
  "buggyCode": "string"
}
Keep the code small and with one or two bugs.
`;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash", // stable v1 model
      contents: prompt,
    });

    const rawText = result.text.trim();
    const cleanText = rawText.replace(/```(json)?/g, "").trim();

    let challenge;
    try {
      challenge = JSON.parse(cleanText);
    } catch (parseErr) {
      const match = cleanText.match(/{[\s\S]*}/);
      if (match) {
        challenge = JSON.parse(match[0]);
      } else {
        throw new Error("Failed to parse challenge JSON");
      }
    }

    res.json(challenge);
  } catch (err) {
    console.error("Challenge generation error:", err.message);
    res.status(500).json({ error: "Failed to generate challenge" });
  }
};

const validateSolution = async (req, res) => {
  const { userCode, language, description } = req.body;

  if (!userCode || !language || !description) {
    return res.status(400).json({ error: "userCode, language and description required" });
  }

  const prompt = `
You are a strict code validator.
Task: ${description}
Language: ${language}

User's code:
${userCode}

Does the code solve the problem correctly? 
Reply ONLY in JSON:
{ "isCorrect": true/false, "feedback": "string" }
`;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const rawText = result.text.trim();
    const cleanText = rawText.replace(/```(json)?/g, "").trim();

    let validation;
    try {
      validation = JSON.parse(cleanText);
    } catch (parseErr) {
      const match = cleanText.match(/{[\s\S]*}/);
      if (match) {
        validation = JSON.parse(match[0]);
      } else {
        throw new Error("Failed to parse validation JSON");
      }
    }

    if (validation.isCorrect) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.xpPoints += 20;
        user.levelBadge = allocateBadge(user.xpPoints);
        await user.save();
      }
    }

    res.json(validation);
  } catch (err) {
    console.error("Validation error:", err.message);
    res.status(500).json({ error: "Failed to validate solution" });
  }
};

const correctUserCode = async (req, res) => {
  const { userCode, language, description } = req.body;

  if (!userCode || !language) {
    return res.status(400).json({ error: "userCode and language required" });
  }

  const prompt = `
A user attempted this problem in ${language}:

Problem: ${description || "Fix the function as required."}
Code:
${userCode}

Please return only the corrected ${language} code, without extra explanation.
Ensure function name stays 'solution'.
`;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const rawText = result.text.trim();
    const fixedCode = rawText.replace(/```(.*)?/g, "").trim();

    res.json({ fixedCode });
  } catch (err) {
    console.error("Correction error:", err.message);
    res.status(500).json({ error: "Failed to correct code" });
  }
};

module.exports = {
  generateChallenge,
  validateSolution,
  correctUserCode,
};
