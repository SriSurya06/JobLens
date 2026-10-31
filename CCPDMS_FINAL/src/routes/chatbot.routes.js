const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');

// ── inline ChatHistory model (no separate file needed) ─────────────────────
const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});
const chatHistorySchema = new mongoose.Schema(
  { title: { type: String, default: 'New Chat' }, messages: [messageSchema] },
  { timestamps: true }
);
const ChatHistory = mongoose.models.ChatHistory || mongoose.model('ChatHistory', chatHistorySchema);

// ── fetch live drive data ──────────────────────────────────────────────────
async function fetchAllDriveData() {
  const OnCampusDrive  = require('../models/OnCampusDrive');
  const OffCampusDrive = require('../models/OffCampusDrive');

  const [onCampus, offCampus] = await Promise.all([
    OnCampusDrive.find({}).lean(),
    OffCampusDrive.find({}).lean(),
  ]);

  const cleanOn = onCampus.map(d => ({
    type: 'on-campus',
    company: d.companyName,
    status: d.status,
    eligibleBranches: d.eligibleBranches,
    eligibleBatches: d.eligibleBatches,
    cgpaCutOff: d.cgpaCutOff,
    backlogsAllowed: d.backlogsAllowed,
    packageRange: d.minPackage && d.maxPackage ? `${d.minPackage} LPA – ${d.maxPackage} LPA` : 'Not disclosed',
    registrationDeadline: d.registrationDeadline ? new Date(d.registrationDeadline).toDateString() : 'Not specified',
  }));

  const cleanOff = offCampus.map(d => ({
    type: 'off-campus',
    company: d.companyName,
    driveName: d.driveName,
    eligibleBranches: d.eligibleBranches,
    eligibleBatches: d.eligibleBatches,
    applyLink: d.applyLink,
    lastDateToApply: d.lastDateToApply ? new Date(d.lastDateToApply).toDateString() : 'Not specified',
  }));

  return { onCampus: cleanOn, offCampus: cleanOff };
}


async function callGroq(messages) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.3,
        max_tokens: 800,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  return data.choices?.[0]?.message?.content || 'No response generated.';
}
// ── POST /api/student/chatbot  (send message) ──────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { message, chatId, profile } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required.' });

    const { onCampus, offCampus } = await fetchAllDriveData();
    const dbContext = JSON.stringify({ onCampusDrives: onCampus, offCampusDrives: offCampus }, null, 2);

    const fullPrompt = `You are a helpful college Placement Assistant for JobLens.
Answer questions about placement drives using the data below only.
Student: ${profile?.name || 'Student'} | Branch: ${profile?.branch || 'N/A'} | CGPA: ${profile?.cgpa || 'N/A'}

RULES:
1. Only use the JSON data given below.
2. If a company is not in the data say "Not found in current drives."
3. Keep answers short and clear with line breaks.

PLACEMENT DATA:
${dbContext}

User: ${message}
Answer:`;

    const aiReply = await callGroq([{ role: 'user', content: fullPrompt }]);

    // ── CONTINUE existing chat OR create new one ──────────────────────────
    let chat;
    if (chatId) {
      // append to existing chat
      chat = await ChatHistory.findByIdAndUpdate(
        chatId,
        { $push: { messages: [{ role: 'user', content: message }, { role: 'assistant', content: aiReply }] } },
        { new: true }
      );
      if (!chat) {
        // chatId was invalid — create fresh
        chat = await ChatHistory.create({
          title: message.length > 50 ? message.substring(0, 47) + '...' : message,
          messages: [{ role: 'user', content: message }, { role: 'assistant', content: aiReply }],
        });
      }
    } else {
      // brand new chat — title = first message
      chat = await ChatHistory.create({
        title: message.length > 50 ? message.substring(0, 47) + '...' : message,
        messages: [{ role: 'user', content: message }, { role: 'assistant', content: aiReply }],
      });
    }

    return res.json({ success: true, data: { reply: aiReply, chatId: chat._id } });
  } catch (err) {
    console.error('Chatbot error:', err.message);
    return res.status(500).json({ success: false, message: 'Chatbot failed. Please try again.' });
  }
});

// ── GET /api/student/chatbot/history  (list all chats) ────────────────────
router.get('/history', async (req, res) => {
  try {
    const chats = await ChatHistory.find({}, 'title createdAt updatedAt').sort({ updatedAt: -1 }).lean();
    return res.json({ success: true, data: chats });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch history.' });
  }
});

// ── GET /api/student/chatbot/history/:id  (load one chat) ─────────────────
router.get('/history/:id', async (req, res) => {
  try {
    const chat = await ChatHistory.findById(req.params.id).lean();
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });
    return res.json({ success: true, data: chat });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch chat.' });
  }
});

// ── DELETE /api/student/chatbot/history/:id ───────────────────────────────
router.delete('/history/:id', async (req, res) => {
  try {
    await ChatHistory.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not delete chat.' });
  }
});

module.exports = router;