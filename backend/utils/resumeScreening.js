const pdf = require('pdf-parse')
const OpenAI = require('openai')

async function screenResumeBuffer({ buffer, jobTitle, jobDescription = '', skills = '' }) {
  if (!buffer) throw new Error('Resume file is required')
  if (!jobTitle) throw new Error('Job title is required')

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    const error = new Error('Invalid or missing OpenAI API key. Update OPENAI_API_KEY in backend/.env')
    error.statusCode = 500
    throw error
  }

  let resumeText = ''
  try {
    const data = await pdf(buffer)
    resumeText = data.text?.trim()
  } catch {
    const error = new Error('Could not read PDF. Please use a valid, text-based PDF resume.')
    error.statusCode = 400
    throw error
  }

  if (!resumeText || resumeText.length < 50) {
    const error = new Error('Resume appears to be empty or unreadable. Please use a text-based PDF.')
    error.statusCode = 400
    throw error
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const roleContext = [
    jobDescription ? `Job description: ${jobDescription}` : '',
    skills ? `Required skills: ${skills}` : '',
  ].filter(Boolean).join('\n')

  const prompt = `You are an expert HR recruiter. Evaluate this candidate only against the supplied job criteria. Do not infer protected or sensitive personal traits.

Job title: ${jobTitle}
${roleContext}

Resume:
${resumeText.slice(0, 6000)}

Return ONLY valid JSON with this exact structure:
{
  "score": <integer from 0 to 100>,
  "grade": "<A/B/C/D/F>",
  "summary": "<2-3 sentence job-fit summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<gap 1>", "<gap 2>", "<gap 3>"],
  "missingSkills": ["<skill 1>", "<skill 2>", "<skill 3>"],
  "suggestions": ["<interview or review suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "verdict": "<Highly Recommended / Recommended / Needs Improvement / Not Recommended>"
}`

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_RESUME_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Return only valid JSON matching the requested schema. Do not use markdown.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  })

  const text = completion.choices?.[0]?.message?.content?.trim() || ''
  let analysis
  try {
    analysis = JSON.parse(text)
  } catch {
    const error = new Error('AI returned an unexpected response. Please try again.')
    error.statusCode = 502
    throw error
  }

  analysis.score = Math.max(0, Math.min(100, Math.round(Number(analysis.score) || 0)))
  return analysis
}

module.exports = { screenResumeBuffer }
