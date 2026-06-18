const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/resume-screen
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const { jobTitle, jobDescription } = req.body;

    if (!req.file) return res.status(400).json({ message: 'Resume file is required' });
    if (!jobTitle) return res.status(400).json({ message: 'Job title is required' });

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here' || !process.env.GEMINI_API_KEY.startsWith('AIza')) {
      return res.status(500).json({ message: 'Invalid or missing Gemini API key. Gemini keys start with "AIza". Get your free key at https://aistudio.google.com/app/apikey and update GEMINI_API_KEY in backend/.env' })
    }

    // Extract text from PDF
    let resumeText = '';
    try {
      const parsed = await pdfParse(req.file.buffer);
      resumeText = parsed.text?.trim();
    } catch {
      return res.status(400).json({ message: 'Could not read PDF. Please upload a valid PDF file.' });
    }

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({ message: 'Resume appears to be empty or unreadable. Please upload a text-based PDF.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert HR recruiter and resume screener. Analyze the following resume for the job position: "${jobTitle}"${jobDescription ? ` with this job description: "${jobDescription}"` : ''}.

Resume Content:
${resumeText.slice(0, 4000)}

Provide a detailed analysis in the following JSON format (respond with ONLY valid JSON, no markdown, no extra text):
{
  "score": <number between 0-100>,
  "grade": "<A/B/C/D/F>",
  "summary": "<2-3 sentence overall summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "missingSkills": ["<skill 1>", "<skill 2>", "<skill 3>"],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "verdict": "<Highly Recommended / Recommended / Needs Improvement / Not Recommended>"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code blocks if present
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    let analysis;
    try {
      analysis = JSON.parse(clean);
    } catch {
      return res.status(500).json({ message: 'AI returned an unexpected response. Please try again.' });
    }

    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Resume screening failed' });
  }
});

module.exports = router;
