process.env.PDFJS_DISABLE_FONT_FACE = true;
console.warn = () => {};

const pdfParse = require("pdf-parse");
const cloudinary = require("../config/cloudinary");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Skill = require("../models/skill.model");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


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

    
    if (req.file) {
      const cloudinaryRes = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text;
      res.locals.cloudinaryUrl = cloudinaryRes.secure_url;
    } 
    
    else if (req.body.jdText && req.body.jdText.trim()) {
      extractedText = req.body.jdText;
    } 
    else {
      return res.status(400).json({ success: false, message: "No file or JD text provided" });
    }

   
    const userId = req.user.id; 
    const userSkills = await Skill.find({ userId });
    const formattedSkills = userSkills.map(s => `${s.skillName} (${s.proficiency})`).join(", ") || "No skills found";

   
    const prompt = `
      Job Description:\n${extractedText}\n
      User Skills:\n${formattedSkills}\n
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

    const result = await model.generateContent(prompt);
    const aiResponseText = result.response.text();

    
    let analysis;
    try {
        const cleaned = aiResponseText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
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
