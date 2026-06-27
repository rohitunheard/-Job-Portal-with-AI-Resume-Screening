const Groq = require('groq-sdk');

const systemPrompt = `You are "Jobot", a friendly and helpful AI assistant for a Job Portal website.

About this Job Portal:
- Job Seekers can sign up, build a profile, upload their resume and photo, and apply to jobs in one tap
- Employers can register, post job openings with title, description, salary, location and required skills
- There are 24+ job listings across categories like Technology, Design, Data Science, DevOps, Mobile, Marketing
- All salaries are shown in INR (Indian Rupees)
- Login uses OTP email verification for security
- Admin can view all applications and use AI resume screening to rank candidates
- There is a chat feature for employers to message shortlisted applicants

Your responsibilities:
- Help users navigate the portal (how to sign up, apply, post jobs, etc.)
- Answer questions about job listings, salaries, and categories
- Guide employers on how to post jobs and use the dashboard
- Help with profile setup and resume upload
- Explain how the OTP login works
- Be encouraging and professional

Keep responses concise, friendly and helpful. Use bullet points when listing steps.`;

const chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return res.status(500).json({ message: 'Groq API key not configured. Get a free key at https://console.groq.com/keys and add GROQ_API_KEY to backend/.env' });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Build messages array: system + history + new user message
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history
        .filter(h => h.role && h.text)
        .slice(-10)
        .map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })),
      { role: 'user', content: message.trim() },
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    res.json({ reply });

  } catch (error) {
    console.error('Chatbot error:', error.message);
    if (error.status === 401) return res.status(500).json({ message: 'Invalid Groq API key. Check https://console.groq.com/keys' });
    if (error.status === 429) return res.status(500).json({ message: 'Rate limit reached. Please try again in a moment.' });
    res.status(500).json({ message: 'Jobot is unavailable: ' + error.message });
  }
};

module.exports = { chat };
