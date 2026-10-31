'use strict';
const axios = require('axios');
const GSB_ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';
// Trusted / Shady domain lists (mirrors heuristic.service for URL-only check)
const TRUSTED_JOB_DOMAINS = new Set([
  'linkedin.com', 'naukri.com', 'indeed.com', 'glassdoor.com', 'glassdoor.co.in',
  'internshala.com', 'unstop.com', 'foundit.in', 'hirist.tech', 'iimjobs.com',
  'tcs.com', 'infosys.com', 'wipro.com', 'accenture.com', 'hcltech.com',
  'cognizant.com', 'capgemini.com', 'ibm.com', 'microsoft.com', 'google.com',
  'amazon.com', 'amazon.in', 'flipkart.com', 'zoho.com', 'freshworks.com',
]);
const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'ow.ly', 'goo.gl', 'cutt.ly', 'rb.gy',
  'shorturl.at', 'is.gd', 'buff.ly',
]);
const SHADY_TLDS = new Set([
  '.xyz', '.top', '.click', '.loan', '.work', '.icu', '.gq', '.tk', '.ml',
  '.cf', '.ga', '.pw', '.rest', '.cyou', '.bar',
]);
const getDomain = (url) => {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    return new URL(normalized).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url;
  }
};
// Google Safe Browsing API call
const checkWithGoogleSafeBrowsing = async (url) => {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) return null; // Skip; caller will fallback
  try {
    const body = {
      client: { clientId: 'joblens-ccpdms', clientVersion: '1.0.0' },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }],
      },
    };
    const { data } = await axios.post(`${GSB_ENDPOINT}?key=${apiKey}`, body, { timeout: 6000 });
    const matches = data?.matches || [];
    return {
      flaggedByGoogle: matches.length > 0,
      threats: matches.map((m) => m.threatType),
    };
  } catch (err) {
    console.warn('[URLSafety] Google Safe Browsing failed:', err.message);
    return null;
  }
};
// Heuristic-only domain analysis (no external API)
const heuristicDomainCheck = (url, domain) => {
  const flags = [];
  const greenFlags = [];
  const tld = '.' + domain.split('.').pop();
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(domain);
  const isShortener = URL_SHORTENERS.has(domain);
  const isShadyTld = SHADY_TLDS.has(tld);
  const isTrusted = [...TRUSTED_JOB_DOMAINS].some((d) => domain === d || domain.endsWith('.' + d));
  const isMessaging = /wa\.me|t\.me|telegram\.me/i.test(url);
  if (isIp) flags.push('Job URL is a raw IP address — never used by legitimate companies');
  if (isShortener) flags.push(`Shortened URL (${domain}) hides the real destination — phishing risk`);
  if (isShadyTld) flags.push(`Domain uses suspicious TLD (${tld}) — commonly abused for scam sites`);
  if (isMessaging) flags.push('Link leads to a messaging app (WhatsApp/Telegram) — not a legitimate career portal');
  if ((domain.match(/\./g) || []).length > 3)
    flags.push('Unusual number of subdomains — may be impersonating a legitimate company');
  if (isTrusted) greenFlags.push(`Domain belongs to a known trusted platform or company (${domain})`);
  return { flags, greenFlags, isTrusted };
};
// Main Export
/**
 * Analyzes a URL for safety using Google Safe Browsing API and heuristics.
 * @param {string} url
 * @returns {{ safe: boolean, domain: string, threats: string[], flags: string[], greenFlags: string[], source: string }}
 */
const analyzeUrlSafety = async (url) => {
  if (!url) return null;
  const domain = getDomain(url);
  const { flags, greenFlags, isTrusted } = heuristicDomainCheck(url, domain);
  // Try Google Safe Browsing
  const gsbResult = await checkWithGoogleSafeBrowsing(
    url.startsWith('http') ? url : `https://${url}`
  );
  let safe = flags.length === 0;
  let threats = [];
  let source = 'heuristic';
  if (gsbResult) {
    source = 'google_safe_browsing';
    threats = gsbResult.threats;
    if (gsbResult.flaggedByGoogle) {
      safe = false;
      flags.push(`URL flagged by Google Safe Browsing: ${threats.join(', ')}`);
    } else if (isTrusted) {
      safe = true;
    }
    if (!gsbResult.flaggedByGoogle && flags.length === 0) {
      greenFlags.push('URL passed Google Safe Browsing check — no known threats detected');
    }
  }
  return { safe, domain, threats, flags, greenFlags, source };
};
module.exports = { analyzeUrlSafety };