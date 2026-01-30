process.env.PDFJS_DISABLE_FONT_FACE = true;
console.warn = () => {};

const pdfParse = require("pdf-parse");
const cloudinary = require("../config/cloudinary");
const { GoogleGenAI } = require("@google/genai"); // NEW SDK
const Skill = require("../models/skill.model");

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const uploadToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "raw", folder: "jobDescriptions", public_id: filename },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

const analyzeJobDescription = async (req, res) => {
  try {
    let extractedText = "";

    // PDF upload
    if (req.file) {
      const cloudinaryRes = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text;
      res.locals.cloudinaryUrl = cloudinaryRes.secure_url;
    } 
    // Text input
    else if (req.body.jdText && req.body.jdText.trim()) {
      extractedText = req.body.jdText;
    } 
    else {
      return res.status(400).json({ success: false, message: "No file or JD text provided" });
    }

    // Fetch user skills
    const userId = req.user.id; 
    const userSkills = await Skill.find({ userId });
    const formattedSkills = userSkills.map(s => `${s.skillName} (${s.proficiency})`).join(", ") || "No skills found";

    // AI prompt
    const prompt = `
Job Description:
${extractedText}

User Skills:
${formattedSkills}

Task:
1. Extract technical skills, soft skills, tools/frameworks, experience, and education from the JD.
2. Provide a short summary of the role.
3. Match required skills with user skills.
4. Identify lacking skills.
5. Return JSON ONLY in this format:
{
  "technical": [...],
  "soft": [...],
  "tools": [...],
  "experience": [...],
  "education": [...],
  "summary": "..."
}
`;

    // Generate AI content using GenAI
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash", // v1 stable model
      contents: prompt,
    });

    const aiResponseText = result.text.trim();

    // Parse JSON safely
    let analysis;
    try {
      const cleaned = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch (err) {
      console.error("Failed to parse AI response as JSON:", err);
      analysis = {
        technical: [],
        soft: [],
        tools: [],
        experience: [],
        education: [],
        summary: "",
      };
    }

    res.json({
      success: true,
      cloudinaryUrl: res.locals.cloudinaryUrl || null,
      analysis,
    });

  } catch (error) {
    console.error("Error analyzing JD:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = { analyzeJobDescription };
