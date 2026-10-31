'use strict';
/**
 * claude.service.js
 * ──────────────────
 * Uses the Anthropic Claude API for deep NLP-based job scam detection.
 * Matches the pattern already used in AITools.js (direct fetch to Anthropic API).
 *
 * The REACT_APP_CLAUDE_API_KEY env var shown in the screenshot is the frontend key;
 * on the backend we use CLAUDE_API_KEY (same key, server-side for security).
 */
const Anthropic = require('@anthropic-ai/sdk');
let _client = null;
const getClient = () => {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
  }
  return _client;
};
/**
 * Ask Claude to deeply analyze a job posting for scam/phishing indicators.
 *
 * @param {{ companyName?: string, jobLink?: string, jobDescription?: string }} input
 * @returns {{ verdict: string, confidence: number, redFlags: string[], greenFlags: string[], analysis: string }}
 */
const analyzeWithClaude = async ({ companyName, jobLink, jobDescription }) => {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.warn('[Claude] CLAUDE_API_KEY not set — skipping AI analysis');
    return {
      verdict:    'UNKNOWN',
      confidence: 50,
      redFlags:   [],
      greenFlags: [],
      analysis:   'AI analysis unavailable (API key not configured). Results are based on pattern analysis only.',
    };
  }
  const systemPrompt = `You are a cybersecurity expert specializing in job scam and phishing detection for Indian college students. You analyze job postings to determine if they are legitimate or fraudulent.
Your analysis should focus on these Indian job scam patterns:
1. Unrealistic salary promises (₹500/day, work-from-home schemes)
2. WhatsApp/Telegram-only contact methods
3. Requests for Aadhaar, PAN card, bank details before hiring
4. Registration/training fees or security deposits
5. MLM, pyramid schemes, or referral-based income
6. Data entry, ad clicking, form filling "jobs"
7. Guaranteed 100% job placements with no interview
8. Domain mismatch between company name and job link
9. Personal email (Gmail, Yahoo) used for official hiring
10. Excessive urgency, emotional manipulation, FOMO tactics
11. No specific role responsibilities — just vague "opportunity"
12. Copy-paste templates with generic language

You must respond ONLY with a valid JSON object — no markdown, no explanation outside the JSON.`;

  const userPrompt = `Analyze this job posting for authenticity. Return ONLY a JSON object.

COMPANY NAME: ${companyName || 'Not provided'}
JOB LINK / URL: ${jobLink || 'Not provided'}
JOB DESCRIPTION / POST CONTENT:
${jobDescription || 'Not provided'}
Return this exact JSON structure:
{
  "verdict": "LIKELY LEGITIMATE" | "SUSPICIOUS" | "LIKELY SCAM",
  "confidence": <integer 0-100, where 100 = definitely legitimate, 0 = definitely scam>,
  "redFlags": ["specific red flag 1", "specific red flag 2"],
  "greenFlags": ["specific green flag 1", "specific green flag 2"],
  "analysis": "<2-3 clear sentences explaining your verdict for a college student to understand>"
}
Rules:
- confidence >= 75 → LIKELY LEGITIMATE
- confidence 40-74 → SUSPICIOUS  
- confidence < 40 → LIKELY SCAM
- Be specific in flags, not generic (e.g., "Promises ₹500/day for data entry" not "suspicious promises")
- greenFlags can be empty array if nothing positive found
- If very little information provided, default to SUSPICIOUS with low confidence`;
  try {
    const client   = getClient();
    const response = await client.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 800,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    });
    const raw     = response.content?.[0]?.text?.trim() || '{}';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed  = JSON.parse(cleaned);
    // Normalize and validate
    const confidence = typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(100, parsed.confidence))
      : 50;
    let verdict = parsed.verdict || 'UNKNOWN';
    if (!['LIKELY LEGITIMATE', 'SUSPICIOUS', 'LIKELY SCAM', 'UNKNOWN'].includes(verdict)) {
      verdict = confidence >= 75 ? 'LIKELY LEGITIMATE'
               : confidence >= 40 ? 'SUSPICIOUS' : 'LIKELY SCAM';
    }
    return {
      verdict,
      confidence,
      redFlags:  Array.isArray(parsed.redFlags)  ? parsed.redFlags.slice(0, 8)  : [],
      greenFlags: Array.isArray(parsed.greenFlags) ? parsed.greenFlags.slice(0, 5) : [],
      analysis:  parsed.analysis || 'Analysis completed.',
    };
  } catch (err) {
    console.error('[Claude] Analysis error:', err.message);
    return {
      verdict:    'UNKNOWN',
      confidence: 50,
      redFlags:   [],
      greenFlags: [],
      analysis:   'AI analysis could not be completed at this time. Please review the pattern analysis results.',
    };
  }
};
module.exports = { analyzeWithClaude };