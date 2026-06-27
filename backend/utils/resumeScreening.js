const pdf = require('pdf-parse');
const Groq = require('groq-sdk');

async function screenResumeBuffer({ buffer, jobTitle, jobDescription = '', skills = '' }) {
  if (!buffer) throw Object.assign(new Error('Resume file is required'), { statusCode: 400 });
  if (!jobTitle) throw Object.assign(new Error('Job title is required'), { statusCode: 400 });

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    throw Object.assign(new Error('Groq API key not configured. Get a free key at https://console.groq.com/keys'), { statusCode: 500 });
  }

  let resumeText = '';
  try {
    const data = await pdf(buffer);
    resumeText = data.text?.trim();
  } catch {
    throw Object.assign(new Error('Could not read PDF. Please use a valid, text-based PDF resume.'), { statusCode: 400 });
  }

  if (!resumeText || resumeText.length < 50) {
    throw Object.assign(new Error('Resume appears to be empty or unreadable. Please use a text-based PDF.'), { statusCode: 400 });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const roleContext = [
    jobDescription ? `Job description: ${jobDescription}` : '',
    skills ? `Required skills: ${skills}` : '',
  ].filter(Boolean).join('\n');

  const prompt = `You are an expert HR recruiter. Evaluate this resume against the job criteria below.

Job title: ${jobTitle}
${roleContext}

Resume:
${resumeText.slice(0, 6000)}

Return ONLY valid JSON with this exact structure, no markdown, no extra text:
{
  "score": <integer 0-100>,
  "grade": "<A/B/C/D/F>",
  "summary": "<2-3 sentence job-fit summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<gap 1>", "<gap 2>", "<gap 3>"],
  "missingSkills": ["<skill 1>", "<skill 2>", "<skill 3>"],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "verdict": "<Highly Recommended / Recommended / Needs Improvement / Not Recommended>"
}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are an expert HR recruiter. Always respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1024,
    temperature: 0.3,
  });

  const text = completion.choices[0]?.message?.content || '';

  let analysis;
  try {
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    analysis = JSON.parse(clean);
  } catch {
    throw Object.assign(new Error('AI returned an unexpected response. Please try again.'), { statusCode: 502 });
  }

  analysis.score = Math.max(0, Math.min(100, Math.round(Number(analysis.score) || 0)));
  return analysis;
}

module.exports = { screenResumeBuffer };
