import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { roundsAPI, onCampusAPI } from '../../services/api';
import { Card, Badge, Modal, LoadingPage, EmptyState, Spinner, Alert } from '../../components/ui';
import toast from 'react-hot-toast';
export default function RoundsPage() {
  const [params] = useSearchParams();
  const driveId = params.get('driveId');
  const company = params.get('company') || 'Drive';
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [uploadModal, setUploadModal] = useState(null); // { roundId, type }
  const fetchRounds = async () => {
    if (!driveId) return setLoading(false);
    setLoading(true);
    try {
      const res = await roundsAPI.getByDrive(driveId);
      setRounds(res.data.data || []);
    } catch { toast.error('Failed to load rounds'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchRounds(); }, [driveId]);
  if (!driveId) return (
    <EmptyState icon="🔍" title="No drive selected" description="Select a drive from the Drives page to manage its rounds" />
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>Round Management</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{company}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: '10px 20px', background: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}
        >+ Add Round</button>
      </div>
      {loading ? <LoadingPage /> : rounds.length === 0 ? (
        <EmptyState icon="🔄" title="No rounds yet" description="Create the first round for this drive" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {rounds.map(round => (
            <RoundCard
              key={round._id}
              round={round}
              onUpload={(type) => setUploadModal({ roundId: round._id, type })}
              onRefresh={fetchRounds}
            />
          ))}
        </div>
      )}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Round">
        <CreateRoundForm driveId={driveId} onSuccess={() => { setShowCreate(false); fetchRounds(); }} />
      </Modal>
      <Modal
        open={!!uploadModal}
        onClose={() => setUploadModal(null)}
        title={`Upload ${uploadModal?.type === 'eligible' ? 'Eligible' : uploadModal?.type === 'attended' ? 'Attended' : 'Qualified'} List`}
      >
        {uploadModal && (
          <ExcelUploadForm
            roundId={uploadModal.roundId}
            type={uploadModal.type}
            onSuccess={() => { setUploadModal(null); fetchRounds(); }}
          />
        )}
      </Modal>
    </div>
  );
}
function RoundCard({ round, onUpload, onRefresh }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ venue: round.venue, date: round.date?.split('T')[0] || '', description: round.description });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await roundsAPI.update(round._id, form);
      toast.success('Round updated');
      setEditMode(false);
      onRefresh();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };
  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', padding: '8px 12px', fontSize: '13px', width: '100%' };
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', fontWeight: 700 }}>
            {round.roundNumber}
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700 }}>{round.roundName}</h3>
            {round.isFinalRound && <Badge variant="success" size="sm">Final Round</Badge>}
          </div>
        </div>
        <button onClick={() => setEditMode(!editMode)} style={{ padding: '6px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
          {editMode ? 'Cancel' : 'Edit Details'}
        </button>
      </div>
      {editMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <input style={inputStyle} placeholder="Venue" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} />
          <input type="date" style={inputStyle} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <button onClick={save} disabled={saving} style={{ padding: '9px', background: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {round.venue && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📍 {round.venue}</span>}
          {round.date && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📅 {new Date(round.date).toLocaleDateString()}</span>}
          {round.description && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📝 {round.description}</span>}
        </div>
      )}
      {/* Upload Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[
          { key: 'eligible', label: 'Eligible List', count: round.eligibleList?.rollNumbers?.length, sent: round.eligibleEmailSent, color: 'var(--accent-primary)' },
          { key: 'attended', label: 'Attended List', count: round.attendedList?.rollNumbers?.length, color: 'var(--accent-orange)' },
          { key: 'qualified', label: 'Qualified List', count: round.qualifiedList?.rollNumbers?.length, sent: round.resultEmailSent, color: 'var(--accent-green)' },
        ].map(item => (
          <div
            key={item.key}
            style={{
              padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px',
              border: `1px solid ${item.count ? `${item.color}30` : 'var(--border)'}`,
              cursor: 'pointer', transition: 'var(--transition)',
            }}
            onClick={() => onUpload(item.key)}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
            {item.count ? (
              <>
                <div style={{ fontSize: '18px', fontWeight: 700, color: item.color, fontFamily: 'var(--font-display)' }}>{item.count}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>students</div>
                {item.sent && <div style={{ fontSize: '10px', color: item.color, marginTop: '2px' }}>✉ Emails sent</div>}
              </>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Click to upload</div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
function CreateRoundForm({ driveId, onSuccess }) {
  const [form, setForm] = useState({ roundName: '', venue: '', description: '', date: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.roundName) return toast.error('Round name is required');
    setLoading(true);
    try {
      await roundsAPI.create({ driveId, ...form });
      toast.success('Round created!');
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };
  const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: '10px 14px', fontSize: '14px' };
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>Round Name *</label>
        <input style={inputStyle} placeholder="e.g. Aptitude Test, Technical Interview" value={form.roundName} onChange={e => setForm({ ...form, roundName: e.target.value })} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>Venue</label>
        <input style={inputStyle} placeholder="e.g. Seminar Hall Block A" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>Date</label>
        <input type="date" style={inputStyle} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>Description</label>
        <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
      <button type="submit" disabled={loading}
        style={{ padding: '12px', background: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
        {loading ? 'Creating...' : 'Create Round'}
      </button>
    </form>
  );
}
function ExcelUploadForm({ roundId, type, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isFinal, setIsFinal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return toast.error('Please select an Excel file');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (type === 'qualified') fd.append('isFinalRound', String(isFinal));

      if (type === 'eligible') await roundsAPI.uploadEligible(roundId, fd);
      if (type === 'attended') await roundsAPI.uploadAttended(roundId, fd);
      if (type === 'qualified') await roundsAPI.uploadQualified(roundId, fd);

      toast.success(`${type} list uploaded! Emails dispatched.`);
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Alert type="info">
        Excel must have a column named <strong>RollNumber</strong> (or "Roll No" / "roll_number")
      </Alert>
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
          Select Excel File (.xlsx / .xls)
        </label>
        <input
          type="file" accept=".xlsx,.xls"
          onChange={e => setFile(e.target.files[0])}
          style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: '10px' }}
        />
        {file && <p style={{ fontSize: '12px', color: 'var(--accent-green)', marginTop: '6px' }}>✓ {file.name}</p>}
      </div>
      {type === 'qualified' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: `1px solid ${isFinal ? 'rgba(255,71,87,0.3)' : 'var(--border)'}` }}>
          <input type="checkbox" checked={isFinal} onChange={e => setIsFinal(e.target.checked)} />
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: isFinal ? 'var(--accent-red)' : 'var(--text-primary)' }}>This is the Final Round</span>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Final results will complete the drive.</p>
          </div>
        </label>
      )}
      <button
        onClick={handleUpload} disabled={loading || !file}
        style={{ padding: '12px', background: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700, cursor: loading || !file ? 'not-allowed' : 'pointer', opacity: loading || !file ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        {loading && <Spinner size={16} color="var(--bg-primary)" />}
        {loading ? 'Uploading & Processing...' : 'Upload & Process'}
      </button>
    </div>
  );
}