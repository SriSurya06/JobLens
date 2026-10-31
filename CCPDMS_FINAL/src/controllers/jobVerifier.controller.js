'use strict';
const Student = require('../models/Student');
const JobVerification = require('../models/JobVerification');
const { ApiResponse, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { runHeuristicChecks } = require('../services/heuristic.service');
const { analyzeUrlSafety } = require('../services/urlSafety.service');
const { analyzeWithClaude } = require('../services/claude.service');
// Helpers
//  * Combines heuristic score (40%), URL safety score (20%), and AI confidence (40%)
//  * into a single authenticity score 0–100.
const computeFinalScore = (heuristicScore, urlSafetyScore, aiConfidence) => {
  const h = heuristicScore ?? 50;
  const u = urlSafetyScore ?? 50; // null = no URL provided → neutral 50
  const a = aiConfidence ?? 50;
  return Math.round(h * 0.40 + u * 0.20 + a * 0.40);
};
const verdictFromScore = (score) => {
  if (score >= 72) return { verdict: 'LIKELY LEGITIMATE', riskLevel: 'LOW', color: 'green' };
  if (score >= 48) return { verdict: 'SUSPICIOUS', riskLevel: 'MEDIUM', color: 'yellow' };
  return { verdict: 'LIKELY SCAM', riskLevel: 'HIGH', color: 'red' };
};
const dedupe = (arr) => [...new Set((arr || []).filter(Boolean))];
// POST /api/student/job-verifier/check
exports.checkJobAuthenticity = asyncHandler(async (req, res, next) => {
  const { companyName = '', jobLink = '', jobDescription = '' } = req.body;
  // Validate: at least one field required
  if (!companyName.trim() && !jobDescription.trim() && !jobLink.trim()) {
    return next(new ApiError(400, 'Please provide at least a company name, job link, or job description.'));
  }
  // ── Run all three checks in parallel ──────────────────────────────────────
  const [heuristicResult, urlSafetyResult, claudeResult] = await Promise.allSettled([
    runHeuristicChecks({ companyName, jobLink, jobDescription }),
    jobLink.trim() ? analyzeUrlSafety(jobLink.trim()) : Promise.resolve(null),
    analyzeWithClaude({ companyName, jobLink, jobDescription }),
  ]);
  const heuristic = heuristicResult.status === 'fulfilled'
    ? heuristicResult.value
    : { score: 50, flags: [], greenFlags: [], summary: 'Pattern analysis failed.' };

  const urlSafety = urlSafetyResult.status === 'fulfilled'
    ? urlSafetyResult.value    // may be null if no URL provided
    : null;
  const claude = claudeResult.status === 'fulfilled'
    ? claudeResult.value
    : { verdict: 'UNKNOWN', confidence: 50, redFlags: [], greenFlags: [], analysis: 'AI unavailable.' };

  // ── Compute scores ─────────────────────────────────────────────────────────
  const urlScore = urlSafety
    ? (urlSafety.safe ? 90 : (urlSafety.flags?.length > 2 ? 10 : 30))
    : null;
  const overallScore = computeFinalScore(heuristic.score, urlScore, claude.confidence);
  const { verdict, riskLevel, color } = verdictFromScore(overallScore);
  const scoreBreakdown = {
    heuristic: Math.round(heuristic.score),
    urlSafety: urlScore !== null ? Math.round(urlScore) : null,
    ai: Math.round(claude.confidence),
  };
  // ── Merge flags ────────────────────────────────────────────────────────────
  const allRedFlags = dedupe([...heuristic.flags, ...(urlSafety?.flags || []), ...(claude.redFlags || [])]);
  const allGreenFlags = dedupe([...heuristic.greenFlags, ...(urlSafety?.greenFlags || []), ...(claude.greenFlags || [])]);
  const result = {
    verdict,
    riskLevel,
    color,
    overallScore,
    scoreBreakdown,
    redFlags: allRedFlags,
    greenFlags: allGreenFlags,
    aiAnalysis: claude.analysis,
    aiVerdict: claude.verdict,
    heuristicSummary: heuristic.summary,
    urlSafety: urlSafety
      ? { safe: urlSafety.safe, domain: urlSafety.domain, threats: urlSafety.threats || [], source: urlSafety.source }
      : null,
    checkedAt: new Date().toISOString(),
  };
  // ── Persist to DB (fire-and-forget — don't block response) ────────────────
  const student = await Student.findOne({ user: req.user._id }).select('_id').lean();
  if (student) {
    JobVerification.create({
      student: student._id,
      user: req.user._id,
      companyName: companyName.trim(),
      jobLink: jobLink.trim(),
      jobDescription: jobDescription.slice(0, 2000), // truncate for storage
      verdict,
      riskLevel,
      overallScore,
      redFlags: allRedFlags,
      greenFlags: allGreenFlags,
      aiAnalysis: claude.analysis,
      scoreBreakdown,
      urlSafetyResult: urlSafety
        ? { safe: urlSafety.safe, domain: urlSafety.domain, threats: urlSafety.threats }
        : undefined,
      checkedAt: new Date(),
    }).catch((err) => console.error('[JobVerifier] Failed to persist verification:', err.message));
  }

  return res.status(200).json(new ApiResponse(200, result, 'Job authenticity check completed'));
});
// GET /api/student/job-verifier/history
// Returns the last 20 checks made by this student
exports.getVerificationHistory = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id }).select('_id').lean();
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  const history = await JobVerification
    .find({ student: student._id })
    .sort({ checkedAt: -1 })
    .limit(20)
    .select('companyName jobLink verdict riskLevel overallScore checkedAt redFlags')
    .lean();
  return res.status(200).json(new ApiResponse(200, { history, total: history.length }));
});
