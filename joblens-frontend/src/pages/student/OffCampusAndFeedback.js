import React, { useState, useEffect } from 'react';
import { Sidebar, Topbar, Spinner, EmptyState, Modal, toast } from '../../components/shared';
import { studentAPI, feedbackAPI } from '../../services/api';
const typeIcon = t => ({ job: '💼', internship: '🎓', hackathon: '🏆' }[t] || '🌐');
const typeColor = t => ({ job: 'var(--brand)', internship: 'var(--success)', hackathon: 'var(--warning)' }[t] || 'var(--info)');
export function StudentOffCampus() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  useEffect(() => {
    studentAPI.getOffCampus()
      .then(r => setDrives(r.data.data || []))
      .catch(() => setDrives([]))
      .finally(() => setLoading(false));
  }, []);
  const filtered = filter === 'all' ? drives : drives.filter(d => d.driveType === filter);
  return (
    <div className="app-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <Topbar title="Off-Campus Drives" />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Off-Campus Drives</h1>
              <p className="page-subtitle">Verified external opportunities curated by your placement team</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['all', 'job', 'internship', 'hackathon'].map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`btn ${filter === t ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                style={{ textTransform: 'capitalize' }}>
                {t === 'all' ? '🌐 All' : typeIcon(t) + ' ' + t}
              </button>
            ))}
          </div>
          {loading ? <Spinner text="Loading drives..." /> :
            filtered.length === 0 ? (
              <EmptyState icon="🌐" title="No off-campus drives" msg="Check back later for new opportunities." />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px,1fr))', gap: 16 }}>
                {filtered.map(d => (
                  <div key={d._id} className="drive-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1.3rem' }}>{typeIcon(d.driveType)}</span>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>{d.companyName}</span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 3 }}>{d.driveName}</div>
                      </div>
                      <span className="badge" style={{ background: `${typeColor(d.driveType)}20`, color: typeColor(d.driveType), textTransform: 'capitalize' }}>
                        {d.driveType}
                      </span>
                    </div>
                    {d.description && (
                      <p style={{
                        fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5,
                        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                      }}>
                        {d.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {(d.eligibleBatches || []).map(b => (
                        <span key={b} className="badge badge-muted">{b}</span>
                      ))}
                      {(d.eligibleBranches || []).slice(0, 3).map(b => (
                        <span key={b} className="badge badge-info">{b}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a href={d.applyLink} target="_blank" rel="noreferrer"
                        className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                        🔗 Apply Now
                      </a>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {d.appliedCount != null && <span>Applied: <strong style={{ color: 'var(--text-primary)' }}>{d.appliedCount}</strong></span>}
                      {d.selectedCount != null && <span>Selected: <strong style={{ color: 'var(--success)' }}>{d.selectedCount}</strong></span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
//FEEDBACK
export function CompanyFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCo, setSelectedCo] = useState('');
  const [form, setForm] = useState({ companyName: '', role: '', rounds: [''], challenges: '' });
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    feedbackAPI.getAll()
      .then(r => {
        const fb = r.data.data || [];
        setFeedbacks(fb);
        const cos = [...new Set(fb.map(f => f.companyName).filter(Boolean))];
        setCompanies(cos);
        if (cos.length) setSelectedCo(cos[0]);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);
  const displayedFeedbacks = selectedCo
    ? feedbacks.filter(f => f.companyName === selectedCo)
    : feedbacks;
  const submitFeedback = async e => {
    e.preventDefault();
    if (!form.companyName || !form.role) { toast('Company and role required', 'warning'); return; }
    setSubmitting(true);
    try {
      await feedbackAPI.submit(form);
      toast('Feedback submitted anonymously!');
      setShowForm(false);
      setForm({ companyName: '', role: '', rounds: [''], challenges: '' });
      feedbackAPI.getAll().then(r => setFeedbacks(r.data.data || []));
    } catch (ex) { toast(ex.response?.data?.message || 'Submit failed', 'danger'); }
    finally { setSubmitting(false); }
  };
  return (
    <div className="app-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <Topbar title="Company Feedback" />
        <div className="page-body">

          <div className="page-header">
            <div>
              <h1 className="page-title">Company Feedback</h1>
              <p className="page-subtitle">Anonymous experiences shared by seniors and peers</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              ＋ Share Experience
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
            {/* Company list sidebar */}
            <div className="card" style={{ height: 'fit-content', padding: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, padding: '0 8px' }}>
                Companies
              </div>
              {loading ? <Spinner /> : companies.length === 0 ? (
                <div style={{ padding: '20px 8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No feedback yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {companies.map(co => (
                    <button key={co} onClick={() => setSelectedCo(co)}
                      style={{
                        padding: '8px 10px', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
                        background: selectedCo === co ? 'var(--brand-bg)' : 'transparent',
                        color: selectedCo === co ? 'var(--brand)' : 'var(--text-secondary)',
                        fontWeight: selectedCo === co ? 700 : 500, textAlign: 'left', fontSize: '0.875rem',
                        transition: 'all 0.15s'
                      }}>
                      🏢 {co}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Feedback cards */}
            <div>
              {loading ? <Spinner text="Loading feedback..." /> :
                displayedFeedbacks.length === 0 ? (
                  <EmptyState icon="💬" title="No feedback yet"
                    msg="Be the first to share your experience."
                    action={<button className="btn btn-primary" onClick={() => setShowForm(true)}>＋ Share Experience</button>} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {displayedFeedbacks.map((f, i) => (
                      <div key={f._id || i} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{f.companyName}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f.role}</div>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        {(f.rounds || []).length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Round Details
                            </div>
                            {f.rounds.map((r, ri) => (
                              <div key={ri} style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>Round {ri + 1}:</strong> {r}
                              </div>
                            ))}
                          </div>
                        )}
                        {f.challenges && (
                          <div style={{ padding: '10px 12px', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--warning)' }}>
                            <strong style={{ color: 'var(--warning)' }}>Challenges: </strong>{f.challenges}
                          </div>
                        )}
                        <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          🔒 Submitted anonymously
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
          {/* Feedback Form Modal */}
          <Modal open={showForm} onClose={() => setShowForm(false)} title="Share Your Experience" size="lg">
            <form onSubmit={submitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input className="form-input" required value={form.companyName}
                    onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="TCS, Infosys..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <input className="form-input" required value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })} placeholder="SDE, Analyst..." />
                </div>
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label">Round Details</label>
                  <button type="button" className="btn btn-ghost btn-sm"
                    onClick={() => setForm({ ...form, rounds: [...form.rounds, ''] })}>
                    ＋ Add Round
                  </button>
                </div>
                {form.rounds.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input className="form-input" value={r} placeholder={`Round ${i + 1} description...`}
                      onChange={e => { const rs = [...form.rounds]; rs[i] = e.target.value; setForm({ ...form, rounds: rs }); }} />
                    {form.rounds.length > 1 && (
                      <button type="button" className="btn btn-ghost btn-sm"
                        onClick={() => setForm({ ...form, rounds: form.rounds.filter((_, ri) => ri !== i) })}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">Challenges Faced</label>
                <textarea className="form-textarea" rows={3} value={form.challenges}
                  onChange={e => setForm({ ...form, challenges: e.target.value })}
                  placeholder="What was hard? Any advice for future students?" />
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--info-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--info)', fontSize: '0.8rem', color: 'var(--info)' }}>
                🔒 Your feedback will be submitted anonymously. Your identity will not be revealed.
              </div>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? <><span className="spinner" /> Submitting...</> : '→ Submit Feedback'}
              </button>
            </form>
          </Modal>
        </div>
      </div>
    </div>
  );
}