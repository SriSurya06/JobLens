import React, { useState, useEffect } from 'react';
import { Sidebar, Topbar, StatusBadge, Modal, Spinner, EmptyState, toast } from '../../components/shared';
import { offCampusAPI } from '../../services/api';

const BRANCHES = ['CSE','ECE','EEE','MECH','CIVIL','IT','AIDS','AIML','DS'];
const BATCHES  = [2026,2027,2028,2029];

const OffCampusForm = ({ initial={}, onSubmit, loading }) => {
  const initialCategory = initial.driveCategory || initial.driveType || 'job';
  const [form, setForm] = useState({
    companyName:'', driveName:'', eligibleBatches:[], eligibleBranches:[],
    applyLink:'', appliedCount:'', selectedCount:'', description:'',
    lastDateToApply: '', driveCategory: initialCategory, ...initial,
    driveCategory: initial.driveCategory || initial.driveType || initialCategory,
  });
  const toggleArr = (field, val) => {
    setForm(p => ({ ...p, [field]: p[field].includes(val) ? p[field].filter(v=>v!==val) : [...p[field], val] }));
  };
  const submit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      driveCategory: form.driveCategory || form.driveType || 'job',
    };
    delete payload.driveType;
    onSubmit(payload);
  };
  return (
    <form onSubmit={submit}
      style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="form-row cols-2">
        <div className="form-group">
          <label className="form-label">Company Name *</label>
          <input className="form-input" required value={form.companyName}
            onChange={e => setForm({...form, companyName:e.target.value})} placeholder="Google, Amazon..." />
        </div>
        <div className="form-group">
          <label className="form-label">Drive Name *</label>
          <input className="form-input" required value={form.driveName}
            onChange={e => setForm({...form, driveName:e.target.value})} placeholder="SDE Internship 2025" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Drive Type</label>
        <div style={{ display:'flex', gap:8 }}>
          {['job','internship','hackathon'].map(t => (
            <label key={t} style={{
              display:'flex', alignItems:'center', gap:6, cursor:'pointer',
              padding:'7px 14px', borderRadius:'var(--radius)',
              border:`1px solid ${form.driveCategory===t?'var(--brand)':'var(--border)'}`,
              background: form.driveCategory===t?'var(--brand-bg)':'transparent',
              color: form.driveCategory===t?'var(--brand)':'var(--text-secondary)',
              fontSize:'0.875rem', fontWeight:600, textTransform:'capitalize', transition:'all 0.15s'
            }}>
              <input type="radio" checked={form.driveCategory===t} onChange={() => setForm({...form, driveCategory:t})} style={{ display:'none' }} />
              {t==='job'?'💼':t==='internship'?'🎓':'🏆'} {t}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Eligible Batches *</label>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {BATCHES.map(b => (
            <label key={b} style={{
              display:'flex', alignItems:'center', gap:6, cursor:'pointer',
              padding:'6px 12px', borderRadius:'var(--radius)',
              border:`1px solid ${form.eligibleBatches.includes(b)?'var(--brand)':'var(--border)'}`,
              background: form.eligibleBatches.includes(b)?'var(--brand-bg)':'transparent',
              color: form.eligibleBatches.includes(b)?'var(--brand)':'var(--text-secondary)',
              fontSize:'0.875rem', fontWeight:600, transition:'all 0.15s'
            }}>
              <input type="checkbox" checked={form.eligibleBatches.includes(b)}
                onChange={() => toggleArr('eligibleBatches', b)} style={{ display:'none' }} />
              {b}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Eligible Branches</label>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {BRANCHES.map(b => (
            <label key={b} style={{
              display:'flex', alignItems:'center', gap:6, cursor:'pointer',
              padding:'6px 12px', borderRadius:'var(--radius)',
              border:`1px solid ${form.eligibleBranches.includes(b)?'var(--brand)':'var(--border)'}`,
              background: form.eligibleBranches.includes(b)?'var(--brand-bg)':'transparent',
              color: form.eligibleBranches.includes(b)?'var(--brand)':'var(--text-secondary)',
              fontSize:'0.875rem', fontWeight:600, transition:'all 0.15s'
            }}>
              <input type="checkbox" checked={form.eligibleBranches.includes(b)}
                onChange={() => toggleArr('eligibleBranches', b)} style={{ display:'none' }} />
              {b}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Apply Link *</label>
        <input className="form-input" type="url" required value={form.applyLink}
          onChange={e => setForm({...form, applyLink:e.target.value})} placeholder="https://careers.company.com/..." />
      </div>

      <div className="form-group">
        <label className="form-label">Last Date to Apply</label>
        <input className="form-input" type="date" value={form.lastDateToApply || ''}
          onChange={e => setForm({...form, lastDateToApply:e.target.value})} />
      </div>

      <div className="form-row cols-2">
        <div className="form-group">
          <label className="form-label">Applied Count</label>
          <input className="form-input" type="number" min="0" value={form.appliedCount}
            onChange={e => setForm({...form, appliedCount:e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">Selected Count</label>
          <input className="form-input" type="number" min="0" value={form.selectedCount}
            onChange={e => setForm({...form, selectedCount:e.target.value})} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-textarea" rows={3} value={form.description}
          onChange={e => setForm({...form, description:e.target.value})}
          placeholder="Brief details about the drive, eligibility, stipend..." />
      </div>
      <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
        {loading ? <><span className="spinner"/> Saving...</> : '→ Save Drive'}
      </button>
    </form>
  );
};
const typeIcon = t => ({ job:'💼', internship:'🎓', hackathon:'🏆' }[t] || '🌐');
const typeColor = t => ({ job:'var(--brand)', internship:'var(--success)', hackathon:'var(--warning)' }[t] || 'var(--info)');
const getDriveCategory = (d) => d?.driveCategory || d?.driveType || 'job';
export default function OffCampusDrives() {
  const [drives, setDrives]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDrive, setEditDrive] = useState(null);
  const [formLoad, setFormLoad]  = useState(false);
  const [filterType, setFilterType] = useState('all');
  const load = () => {
    offCampusAPI.getAll().then(r => setDrives(r.data.data || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const createDrive = async (data) => {
    setFormLoad(true);
    try {
      await offCampusAPI.create(data);
      toast('Off-campus drive added!');
      setShowForm(false);
      load();
    } catch(ex) { toast(ex.response?.data?.message || 'Error', 'danger'); }
    finally { setFormLoad(false); }
  };
  const updateDrive = async (data) => {
    setFormLoad(true);
    try {
      await offCampusAPI.update(editDrive._id, data);
      toast('Drive updated!');
      setEditDrive(null);
      load();
    } catch(ex) { toast(ex.response?.data?.message || 'Error', 'danger'); }
    finally { setFormLoad(false); }
  };
  const deleteDrive = async (id) => {
    if (!window.confirm('Delete this drive?')) return;
    try {
      await offCampusAPI.delete(id);
      toast('Drive deleted');
      load();
    } catch { toast('Delete failed', 'danger'); }
  };
  const filtered = filterType === 'all' ? drives : drives.filter(d => (d.driveCategory || d.driveType) === filterType);
  return (
    <div className="app-layout">
      <Sidebar role="coordinator" />
      <div className="main-content">
        <Topbar title="Off-Campus Drives" />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Off-Campus Drives</h1>
              <p className="page-subtitle">Verified external drives — Jobs, Internships & Hackathons</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>＋ Add Drive</button>
          </div>
          {/* Filter Tabs */}
          <div style={{ display:'flex', gap:8, marginBottom:20 }}>
            {['all','job','internship','hackathon'].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`btn ${filterType===t?'btn-primary':'btn-secondary'} btn-sm`}
                style={{ textTransform:'capitalize' }}>
                {t==='all'?'🌐 All':typeIcon(t)+' '+t}
              </button>
            ))}
          </div>
          {loading ? <Spinner text="Loading drives..." /> :
           filtered.length === 0 ? (
            <EmptyState icon="🌐" title="No off-campus drives" msg="Add verified external drives for students."
              action={<button className="btn btn-primary" onClick={() => setShowForm(true)}>＋ Add Drive</button>} />
           ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:16 }}>
              {filtered.map(d => (
                <div key={d._id} className="drive-card">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:'1.2rem' }}>{typeIcon(getDriveCategory(d))}</span>
                        <span className="drive-company">{d.companyName}</span>
                      </div>
                      <div style={{ fontSize:'0.875rem', color:'var(--text-secondary)', marginTop:2 }}>{d.driveName}</div>
                    </div>
                    <span className="badge" style={{ background:`${typeColor(getDriveCategory(d))}20`, color:typeColor(getDriveCategory(d)) }}>
                      {getDriveCategory(d)}
                    </span>
                  </div>
                  <div className="drive-meta">
                    <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>📅 {d.eligibleBatches?.join(', ')}</span>
                    {d.eligibleBranches?.length > 0 && (
                      <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>🏫 {d.eligibleBranches.slice(0,3).join(', ')}{d.eligibleBranches.length>3?'...':''}</span>
                    )}
                  </div>
                  {(d.appliedCount || d.selectedCount) && (
                    <div style={{ display:'flex', gap:16, marginTop:12, padding:'8px 0', borderTop:'1px solid var(--border)' }}>
                      <div style={{ fontSize:'0.8rem' }}>
                        <span style={{ color:'var(--text-muted)' }}>Applied: </span>
                        <span style={{ fontWeight:700, color:'var(--text-primary)' }}>{d.appliedCount || 0}</span>
                      </div>
                      <div style={{ fontSize:'0.8rem' }}>
                        <span style={{ color:'var(--text-muted)' }}>Selected: </span>
                        <span style={{ fontWeight:700, color:'var(--success)' }}>{d.selectedCount || 0}</span>
                      </div>
                    </div>
                  )}
                  <div style={{ display:'flex', gap:8, marginTop:12 }}>
                    <a href={d.applyLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ flex:1 }}>
                      🔗 Apply Link
                    </a>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditDrive(d)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteDrive(d._id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Off-Campus Drive" size="lg">
        <OffCampusForm onSubmit={createDrive} loading={formLoad} />
      </Modal>
      <Modal open={!!editDrive} onClose={() => setEditDrive(null)} title="Edit Drive" size="lg">
        {editDrive && <OffCampusForm initial={editDrive} onSubmit={updateDrive} loading={formLoad} />}
      </Modal>
    </div>
  );
}