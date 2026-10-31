import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Topbar, StatusBadge, Modal, Alert, Spinner, EmptyState, FileUpload, toast } from '../../components/shared';
import { onCampusAPI, roundAPI } from '../../services/api';

const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'DS'];
const BATCHES = [2026, 2027, 2028, 2029];
const DriveForm = ({ initial = {}, onSubmit, loading }) => {
  const [form, setForm] = useState({
    companyName: '', eligibleBatches: [], eligibleBranches: [], cgpaCutOff: '', backlogsAllowed: '0',
    description: '', minPackage: '', maxPackage: '', registrationDeadline: '',
    registrationLink: '', status: 'active', ...initial
  });
  const [file, setFile] = useState(null);
  const toggleArr = (field, val) => {
    setForm(p => ({ ...p, [field]: p[field].includes(val) ? p[field].filter(v => v !== val) : [...p[field], val] }));
  };
  const submit = e => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach(item => fd.append(k, item));
      else if (v !== '') fd.append(k, v);
    });
    if (file) fd.append('document', file);
    onSubmit(fd);
  };
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-row cols-2">
        <div className="form-group">
          <label className="form-label">Company Name *</label>
          <input className="form-input" required value={form.companyName}
            onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="e.g. TCS, Infosys" />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Eligible Batches *</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {BATCHES.map(b => (
            <label key={b} style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              padding: '6px 12px', borderRadius: 'var(--radius)', border: `1px solid ${form.eligibleBatches.includes(b) ? 'var(--brand)' : 'var(--border)'}`,
              background: form.eligibleBatches.includes(b) ? 'var(--brand-bg)' : 'transparent',
              color: form.eligibleBatches.includes(b) ? 'var(--brand)' : 'var(--text-secondary)',
              fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.15s'
            }}>
              <input type="checkbox" checked={form.eligibleBatches.includes(b)}
                onChange={() => toggleArr('eligibleBatches', b)} style={{ display: 'none' }} />
              {b}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Eligible Branches *</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {BRANCHES.map(b => (
            <label key={b} style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              padding: '6px 12px', borderRadius: 'var(--radius)', border: `1px solid ${form.eligibleBranches.includes(b) ? 'var(--brand)' : 'var(--border)'}`,
              background: form.eligibleBranches.includes(b) ? 'var(--brand-bg)' : 'transparent',
              color: form.eligibleBranches.includes(b) ? 'var(--brand)' : 'var(--text-secondary)',
              fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.15s'
            }}>
              <input type="checkbox" checked={form.eligibleBranches.includes(b)}
                onChange={() => toggleArr('eligibleBranches', b)} style={{ display: 'none' }} />
              {b}
            </label>
          ))}
        </div>
      </div>
      <div className="form-row cols-3">
        <div className="form-group">
          <label className="form-label">CGPA Cut-off *</label>
          <input className="form-input" type="number" min="0" max="10" step="0.1" required
            value={form.cgpaCutOff} onChange={e => setForm({ ...form, cgpaCutOff: e.target.value })} placeholder="6.5" />
        </div>
        <div className="form-group">
          <label className="form-label">Backlogs Allowed</label>
          <input className="form-input" type="number" min="0"
            value={form.backlogsAllowed} onChange={e => setForm({ ...form, backlogsAllowed: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Registration Deadline</label>
          <input className="form-input" type="date"
            value={form.registrationDeadline} onChange={e => setForm({ ...form, registrationDeadline: e.target.value })} />
        </div>
      </div>
      <div className="form-row cols-2">
        <div className="form-group">
          <label className="form-label">Min Package (LPA)</label>
          <input className="form-input" type="number" min="0" step="0.5"
            value={form.minPackage} onChange={e => setForm({ ...form, minPackage: e.target.value })} placeholder="3.5" />
        </div>
        <div className="form-group">
          <label className="form-label">Max Package (LPA)</label>
          <input className="form-input" type="number" min="0" step="0.5"
            value={form.maxPackage} onChange={e => setForm({ ...form, maxPackage: e.target.value })} placeholder="12" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Registration Link</label>
        <input className="form-input" type="url"
          value={form.registrationLink} onChange={e => setForm({ ...form, registrationLink: e.target.value })} placeholder="https://..." />
      </div>
      <div className="form-group">
        <label className="form-label">Drive Description</label>
        <textarea className="form-textarea" rows={4}
          value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Describe the drive, job role, required skills..." />
      </div>
      <FileUpload label="Upload JD / Offer Letter (PDF/Doc)" accept=".pdf,.doc,.docx"
        onChange={f => setFile(f)} hint="Optional - Max 10MB" />
      <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
        {loading ? <><span className="spinner" /> Saving...</> : '→ Save Drive'}
      </button>
    </form>
  );
};
const RoundModal = ({ driveId, onClose }) => {
  const [form, setForm] = useState({ roundName: '', venue: '', date: '', description: '', driveId });
  const [loading, setLoad] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setLoad(true);
    try {
      await roundAPI.create({ ...form, driveId });
      toast('Round created!');
      onClose(true);
    } catch (ex) { toast(ex.response?.data?.message || 'Error', 'danger'); }
    finally { setLoad(false); }
  };
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-row cols-2">
        <div className="form-group">
          <label className="form-label">Round Name *</label>
          <input className="form-input" required value={form.roundName}
            onChange={e => setForm({ ...form, roundName: e.target.value })} placeholder="Online Test / Interview" />
        </div>
        <div className="form-group">
          <label className="form-label">Venue</label>
          <input className="form-input" value={form.venue}
            onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="Hall A / Online" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Date & Time</label>
        <input className="form-input" type="datetime-local" value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-textarea" rows={3} value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? <><span className="spinner" /> Creating...</> : '→ Create Round'}
      </button>
    </form>
  );
};
export default function OnCampusDrives() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDrive, setEditDrive] = useState(null);
  const [selected, setSelected] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [showRound, setShowRound] = useState(false);
  const [formLoad, setFormLoad] = useState(false);
  const navigate = useNavigate();
  const load = () => {
    onCampusAPI.getAll().then(r => setDrives(r.data.data || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const loadRounds = async (driveId) => {
    try {
      const r = await roundAPI.getByDrive(driveId);
      setRounds(r.data.data || []);
    } catch { setRounds([]); }
  };
  const createDrive = async (fd) => {
    setFormLoad(true);
    try {
      await onCampusAPI.create(fd);
      toast('Drive created successfully!');
      setShowForm(false);
      load();
    } catch (ex) { toast(ex.response?.data?.message || 'Error creating drive', 'danger'); }
    finally { setFormLoad(false); }
  };
  const selectDrive = d => {
    setSelected(d);
    loadRounds(d._id);
  };
  return (
    <div className="app-layout">
      <Sidebar role="coordinator" />
      <div className="main-content">
        <Topbar title="On-Campus Drives" />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">On-Campus Drives</h1>
              <p className="page-subtitle">Manage all on-campus recruitment drives</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>＋ New Drive</button>
          </div>
          {loading ? <Spinner text="Loading drives..." /> :
            drives.length === 0 ? <EmptyState icon="🏢" title="No drives yet" msg="Create your first on-campus drive." action={<button className="btn btn-primary" onClick={() => setShowForm(true)}>＋ Create Drive</button>} /> :
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 16 }}>
                {drives.map(d => (
                  <div key={d._id} className="drive-card" onClick={() => selectDrive(d)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div className="drive-company">{d.companyName}</div>
                      <StatusBadge status={d.status} />
                    </div>

                    <div className="drive-meta">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📅 Batches: {d.eligibleBatches?.join(', ')}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🎓 CGPA ≥ {d.cgpaCutOff}</span>
                      {d.maxPackage && <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>💰 {d.minPackage}–{d.maxPackage} LPA</span>}
                    </div>

                    {d.selectionRatio && (
                      <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                        ✓ Final: {d.selectionRatio} selected
                      </div>
                    )}

                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); setEditDrive(d); }}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); selectDrive(d); }}>
                        👁️ View Rounds
                      </button>
                    </div>
                  </div>
                ))}
              </div>}

        </div>
      </div>

      {/* Create Drive Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create On-Campus Drive" size="lg">
        <DriveForm onSubmit={createDrive} loading={formLoad} />
      </Modal>

      {/* Drive Detail / Rounds Modal */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected.companyName} size="lg">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <StatusBadge status={selected.status} />
            {selected.maxPackage && <span className="badge badge-success">💰 {selected.minPackage}–{selected.maxPackage} LPA</span>}
            <span className="badge badge-info">🎓 CGPA ≥ {selected.cgpaCutOff}</span>
          </div>

          {selected.description && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20, lineHeight: 1.7 }}>
              {selected.description}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Rounds ({rounds.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowRound(true)}>＋ Add Round</button>
          </div>

          {rounds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No rounds yet. Add the first round.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rounds.map((r, i) => (
                <div key={r._id} style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Round {i + 1}: {r.roundName}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.date ? new Date(r.date).toLocaleString() : 'Date TBD'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                    📍 {r.venue || 'Venue TBD'} · {r.description}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      { label: `Eligible: ${r.eligibleList?.length || 0}`, col: 'var(--info)' },
                      { label: `Attended: ${r.attendedList?.length || 0}`, col: 'var(--warning)' },
                      { label: `Qualified: ${r.qualifiedList?.length || 0}`, col: 'var(--success)' },
                    ].map(s => (
                      <span key={s.label} style={{ fontSize: '0.75rem', color: s.col, fontWeight: 600 }}>{s.label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Add Round Modal */}
      {showRound && selected && (
        <Modal open={showRound} onClose={() => setShowRound(false)} title={`Add Round — ${selected.companyName}`}>
          <RoundModal driveId={selected._id} onClose={(reload) => { setShowRound(false); if (reload) loadRounds(selected._id); }} />
        </Modal>
      )}
    </div>
  );
}