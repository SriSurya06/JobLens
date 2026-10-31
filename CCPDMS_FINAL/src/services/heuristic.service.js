'use strict';
/**
 * heuristic.service.js
 * Fast, zero-API-cost scam detection using regex patterns, keyword lists,
 * URL heuristics, and text-quality signals.
 * Returns: { score: 0–100, flags: string[], greenFlags: string[], summary: string }
 *   score  → authenticity score (higher = more legitimate)
 */
// Pattern Libraries
/** Scam/phishing keyword patterns commonly found in fake job posts */
const SCAM_PATTERNS = [
  // Unrealistic money promises
  /earn\s+(?:rs\.?|₹|\$)?\s*\d{3,}[,\d]*\s*(?:per|\/)\s*(?:day|week|hr|hour)/i,
  /(?:make|get|earn)\s+(?:rs\.?|₹|\$)?\s*\d{3,}[,\d]*\s*(?:daily|weekly|monthly)\s*(?:from\s+home)?/i,
  /(?:unlimited|uncapped)\s+(?:earning|income|salary)/i,
  /high\s+(?:pay(?:ing)?|salary|income)\s+(?:work\s+from\s+home|wfh|home\s+based)/i,
  // No-experience promises + high pay
  /no\s+(?:experience|qualification|skills?|degree)\s+(?:needed|required|necessary)/i,
  /(?:freshers?|anyone)\s+(?:can|may)\s+(?:apply|join|earn)/i,
  // Urgency tactics
  /(?:urgent(?:ly)?|immediately|asap)\s+(?:hiring|required|needed|opening)/i,
  /limited\s+(?:seats?|vacancies|openings?|spots?)\s+(?:available|left|remaining)/i,
  /(?:apply|join)\s+(?:now|today|immediately)\s+(?:and\s+)?(?:start|earn)/i,
  // Informal contact only
  /(?:contact|whatsapp|message|dm|ping)\s+(?:on\s+)?(?:whatsapp|wa|telegram|watsapp)/i,
  /(?:send|forward)\s+(?:your\s+)?(?:cv|resume)\s+(?:on|to|at)\s+\d{10}/i,
  /(?:whatsapp|telegram)\s+(?:only|for\s+details)/i,
  // Fee/deposit scams
  /(?:pay|deposit|invest|send)\s+(?:rs\.?|₹|\$)?\s*\d+\s*(?:to\s+(?:get|start|join)|for\s+(?:kit|training|material|id|registration))/i,
  /(?:registration|training|kit|material|id\s+card|joining)\s+fee/i,
  /(?:refundable|security)\s+deposit\s+(?:of|for)/i,
  // Work-from-home money schemes
  /(?:data\s+entry|form\s+filling|survey|ad\s+clicking|copy\s+paste|typing)\s+(?:job|work|earn)/i,
  /(?:mlm|multi.?level\s+marketing|pyramid|chain\s+marketing|referral\s+income)/i,
  /make\s+money\s+online\s+(?:from\s+home|without\s+investment)/i,
  // Personal info demands early
  /(?:aadhaar|aadhar|pan\s+card|bank\s+(?:details?|account)|account\s+number)\s+(?:send|provide|share|submit|required)/i,
  /(?:share|send|provide)\s+(?:your\s+)?(?:personal\s+)?(?:bank|account|card)\s+(?:details?|info|number)/i,
  // Guaranteed outcomes
  /(?:100%|guaranteed)\s+(?:job|placement|selection|income|salary)/i,
  /(?:no\s+interview|no\s+test|no\s+exam|direct\s+selection|instant\s+joining)/i,
  // Easy money tags
  /(?:easy|simple|part.?time)\s+(?:money|income|cash|earning)\s+(?:from\s+home|online|daily)/i,
  /(?:passive|residual)\s+income\s+(?:opportunity|scheme|plan)/i,
];
/** Text patterns that signal a legitimate job posting */
const LEGIT_PATTERNS = [
  /\b(?:\d+)\+?\s+years?\s+of\s+(?:relevant\s+)?experience\b/i,
  /\b(?:bachelor|b\.?tech|b\.?e|b\.?sc|master|m\.?tech|mba|phd)\s+(?:degree|in)\b/i,
  /\b(?:interview\s+process|technical\s+round|hr\s+round|assessment\s+centre)\b/i,
  /\b(?:employee\s+benefits|health\s+insurance|provident\s+fund|pf|gratuity|esop)\b/i,
  /\b(?:job\s+responsibilities|key\s+responsibilities|roles?\s+and\s+responsibilities)\b/i,
  /\b(?:required\s+qualifications?|preferred\s+qualifications?|minimum\s+qualifications?)\b/i,
  /\b(?:hybrid|on.?site|remote)\s+(?:role|position|opportunity)\b/i,
  /\b(?:competitive|market.?linked|ctc|lpa|lakh\s+per\s+annum)\b/i,
  /\b(?:apply\s+(?:at|on|via|through)\s+(?:our|the)\s+(?:official\s+)?(?:website|portal|careers?\s+page))\b/i,
  /\bequal\s+opportunity\s+employer\b/i,
];
/** Trusted job/company domains — URL pointing here is a green signal */
const TRUSTED_DOMAINS = new Set([
  'linkedin.com', 'naukri.com', 'indeed.com', 'glassdoor.com', 'glassdoor.co.in',
  'monster.com', 'shine.com', 'foundit.in', 'internshala.com', 'freshersworld.com',
  'hirist.tech', 'cutshort.io', 'wellfound.com', 'unstop.com', 'iimjobs.com',
  'tcs.com', 'infosys.com', 'wipro.com', 'accenture.com', 'hcltech.com',
  'cognizant.com', 'capgemini.com', 'ibm.com', 'microsoft.com', 'google.com',
  'amazon.com', 'amazon.in', 'flipkart.com', 'zoho.com', 'freshworks.com',
]);
/** TLDs that are very cheap/free and commonly abused for scam sites */
const SHADY_TLDS = new Set(['.xyz', '.top', '.click', '.loan', '.work', '.icu',
  '.gq', '.tk', '.ml', '.cf', '.ga', '.pw', '.rest', '.cyou', '.bar']);
/** Known URL shortener domains — hides destination = red flag */
const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'ow.ly', 'goo.gl', 'cutt.ly', 'rb.gy',
  'shorturl.at', 'is.gd', 'buff.ly', 'tiny.cc',
]);
/** Free personal email domains — legit companies don't use these for hiring */
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com',
  'ymail.com', 'mail.com', 'protonmail.com', 'icloud.com', 'aol.com',
]);
// Helpers
const getDomain = (url) => {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    return new URL(normalized).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.toLowerCase();
  }
};
const extractEmail = (text) => {
  const m = text?.match(/[a-zA-Z0-9._%+\-]+@([a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
  return m ? { full: m[0], domain: m[1].toLowerCase() } : null;
};
const countWords = (text) => (text || '').trim().split(/\s+/).filter(Boolean).length;
// Main Analysis Function
/**
 * @param {{ companyName?: string, jobLink?: string, jobDescription?: string }} input
 * @returns {{ score: number, flags: string[], greenFlags: string[], summary: string }}
 */
const runHeuristicChecks = async ({ companyName = '', jobLink = '', jobDescription = '' }) => {
  const flags      = [];
  const greenFlags = [];
  const fullText   = [companyName, jobLink, jobDescription].filter(Boolean).join(' ');
  let penalty = 0;
  let bonus   = 0;
  // ── 1. Scam keyword detection ─────────────────────────────────────────────
  const triggeredPatterns = new Set();
  for (const pattern of SCAM_PATTERNS) {
    const match = fullText.match(pattern);
    if (match && !triggeredPatterns.has(pattern.source)) {
      triggeredPatterns.add(pattern.source);
      const snippet = match[0].slice(0, 60);
      flags.push(`Scam signal detected: "${snippet}"`);
      penalty += 12;
    }
  }
  // ── 2. Legitimate signal detection ───────────────────────────────────────
  let legitHits = 0;
  for (const pattern of LEGIT_PATTERNS) {
    if (pattern.test(fullText)) legitHits++;
  }
  if (legitHits >= 3) {
    greenFlags.push('Job description contains multiple professional/legitimate hiring signals');
    bonus += 20;
  } else if (legitHits >= 1) {
    greenFlags.push('Job description contains some professional language');
    bonus += 8;
  }
  // ── 3. URL analysis ───────────────────────────────────────────────────────
  if (jobLink) {
    const domain = getDomain(jobLink);
    const tld    = '.' + domain.split('.').pop();
    // IP address URL
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) {
      flags.push('Job URL is a raw IP address — this is never used by legitimate companies');
      penalty += 25;
    }
    // URL shortener
    if (URL_SHORTENERS.has(domain)) {
      flags.push(`URL is a shortened link (${domain}) — the real destination is hidden, common in phishing`);
      penalty += 20;
    }
    // Shady TLD
    if (SHADY_TLDS.has(tld)) {
      flags.push(`Job URL uses a cheap/suspicious domain extension (${tld}) — commonly used in scam sites`);
      penalty += 18;
    }
    // Too many subdomains (e.g. careers.apply.jobs.tc.click)
    if ((domain.match(/\./g) || []).length > 3) {
      flags.push('URL has an unusually deep subdomain structure — may be impersonating a real company');
      penalty += 12;
    }
    // Trusted domain check
    const isTrusted = [...TRUSTED_DOMAINS].some(d => domain === d || domain.endsWith('.' + d));
    if (isTrusted) {
      greenFlags.push(`Job URL is on a trusted platform/company domain (${domain})`);
      bonus += 15;
    } else if (companyName) {
      // Check if domain is plausibly related to the company name
      const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5);
      if (slug.length >= 3 && !domain.includes(slug)) {
        flags.push(`Job URL domain (${domain}) does not appear to match the stated company name`);
        penalty += 10;
      }
    }
    // WhatsApp / Telegram links used as "job application"
    if (/wa\.me|t\.me|telegram\.me/i.test(jobLink)) {
      flags.push('Job application link leads to a messaging app — legitimate companies use official career portals');
      penalty += 22;
    }
  }
  // ── 4. Email domain check ─────────────────────────────────────────────────
  const emailInfo = extractEmail(fullText);
  if (emailInfo) {
    if (FREE_EMAIL_DOMAINS.has(emailInfo.domain)) {
      flags.push(`Contact email uses a free/personal email domain (@${emailInfo.domain}) — legitimate companies use corporate emails`);
      penalty += 20;
    } else {
      greenFlags.push(`Contact email uses a corporate domain (@${emailInfo.domain})`);
      bonus += 10;
    }
  }
  // ── 5. Job description quality checks ────────────────────────────────────
  if (jobDescription) {
    const wordCount     = countWords(jobDescription);
    const exclamations  = (jobDescription.match(/!/g) || []).length;
    const capsWords     = (jobDescription.match(/\b[A-Z]{4,}\b/g) || []).length;
    const hasRupee      = /₹|rs\.?\s*\d|lpa|lakh/i.test(jobDescription);
    if (wordCount < 25) {
      flags.push('Job description is extremely short — real job posts provide detailed information');
      penalty += 15;
    } else if (wordCount > 100) {
      greenFlags.push('Detailed job description provided (good sign of authenticity)');
      bonus += 8;
    }
    if (exclamations > 4) {
      flags.push('Excessive exclamation marks — a classic spam/scam writing style');
      penalty += 8;
    }
    if (capsWords > 6) {
      flags.push('Excessive use of ALL CAPS words — characteristic of scam/promotional content');
      penalty += 8;
    }
    if (/only\s+(?:whatsapp|telegram|watsapp|call)/i.test(jobDescription)) {
      flags.push('Only informal contact methods mentioned — legitimate companies list official HR email/portal');
      penalty += 18;
    }
    if (hasRupee && /per\s*day|daily\s*pay|instant\s*pay/i.test(jobDescription)) {
      flags.push('Promises of daily/instant payments — not standard in legitimate corporate hiring');
      penalty += 15;
    }
  }
  // ── 6. Company name checks ────────────────────────────────────────────────
  if (companyName) {
    // Known large Indian companies (very basic whitelist signal)
    const KNOWN_COMPANIES = /^(tcs|infosys|wipro|hcl|accenture|cognizant|capgemini|ibm|deloitte|pwc|kpmg|ey|byjus|byju|flipkart|amazon|microsoft|google|zoho|freshworks|razorpay|paytm|myntra|swiggy|zomato|ola|uber|persistent|mphasis|hexaware|l&t|larsen)/i;
    if (KNOWN_COMPANIES.test(companyName.trim())) {
      greenFlags.push(`Company name matches a known major employer (${companyName}) — verify the URL is their official domain`);
      bonus += 5;
    }
  }
  // ── Compute final score ───────────────────────────────────────────────────
  // Base: 70 (neutral-positive), capped 0–100
  const rawScore = Math.max(0, Math.min(100, 70 - penalty + bonus));
  let summary;
  if (flags.length === 0) {
    summary = 'No red flags found by pattern analysis. Appears clean.';
  } else if (flags.length <= 2) {
    summary = `${flags.length} minor concern(s) detected. Proceed with caution.`;
  } else if (flags.length <= 4) {
    summary = `${flags.length} red flags detected. This posting shows multiple suspicious patterns.`;
  } else {
    summary = `${flags.length} red flags detected. HIGH RISK — strongly resembles a known scam/phishing pattern.`;
  }
  return { score: rawScore, flags, greenFlags, summary };
};
module.exports = { runHeuristicChecks };