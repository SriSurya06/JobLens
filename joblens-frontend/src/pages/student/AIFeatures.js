import React, { useState, useRef, useEffect } from 'react';
import { Sidebar, Topbar, FileUpload, toast } from '../../components/shared';
import { studentAPI } from '../../services/api';
// ── RESUME MATCH AI ────────
export function ResumeMatch() {
  const [jobDesc, setJobDesc]   = useState('');
  const [useProfile, setUseProfile] = useState(true);
  const [file, setFile]         = useState(null);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const analyze = async () => {
    if (!jobDesc.trim()) { toast('Paste a job description first','warning'); return; }
    setLoading(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append('jobDescription', jobDesc);
      fd.append('useProfileResume', useProfile);
      if (!useProfile && file) fd.append('resume', file);
      const res = await studentAPI.resumeMatch(fd);
      setResult(res.data.data);
    } catch(ex) {
      toast(ex.response?.data?.message || 'Analysis failed','danger');
    } finally { setLoading(false); }
  };
  const scoreColor = s => s >= 75 ? 'var(--success)' : s >= 50 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="app-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <Topbar title="Resume Match AI" />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">🤖 Resume–Job Match</h1>
              <p className="page-subtitle">AI analyzes your resume against a job description and gives you a fit score</p>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
            {/* Input */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="card">
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1rem', marginBottom:16 }}>Resume Source</h3>
                <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                  {[
                    { v:true,  l:'Use my profile resume' },
                    { v:false, l:'Upload a different resume' },
                  ].map(opt => (
                    <label key={String(opt.v)} style={{
                      flex:1, display:'flex', alignItems:'center', gap:8, cursor:'pointer',
                      padding:'10px 12px', borderRadius:'var(--radius)',
                      border:`1px solid ${useProfile===opt.v?'var(--brand)':'var(--border)'}`,
                      background: useProfile===opt.v?'var(--brand-bg)':'transparent',
                      color: useProfile===opt.v?'var(--brand)':'var(--text-secondary)',
                      fontSize:'0.85rem', fontWeight:600, transition:'all 0.15s'
                    }}>
                      <input type="radio" checked={useProfile===opt.v} onChange={() => setUseProfile(opt.v)} style={{ display:'none' }} />
                      {useProfile===opt.v?'●':'○'} {opt.l}
                    </label>
                  ))}
                </div>
                {!useProfile && (
                  <FileUpload label="Upload Resume (PDF)" accept=".pdf,.doc,.docx"
                    onChange={f => setFile(f)} hint="Will be used only for this analysis" />
                )}
              </div>

              <div className="card">
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1rem', marginBottom:12 }}>Job Description *</h3>
                <textarea className="form-textarea" rows={10} value={jobDesc}
                  onChange={e => setJobDesc(e.target.value)}
                  placeholder="Paste the full job description here...

Example:
We are looking for a Software Development Engineer with:
- 2+ years of experience in React.js
- Strong knowledge of Node.js and REST APIs
- Experience with MongoDB or PostgreSQL
- Good understanding of system design..." />
                <button className="btn btn-primary w-full" style={{ marginTop:12 }} onClick={analyze} disabled={loading}>
                  {loading ? <><span className="spinner"/> Analyzing...</> : '🤖 Analyze Match'}
                </button>
              </div>
            </div>
            {/* Result */}
            <div>
              {!result && !loading && (
                <div style={{ background:'var(--bg-elevated)', border:'2px dashed var(--border)', borderRadius:'var(--radius-xl)',
                  padding:'60px 24px', textAlign:'center', color:'var(--text-muted)' }}>
                  <div style={{ fontSize:'4rem', marginBottom:16 }}>🤖</div>
                  <div style={{ fontSize:'1rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:8 }}>AI Analysis Results</div>
                  <div style={{ fontSize:'0.85rem' }}>Paste a job description and click Analyze Match</div>
                </div>
              )}
              {loading && (
                <div className="card" style={{ textAlign:'center', padding:48 }}>
                  <div style={{ fontSize:'3rem', marginBottom:16 }}>⚙️</div>
                  <div style={{ fontWeight:600, marginBottom:8 }}>Analyzing your resume...</div>
                  <div className="spinner spinner-lg" style={{ margin:'0 auto' }} />
                </div>
              )}
              {result && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {/* Score */}
                  <div className="card" style={{ textAlign:'center' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:'5rem', fontWeight:900,
                      color:scoreColor(result.score), lineHeight:1, marginBottom:8 }}>
                      {result.score}%
                    </div>
                    <div style={{ fontSize:'1rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:8 }}>
                      {result.score>=75?'🎉 Excellent Match!':result.score>=50?'⚡ Good Match':result.score>=25?'⚠️ Partial Match':'❌ Low Match'}
                    </div>
                    <div style={{ width:'100%', height:12, background:'var(--bg-elevated)', borderRadius:6, overflow:'hidden', marginBottom:8 }}>
                      <div style={{ width:`${result.score}%`, height:'100%', background:scoreColor(result.score), transition:'width 1s ease', borderRadius:6 }} />
                    </div>
                    <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Job Fit Score</div>
                  </div>
                  {/* Matched skills */}
                  {result.matchedSkills?.length > 0 && (
                    <div className="card">
                      <div style={{ fontWeight:700, marginBottom:10, color:'var(--success)' }}>✓ Matching Skills</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {result.matchedSkills.map(s => (
                          <span key={s} style={{ background:'var(--success-bg)', color:'var(--success)', borderRadius:'var(--radius-sm)', padding:'3px 10px', fontSize:'0.8rem', fontWeight:600 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Missing skills */}
                  {result.missingSkills?.length > 0 && (
                    <div className="card">
                      <div style={{ fontWeight:700, marginBottom:10, color:'var(--danger)' }}>✕ Missing Skills</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {result.missingSkills.map(s => (
                          <span key={s} style={{ background:'var(--danger-bg)', color:'var(--danger)', borderRadius:'var(--radius-sm)', padding:'3px 10px', fontSize:'0.8rem', fontWeight:600 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Suggestions */}
                  {result.suggestions?.length > 0 && (
                    <div className="card">
                      <div style={{ fontWeight:700, marginBottom:10, color:'var(--brand)' }}>💡 Preparation Tips</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {result.suggestions.map((s,i) => (
                          <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                            <span style={{ color:'var(--brand)', fontWeight:700, flexShrink:0 }}>{i+1}.</span>
                            <span style={{ fontSize:'0.875rem', color:'var(--text-secondary)', lineHeight:1.6 }}>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.explanation && (
                    <div className="card">
                      <div style={{ fontWeight:700, marginBottom:8, color:'var(--info)' }}>🔍 AI Analysis</div>
                      <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)', lineHeight:1.7 }}>{result.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// JOB LINK GENERATOR
export function JobLinks() {
  const [form, setForm] = useState({ role:'', location:'', experience:'', skills:'', type:'fulltime' });
  const [links, setLinks] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!form.role) { toast('Enter a job role first','warning'); return; }
    setLoading(true); setLinks(null);
    try {
      const res = await studentAPI.generateJobLinks(form);
      setLinks(res.data.data);
    } catch(ex) {
      toast(ex.response?.data?.message || 'Generation failed','danger');
    } finally { setLoading(false); }
  };
  const platforms = [
    { key:'linkedin', label:'LinkedIn', icon:'💼', color:'#0077b5' },
    { key:'naukri',   label:'Naukri',   icon:'🔍', color:'#ff7555' },
    { key:'unstop',   label:'Unstop',   icon:'🏆', color:'#00b4d8' },
    { key:'indeed',   label:'Indeed',   icon:'🌐', color:'#2164f3' },
    { key:'internshala', label:'Internshala', icon:'🎓', color:'#ff6b6b' },
    { key:'glassdoor',   label:'Glassdoor',   icon:'🏢', color:'#0caa41' },
  ];
  return (
    <div className="app-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <Topbar title="Job Link Generator" />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">🔗 Job Link Generator</h1>
              <p className="page-subtitle">Generate platform-specific job search links instantly</p>
            </div>
          </div>
          <div style={{ maxWidth:720 }}>
            <div className="card" style={{ marginBottom:20 }}>
              <div className="form-row cols-2" style={{ marginBottom:16 }}>
                <div className="form-group">
                  <label className="form-label">Job Role *</label>
                  <input className="form-input" value={form.role}
                    onChange={e => setForm({...form,role:e.target.value})} placeholder="Software Engineer, Data Analyst..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" value={form.location}
                    onChange={e => setForm({...form,location:e.target.value})} placeholder="Hyderabad, Bangalore, Remote..." />
                </div>
              </div>
              <div className="form-row cols-2" style={{ marginBottom:16 }}>
                <div className="form-group">
                  <label className="form-label">Experience</label>
                  <select className="form-select" value={form.experience}
                    onChange={e => setForm({...form,experience:e.target.value})}>
                    <option value="">Any</option>
                    <option value="fresher">Fresher (0-1 yr)</option>
                    <option value="1-3">1-3 years</option>
                    <option value="3-5">3-5 years</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.type}
                    onChange={e => setForm({...form,type:e.target.value})}>
                    <option value="fulltime">Full Time</option>
                    <option value="internship">Internship</option>
                    <option value="parttime">Part Time</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom:16 }}>
                <label className="form-label">Key Skills (optional)</label>
                <input className="form-input" value={form.skills}
                  onChange={e => setForm({...form,skills:e.target.value})} placeholder="React, Python, SQL..." />
              </div>
              <button className="btn btn-primary btn-lg w-full" onClick={generate} disabled={loading}>
                {loading ? <><span className="spinner"/> Generating...</> : '🔗 Generate Job Links'}
              </button>
            </div>
            {links && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <h3 style={{ fontFamily:'var(--font-display)', marginBottom:4 }}>Generated Links</h3>
                {platforms.map(p => {
                  const url = links[p.key];
                  if (!url) return null;
                  return (
                    <div key={p.key} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
                      padding:'14px 16px', background:'var(--bg-elevated)',
                      borderRadius:'var(--radius)', border:'1px solid var(--border)'
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:'1.3rem' }}>{p.icon}</span>
                        <span style={{ fontWeight:700, color:p.color }}>{p.label}</span>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => { navigator.clipboard.writeText(url); toast('Copied!'); }}
                          className="btn btn-secondary btn-sm">📋 Copy</button>
                        <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                          → Open
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// FAKE JOB DETECTOR 
export function FakeJobDetector() {
  const [form, setForm] = useState({ companyName:'', jobLink:'', contactEmail:'', description:'' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const analyze = async () => {
    if (!form.companyName || !form.jobLink) { toast('Company name and job link required','warning'); return; }
    setLoading(true); setResult(null);
    // AI-powered analysis via Anthropic API
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a cybersecurity expert specializing in fake job detection. Analyze this job posting for fraud indicators.
Company: ${form.companyName}
Job Link: ${form.jobLink}
Contact Email: ${form.contactEmail || 'Not provided'}
Description: ${form.description || 'Not provided'}

Analyze and respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "riskScore": <0-100 number, higher = more suspicious>,
  "verdict": "<SAFE | SUSPICIOUS | LIKELY_FAKE>",
  "indicators": ["<red flag 1>", "<red flag 2>"],
  "safeSignals": ["<good sign 1>"],
  "explanation": "<2-3 sentence analysis>",
  "recommendations": ["<action 1>", "<action 2>"]
}`
          }]
        })
      });

      if (response.status === 401) {
        // Fallback: rule-based detection
        const r = ruleBasedDetection(form);
        setResult(r);
        return;
      }
      const data = await response.json();
      const text = data.content?.[0]?.text || '{}';
      try {
        setResult(JSON.parse(text.replace(/```json|```/g,'')));
      } catch {
        setResult(ruleBasedDetection(form));
      }
    } catch {
      setResult(ruleBasedDetection(form));
    } finally { setLoading(false); }
  };
  const ruleBasedDetection = (f) => {
    const redFlags = [];
    const safeSignals = [];
    let score = 0;
    // Email checks
    if (f.contactEmail) {
      const freeEmails = ['gmail','yahoo','hotmail','outlook'];
      if (freeEmails.some(e => f.contactEmail.includes(e+'.com'))) {
        redFlags.push('Contact email uses free provider (legitimate companies use official domains)');
        score += 25;
      } else { safeSignals.push('Official company email domain used'); }
    }
    // Link checks
    if (f.jobLink) {
      const knownJobSites = ['linkedin.com','naukri.com','indeed.com','glassdoor.com','careers.','jobs.'];
      const isKnown = knownJobSites.some(s => f.jobLink.includes(s));
      if (isKnown) { safeSignals.push('Job posted on reputable platform'); }
      else {
        if (!f.jobLink.startsWith('https://')) { redFlags.push('URL is not HTTPS – insecure connection'); score += 15; }
        const suspiciousWords = ['earn','money','urgent','immediate','no-experience','work-from-home-earn'];
        if (suspiciousWords.some(w => f.jobLink.toLowerCase().includes(w))) {
          redFlags.push('URL contains suspicious keywords'); score += 20;
        }
      }
    }
    // Description checks
    if (f.description) {
      const desc = f.description.toLowerCase();
      if (desc.includes('pay') && desc.includes('register')) { redFlags.push('Requires upfront payment to register'); score += 35; }
      if (desc.includes('guaranteed') && desc.includes('earn')) { redFlags.push('Makes unrealistic earning guarantees'); score += 30; }
      if (desc.includes('no experience') || desc.includes('no qualification')) { redFlags.push('Claims no experience or qualification required for technical role'); score += 20; }
    }
    score = Math.min(score, 100);
    return {
      riskScore: score,
      verdict: score >= 60 ? 'LIKELY_FAKE' : score >= 30 ? 'SUSPICIOUS' : 'SAFE',
      indicators: redFlags,
      safeSignals: safeSignals,
      explanation: `Rule-based analysis detected ${redFlags.length} red flag(s). ${score >= 60 ? 'This posting shows multiple signs of fraudulent activity.' : score >= 30 ? 'Some suspicious signals detected. Proceed with caution.' : 'No major red flags detected, but always verify independently.'}`,
      recommendations: [
        'Verify the company on official business registries',
        'Never pay fees to apply for a job',
        'Check company reviews on Glassdoor or Ambitionbox',
        'Contact the company directly through their official website'
      ]
    };
  };
  const verdictStyle = v => ({
    'SAFE':        { color:'var(--success)', bg:'var(--success-bg)', icon:'✅', label:'SAFE' },
    'SUSPICIOUS':  { color:'var(--warning)', bg:'var(--warning-bg)', icon:'⚠️', label:'SUSPICIOUS' },
    'LIKELY_FAKE': { color:'var(--danger)',  bg:'var(--danger-bg)',  icon:'🚨', label:'LIKELY FAKE' },
  }[v] || { color:'var(--text-muted)', bg:'var(--bg-elevated)', icon:'❓', label:v });
  return (
    <div className="app-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <Topbar title="Fake Job Detector" />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">🛡️ Fake Job Detector</h1>
              <p className="page-subtitle">AI-powered cybersecurity analysis to detect fraudulent job postings</p>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
            <div className="card">
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ padding:'12px 16px', background:'var(--danger-bg)', borderRadius:'var(--radius)', border:'1px solid var(--danger)', fontSize:'0.85rem', color:'var(--danger)' }}>
                  🛡️ <strong>Cybersecurity Feature:</strong> Protects students from placement fraud. Never pay fees to apply for a job.
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input className="form-input" value={form.companyName}
                    onChange={e => setForm({...form,companyName:e.target.value})} placeholder="Enter company name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Link *</label>
                  <input className="form-input" type="url" value={form.jobLink}
                    onChange={e => setForm({...form,jobLink:e.target.value})} placeholder="https://apply.company.com/..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email (if provided)</label>
                  <input className="form-input" type="email" value={form.contactEmail}
                    onChange={e => setForm({...form,contactEmail:e.target.value})} placeholder="recruiter@company.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Description (paste any part)</label>
                  <textarea className="form-textarea" rows={5} value={form.description}
                    onChange={e => setForm({...form,description:e.target.value})}
                    placeholder="Paste suspicious parts of the job description..." />
                </div>
                <button className="btn btn-primary btn-lg" onClick={analyze} disabled={loading}>
                  {loading ? <><span className="spinner"/> Scanning...</> : '🛡️ Scan for Fraud'}
                </button>
              </div>
            </div>
            <div>
              {!result && !loading && (
                <div style={{ background:'var(--bg-elevated)', border:'2px dashed var(--border)', borderRadius:'var(--radius-xl)',
                  padding:'60px 24px', textAlign:'center', color:'var(--text-muted)' }}>
                  <div style={{ fontSize:'4rem', marginBottom:16 }}>🛡️</div>
                  <div style={{ fontSize:'1rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:8 }}>Fraud Analysis Result</div>
                  <div style={{ fontSize:'0.85rem' }}>Fill in job details and click Scan for Fraud</div>
                </div>
              )}
              {loading && (
                <div className="card" style={{ textAlign:'center', padding:48 }}>
                  <div style={{ fontSize:'3rem', marginBottom:16, animation:'pulse 1s infinite' }}>🔍</div>
                  <div style={{ fontWeight:600, marginBottom:16 }}>Scanning for fraud signals...</div>
                  <div className="spinner spinner-lg" style={{ margin:'0 auto' }} />
                </div>
              )}
              {result && (() => {
                const vs = verdictStyle(result.verdict);
                return (
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {/* Verdict */}
                    <div style={{ background:vs.bg, border:`2px solid ${vs.color}`, borderRadius:'var(--radius-lg)', padding:'24px', textAlign:'center' }}>
                      <div style={{ fontSize:'3rem', marginBottom:8 }}>{vs.icon}</div>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:'1.75rem', fontWeight:900, color:vs.color }}>{vs.label}</div>
                      <div style={{ marginTop:12, width:'100%', height:12, background:'rgba(0,0,0,0.1)', borderRadius:6, overflow:'hidden' }}>
                        <div style={{ width:`${result.riskScore}%`, height:'100%', background:vs.color, borderRadius:6 }} />
                      </div>
                      <div style={{ marginTop:6, fontSize:'0.85rem', color:vs.color, fontWeight:700 }}>
                        Risk Score: {result.riskScore}/100
                      </div>
                    </div>
                    {/* Explanation */}
                    <div className="card">
                      <div style={{ fontWeight:700, marginBottom:8 }}>🔍 Analysis</div>
                      <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)', lineHeight:1.7 }}>{result.explanation}</p>
                    </div>
                    {/* Red Flags */}
                    {result.indicators?.length > 0 && (
                      <div className="card">
                        <div style={{ fontWeight:700, color:'var(--danger)', marginBottom:10 }}>🚩 Red Flags Detected</div>
                        {result.indicators.map((f,i) => (
                          <div key={i} style={{ display:'flex', gap:8, marginBottom:6, fontSize:'0.875rem', color:'var(--text-secondary)' }}>
                            <span style={{ color:'var(--danger)', fontWeight:700, flexShrink:0 }}>✕</span>
                            {f}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Safe Signals */}
                    {result.safeSignals?.length > 0 && (
                      <div className="card">
                        <div style={{ fontWeight:700, color:'var(--success)', marginBottom:10 }}>✅ Safe Signals</div>
                        {result.safeSignals.map((s,i) => (
                          <div key={i} style={{ display:'flex', gap:8, marginBottom:6, fontSize:'0.875rem', color:'var(--text-secondary)' }}>
                            <span style={{ color:'var(--success)', fontWeight:700, flexShrink:0 }}>✓</span>
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Recommendations */}
                    {result.recommendations?.length > 0 && (
                      <div className="card">
                        <div style={{ fontWeight:700, color:'var(--info)', marginBottom:10 }}>💡 What You Should Do</div>
                        {result.recommendations.map((r,i) => (
                          <div key={i} style={{ display:'flex', gap:8, marginBottom:6, fontSize:'0.875rem', color:'var(--text-secondary)' }}>
                            <span style={{ color:'var(--info)', fontWeight:700, flexShrink:0 }}>{i+1}.</span>
                            {r}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// DRIVE CHATBOT
export function DriveChatbot({ drives = [] }) {
  const [open, setOpen]       = useState(false);
  const [messages, setMsgs]   = useState([
    { role:'bot', text:'Hi! 👋 I\'m your placement assistant. Ask me about drives, rounds, packages, or upcoming opportunities!' }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef();
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);
  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMsgs(p => [...p, { role:'user', text:userMsg }]);
    setLoading(true);
    try {
      const context = drives.length > 0
        ? `Current drives data: ${JSON.stringify(drives.slice(0,5).map(d => ({ company:d.companyName, package:`${d.minPackage}-${d.maxPackage} LPA`, status:d.status, deadline:d.registrationDeadline, cgpa:d.cgpaCutOff })))}`
        : 'No drive data available currently.';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          system: `You are a helpful campus placement assistant named PlaceMate. ${context}. Answer student questions about placement drives, round schedules, packages, eligibility, interview prep. Be concise and helpful. Use emojis sparingly.`,
          messages: [
            ...messages.filter(m=>m.role!=='bot'||messages.indexOf(m)>0).map(m => ({ role:m.role==='bot'?'assistant':'user', content:m.text })),
            { role:'user', content:userMsg }
          ]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const reply = data.content?.[0]?.text || "I couldn't process that. Please try again.";
        setMsgs(p => [...p, { role:'bot', text:reply }]);
      } else {
        setMsgs(p => [...p, { role:'bot', text:`I can help you with questions about placement drives, packages, rounds, and eligibility criteria! What would you like to know? 😊` }]);
      }
    } catch {
      setMsgs(p => [...p, { role:'bot', text:'Connection issue. Please check your internet and try again.' }]);
    } finally { setLoading(false); }
  };
  return (
    <div className="chatbot-container">
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span style={{ fontSize:'1.3rem' }}>🤖</span>
            <div>
              <div style={{ fontWeight:700, fontFamily:'var(--font-display)' }}>PlaceMate AI</div>
              <div style={{ fontSize:'0.75rem', opacity:0.8 }}>Placement Assistant</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background:'none',border:'none',color:'#fff',cursor:'pointer',marginLeft:'auto',fontSize:'1.1rem' }}>✕</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((m,i) => (
              <div key={i} className={`chat-msg ${m.role}`}>{m.text}</div>
            ))}
            {loading && <div className="chat-msg bot"><span className="spinner" /></div>}
            <div ref={bottomRef} />
          </div>
          <div className="chatbot-input-area">
            <input className="chatbot-input" value={input} placeholder="Ask about drives..."
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && send()} />
            <button className="btn btn-primary btn-sm" onClick={send} disabled={loading}>→</button>
          </div>
        </div>
      )}
      <button className="chatbot-btn" onClick={() => setOpen(!open)} title="PlaceMate AI Assistant">
        {open ? '✕' : '🤖'}
      </button>
    </div>
  );
}