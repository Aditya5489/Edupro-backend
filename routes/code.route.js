const express = require("express");
const router = express.Router();
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const dotenv = require('dotenv'); 
dotenv.config();

const JD_CLIENT_ID = process.env.JD_CLIENT_ID;
const JD_CLIENT_SECRET = process.env.JD_CLIENT_SECRET;

router.post("/", async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "Code and language are required" });
  }

  try {
    // JDoodle language mapping
    const langMap = {
      javascript: "nodejs",
      python: "python3",
      cpp: "cpp17",
      java: "java"
    };

    const payload = {
      script: code,
      language: langMap[language] || language,
      versionIndex: "0", // default version
      clientId: JD_CLIENT_ID,
      clientSecret: JD_CLIENT_SECRET
    };

    const response = await fetch("https://api.jdoodle.com/v1/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    res.json({ output: data.output, memory: data.memory, cpuTime: data.cpuTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
