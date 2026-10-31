const OnCampusDrive = require('../models/OnCampusDrive');
const OffCampusDrive = require('../models/OffCampusDrive');
const ChatHistory = require('../models/ChatHistory');

async function fetchAllDriveData() {
  const [onCampus, offCampus] = await Promise.all([
    OnCampusDrive.find({}).populate('rounds').lean(),
    OffCampusDrive.find({}).lean(),
  ]);

  const cleanOnCampus = onCampus.map((d) => ({
    type: 'on-campus',
    company: d.companyName,
    status: d.status,
    eligibleBatches: d.eligibleBatches,
    eligibleBranches: d.eligibleBranches,
    cgpaCutOff: d.cgpaCutOff,
    backlogsAllowed: d.backlogsAllowed,
    packageRange:
      d.minPackage && d.maxPackage
        ? `${d.minPackage} LPA – ${d.maxPackage} LPA`
        : 'Not disclosed',
    registrationDeadline: d.registrationDeadline
      ? new Date(d.registrationDeadline).toDateString()
      : 'Not specified',
    rounds: (d.rounds || []).map((r) => ({
      roundNumber: r.roundNumber,
      roundName: r.roundName,
      venue: r.venue || 'TBD',
      date: r.date ? new Date(r.date).toDateString() : 'TBD',
    })),
  }));

  const cleanOffCampus = offCampus.map((d) => ({
    type: 'off-campus',
    company: d.companyName,
    driveName: d.driveName,
    eligibleBatches: d.eligibleBatches,
    eligibleBranches: d.eligibleBranches,
    applyLink: d.applyLink,
    lastDateToApply: d.lastDateToApply
      ? new Date(d.lastDateToApply).toDateString()
      : 'Not specified',
  }));

  return { onCampus: cleanOnCampus, offCampus: cleanOffCampus };
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}

// POST /api/student/chatbot
exports.handleChat = async (req, res) => {
  try {
    const { message, chatId, profile } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const { onCampus, offCampus } = await fetchAllDriveData();
    const dbContext = JSON.stringify({ onCampusDrives: onCampus, offCampusDrives: offCampus }, null, 2);

    const fullPrompt = `You are a helpful college Placement Assistant Chatbot for JobLens.
Your ONLY job is to answer questions about placement drives using the data provided below.

Student Profile:
- Name: ${profile?.name || 'Student'}
- Branch: ${profile?.branch || 'Not specified'}
- Batch: ${profile?.passedOutYear || 'Not specified'}
- CGPA: ${profile?.cgpa || 'N/A'}

STRICT RULES:
1. Answer ONLY from the JSON data given. Do NOT use external knowledge for company-specific drive details.
2. If a company is not in the data, say: "Company not found in current drives."
3. Keep answers short and clear. Format with line breaks for readability.

PLACEMENT DATA:
${dbContext}

User Question: ${message}

Answer:`;

    const aiReply = await callGemini(fullPrompt);

    // Save chat history
    let chat;
    if (chatId) {
      chat = await ChatHistory.findByIdAndUpdate(
        chatId,
        { $push: { messages: [{ role: 'user', content: message }, { role: 'assistant', content: aiReply }] } },
        { new: true }
      );
    } else {
      const title = message.length > 50 ? message.substring(0, 47) + '...' : message;
      chat = await ChatHistory.create({
        title,
        messages: [{ role: 'user', content: message }, { role: 'assistant', content: aiReply }],
      });
    }

    return res.json({ success: true, data: { reply: aiReply, chatId: chat._id } });
  } catch (err) {
    console.error('Chatbot error:', err.message);
    return res.status(500).json({ success: false, message: 'Chatbot failed. Please try again.' });
  }
};

// GET /api/student/chatbot/history
exports.getChatHistory = async (req, res) => {
  try {
    const chats = await ChatHistory.find({}, 'title createdAt updatedAt').sort({ updatedAt: -1 }).lean();
    return res.json({ success: true, data: chats });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch history.' });
  }
};

// GET /api/student/chatbot/history/:id
exports.getChatById = async (req, res) => {
  try {
    const chat = await ChatHistory.findById(req.params.id).lean();
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });
    return res.json({ success: true, data: chat });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch chat.' });
  }
};

// DELETE /api/student/chatbot/history/:id
exports.deleteChat = async (req, res) => {
  try {
    await ChatHistory.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not delete chat.' });
  }
};