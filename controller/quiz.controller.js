process.env.PDFJS_DISABLE_FONT_FACE = true;
console.warn = () => {}; 

const pdfParse = require("pdf-parse");
const cloudinary = require("../config/cloudinary");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai"); // NEW SDK

dotenv.config();

// Initialize GenAI client
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const uploadToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "raw", folder: "notes", public_id: filename },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

const handleGenerateContent = async (req, res) => {
  try {
    const { type } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Upload PDF to Cloudinary
    const cloudinaryRes = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    // Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const extractedText = pdfData.text;

    // Prepare AI prompt
    let prompt;
    if (type === "quiz") {
      prompt = `From the following notes, create 15 multiple-choice quiz questions with 4 options each and indicate the correct answer.\n\nNotes:\n${extractedText}`;
    } else if (type === "flashcard") {
      prompt = `From the following notes, create concise flashcards in Q&A format.\n\nNotes:\n${extractedText}`;
    } else if (type === "short-answer") {
      prompt = `From the following notes, create 10 short-answer questions with their correct answers. 
Format each question as:
1. Question: ...
   Answer: ...
2. Question: ...
   Answer: ...

Notes:
${extractedText}`;
    } else {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    // Generate AI content using GenAI
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash", // stable v1 model
      contents: prompt,
    });

    const content = result.text.trim();

    res.json({
      success: true,
      type,
      cloudinaryUrl: cloudinaryRes.secure_url,
      content,
    });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = { handleGenerateContent };
