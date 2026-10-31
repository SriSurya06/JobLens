import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Globe2,
  Circle,
  Eye,
  Pencil,
  Plus,
  Layers3,
   Upload,
} from 'lucide-react';
import { onCampusAPI, offCampusAPI, roundsAPI } from '../../services/api';
import { Card, Badge, Button, Modal, Input, Select, Textarea, Tabs, Table, Tr, Td, EmptyState, LoadingPage, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';

const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'DS'];
const BATCHES = [2026, 2027, 2028, 2029];

function statusBadge(drive) {
  if (drive.status === 'active') {
    return (
      <Badge variant="primary">
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Circle size={9} fill="currentColor" strokeWidth={0} />
          Active
        </span>
      </Badge>
    );
  }

  return <Badge variant="default">{drive.status}</Badge>;
}
export default function CoordinatorDrives() {
  const [tab, setTab] = useState('oncampus');
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
 const [showForm, setShowForm] = useState(false);
const [selected, setSelected] = useState(null);
const [showDetails, setShowDetails] = useState(false);
const [detailsDrive, setDetailsDrive] = useState(null);
const [showRoundForm, setShowRoundForm] = useState(false);
const [roundDrive, setRoundDrive] = useState(null);

const [showRoundEdit, setShowRoundEdit] = useState(false);
const [editingRound, setEditingRound] = useState(null);
const [showResultUpload, setShowResultUpload] = useState(false);
const [resultRound, setResultRound] = useState(null);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const batchFilter = params.get('batch') || '';

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = tab === 'oncampus'
        ? await onCampusAPI.getAll({ batch: batchFilter, limit: 50 })
        : await offCampusAPI.getAll({ batch: batchFilter, limit: 50 });
      setDrives(res.data.data.drives || []);
    } catch { toast.error('Failed to fetch drives'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDrives(); }, [tab, batchFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>Drive Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            {batchFilter ? `Batch ${batchFilter}` : 'All Batches'}
          </p>
        </div>
        <Button
          onClick={() => { setSelected(null); setShowForm(true); }}
          style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)', padding: '10px 20px', borderRadius: 'var(--radius)', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          + New Drive
        </Button>
      </div>

      <Tabs
  tabs={[
    {
      value: 'oncampus',
      label: (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
          }}
        >
          <Building2 size={16} strokeWidth={2} />
          On-Campus
        </span>
      ),
    },
    {
      value: 'offcampus',
      label: (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
          }}
        >
          <Globe2 size={16} strokeWidth={2} />
          Off-Campus
        </span>
      ),
    },
  ]}
  active={tab}
  onChange={setTab}
/>

      {loading ? <LoadingPage /> : (
        drives.length === 0 ? (
          <EmptyState icon={<Building2 size={22} strokeWidth={2} />} title="No drives yet" description="Create the first drive for students" action={<Button onClick={() => setShowForm(true)} style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)', padding: '10px 20px', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 600 }}>+ Create Drive</Button>} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {drives.map(drive => (
     <DriveCard
  key={drive._id}
  drive={drive}
  type={tab}
  onEdit={() => {
    setSelected(drive);
    setShowForm(true);
  }}
  onReopen={async () => {
    try {
      const form = new FormData();
      form.append('status', 'active');
      await onCampusAPI.update(drive._id, form);
      toast.success('Drive reopened and moved to Active');
      fetchDrives();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reopen drive');
    }
  }}
  onView={async () => {
    try {
      const api =
        tab === 'oncampus'
          ? onCampusAPI
          : offCampusAPI;

      const res = await api.getById(drive._id);

      setDetailsDrive(res.data.data);
      setShowDetails(true);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          'Failed to load drive details'
      );
    }
  }}
  onAddRound={() => {
    setRoundDrive(drive);
    setShowRoundForm(true);
  }}
  onRefresh={fetchDrives}
/>
            ))}
          </div>
        )
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={selected ? `Edit — ${selected.companyName}` : `New ${tab === 'oncampus' ? 'On-Campus' : 'Off-Campus'} Drive`}
        width="680px"
      >
        {tab === 'oncampus'
          ? <OnCampusForm drive={selected} onSuccess={() => { setShowForm(false); fetchDrives(); }} />
          : <OffCampusForm drive={selected} onSuccess={() => { setShowForm(false); fetchDrives(); }} />
        }
      </Modal>
            {showDetails && detailsDrive && (
        <Modal
          open={showDetails}
          onClose={() => {
            setShowDetails(false);
            setDetailsDrive(null);
          }}
          title="Drive Details"
          width="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '22px',
                  color: 'var(--text-primary)',
                }}
              >
                {detailsDrive.companyName}
              </h2>

              {detailsDrive.role && (
                <p
                  style={{
                    margin: '6px 0 0',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Role: <strong>{detailsDrive.role}</strong>
                </p>
              )}
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px' }}>
                Job Description
              </h4>

              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {detailsDrive.description?.trim()
                  ? detailsDrive.description
                  : 'No job description provided.'}
              </div>
            </div>

            {tab === 'oncampus' && (
              <div>
                <h4 style={{ margin: '0 0 10px' }}>
                  Selection Rounds
                </h4>

                {Array.isArray(detailsDrive.rounds) &&
                detailsDrive.rounds.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {detailsDrive.rounds.map((round, index) => (
                      <div
                        key={round._id || index}
                        style={{
                          padding: '14px',
                          borderRadius: '10px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  }}
>
  <div
    style={{
      fontWeight: 700,
      color: 'var(--text-primary)',
    }}
  >
    Round {round.roundNumber || index + 1}
    {round.roundName ? ` — ${round.roundName}` : ''}
  </div>

  <button
    type="button"
    onClick={() => {
      setEditingRound(round);
      setShowRoundEdit(true);
    }}
    
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 10px',
      borderRadius: '8px',
      border: '1px solid var(--border)',
      background: 'var(--bg-elevated)',
      color: 'var(--accent-primary)',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 600,
    }}
  >
    <Pencil size={13} strokeWidth={2} />
Edit
  </button>
  
  <button
  type="button"
  onClick={() => {
    setResultRound(round);
    setShowResultUpload(true);
  }}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--bg-elevated)',
    color: 'var(--accent-primary)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
  }}
>
  <Upload size={13} strokeWidth={2} />
  Upload Results
</button>
</div>
                   
{round.mode && (
  <div
    style={{
      color: 'var(--text-secondary)',
      marginBottom: '4px',
    }}
  >
    Mode: {round.mode === 'offline' ? 'Offline' : 'Online'}
  </div>
)}
{round.date && (
  <div
    style={{
      color: 'var(--text-secondary)',
      marginBottom: '4px',
    }}
  >
    Date: {new Date(round.date).toLocaleDateString()}
  </div>
)}

<div
  style={{
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  }}
>
  {round.description?.trim()
    ? round.description
    : 'No description provided.'}
</div>

                        

  
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                    }}
                  >
                    No rounds at present.
                  </div>
                )}
              </div>
            )}
            {tab === 'offcampus' && (
  <div>
    <h4
      style={{
        margin: '0 0 10px',
        color: 'var(--text-primary)',
      }}
    >
      Drive Information
    </h4>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
      }}
    >
      <div
        style={{
          padding: '12px',
          borderRadius: '10px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Drive Name
        </div>
        <div
          style={{
            marginTop: '4px',
            color: 'var(--text-primary)',
            fontWeight: 600,
          }}
        >
          {detailsDrive.driveName || 'Not specified'}
        </div>
      </div>

      <div
        style={{
          padding: '12px',
          borderRadius: '10px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Category
        </div>
        <div
          style={{
            marginTop: '4px',
            color: 'var(--text-primary)',
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        >
          {detailsDrive.driveCategory || 'Not specified'}
        </div>
      </div>

      <div
        style={{
          padding: '12px',
          borderRadius: '10px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Eligible Batches
        </div>
        <div
          style={{
            marginTop: '4px',
            color: 'var(--text-primary)',
            fontWeight: 600,
          }}
        >
          {(detailsDrive.eligibleBatches || []).join(', ') || 'Not specified'}
        </div>
      </div>

      <div
        style={{
          padding: '12px',
          borderRadius: '10px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Last Date to Apply
        </div>
        <div
          style={{
            marginTop: '4px',
            color: 'var(--text-primary)',
            fontWeight: 600,
          }}
        >
          {detailsDrive.lastDateToApply
            ? new Date(detailsDrive.lastDateToApply).toLocaleDateString()
            : 'Not specified'}
        </div>
      </div>
    </div>
  </div>
)}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
             <button
  type="button"
  onClick={() => {
    setShowDetails(false);
    setDetailsDrive(null);
  }}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '90px',
    padding: '9px 18px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  }}
>
  Close
</button>
            </div>

          </div>
        </Modal>
      )}
      {showRoundForm && roundDrive && (
  <Modal
    open={showRoundForm}
    onClose={() => {
      setShowRoundForm(false);
      setRoundDrive(null);
    }}
    title={`Add Round — ${roundDrive.companyName}`}
    width="680px"
  >
    <CreateRoundForm
      driveId={roundDrive._id}
      onSuccess={() => {
        setShowRoundForm(false);
        setRoundDrive(null);
        fetchDrives();
      }}
    />
  </Modal>
)}
{showRoundEdit && editingRound && (
  <Modal
    open={showRoundEdit}
    onClose={() => {
      setShowRoundEdit(false);
      setEditingRound(null);
    }}
    title={`Edit Round — ${editingRound.roundName}`}
    width="680px"
  >
    <EditRoundForm
      round={editingRound}
      onSuccess={async () => {
        setShowRoundEdit(false);
        setEditingRound(null);

        try {
          const res = await onCampusAPI.getById(detailsDrive._id);
          setDetailsDrive(res.data.data);
        } catch {
          fetchDrives();
        }
      }}
    />
  </Modal>
)}
{showResultUpload && resultRound && (
  <Modal
    open={showResultUpload}
    onClose={() => {
      setShowResultUpload(false);
      setResultRound(null);
    }}
    title={`Upload Results — ${resultRound.roundName}`}
    width="680px"
  >
    <RoundResultForm
      round={resultRound}
      onSuccess={async () => {
        setShowResultUpload(false);
        setResultRound(null);

        try {
          const res = await onCampusAPI.getById(detailsDrive._id);
          setDetailsDrive(res.data.data);
        } catch {
          fetchDrives();
        }
      }}
    />
  </Modal>
)}

    </div>
  );
}

function DriveCard({
  drive,
  type,
  onEdit,
  onView,
  onAddRound,
  onReopen,
  onRefresh,
}) {
  const navigate = useNavigate();
  return (
    <Card style={{ transition: 'var(--transition)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>{drive.companyName}</h3>
            {statusBadge(drive)}
            {drive.isFrozen && drive.selectionRatio && (
              <Badge variant="success">Selected: {drive.selectionRatio}</Badge>
            )}
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
           {drive.minPackage && (
  <span style={{ fontSize: '12px', color: 'var(--accent-green)' }}>
    ₹ Package: {drive.minPackage}–{drive.maxPackage} LPA
  </span>
)}

<span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
  Batch: {(drive.eligibleBatches || []).join(', ')}
</span>

{type === 'oncampus' && (
  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
    CGPA ≥ {drive.cgpaCutOff}
  </span>
)}

{type === 'oncampus' && drive.rounds?.length > 0 && (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '12px',
      color: 'var(--accent-primary)',
      fontWeight: 600,
    }}
  >
    <Layers3 size={13} strokeWidth={2} />
    {drive.rounds.length} Round(s)
  </span>
)}
          </div>
        </div>

       <div
  style={{
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  }}
>
  <button
    type="button"
    onClick={onView}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 600,
    }}
  >
    <Eye size={14} strokeWidth={2} />
    View Details
  </button>

  <button
      type="button"
      onClick={onEdit}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        color: 'var(--accent-primary)',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      <Pencil size={14} strokeWidth={2} />
      Edit
    </button>

  {type === 'oncampus' && (
    <button
      type="button"
      onClick={onAddRound}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        color: 'var(--accent-primary)',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      <Plus size={14} strokeWidth={2} />
      Add Round
    </button>
  )}

  {type === 'oncampus' && drive.status === 'completed' && (
    <button
      type="button"
      onClick={onReopen}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        background: 'var(--accent-primary)',
        border: 'none',
        borderRadius: '8px',
        color: 'var(--bg-primary)',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 700,
      }}
    >
      Reopen Drive
    </button>
  )}
</div>
      </div>
    </Card>
  );
}

function OnCampusForm({ drive, onSuccess }) {
  const [form, setForm] = useState({
  companyName: drive?.companyName || '',
  role: drive?.role || '',
  eligibleBatches: drive?.eligibleBatches?.join(',') || '',
  eligibleBranches: drive?.eligibleBranches || [],
  cgpaCutOff: drive?.cgpaCutOff || '',
  backlogsAllowed: drive?.backlogsAllowed ?? 0,
  description: drive?.description || '',
  minPackage: drive?.minPackage || '',
  maxPackage: drive?.maxPackage || '',
  registrationDeadline: drive?.registrationDeadline
    ? drive.registrationDeadline.split('T')[0]
    : '',
  registrationLink: drive?.registrationLink || '',
  status: drive?.status || 'active',
});
  const [loading, setLoading] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [eligibilityListFile, setEligibilityListFile] = useState(null);

  const toggleBranch = (b) => {
    setForm(f => ({
      ...f,
      eligibleBranches: f.eligibleBranches.includes(b)
        ? f.eligibleBranches.filter(x => x !== b)
        : [...f.eligibleBranches, b],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
  !form.companyName ||
  !form.role ||
  !form.eligibleBatches ||
  !form.eligibleBranches.length ||
  form.cgpaCutOff === ''
) {
  return toast.error('Please fill all required fields');
}
    setLoading(true);
    try {
      const fd = new FormData();
      const batches = form.eligibleBatches.split(',').map(b => Number(b.trim())).filter(Boolean);
      Object.entries({ ...form, eligibleBatches: JSON.stringify(batches), eligibleBranches: JSON.stringify(form.eligibleBranches) }).forEach(([k, v]) => fd.append(k, v));
      if (docFile) fd.append('document', docFile);
if (eligibilityListFile) fd.append('eligibilityList', eligibilityListFile);
      if (drive) {
        await onCampusAPI.update(drive._id, fd);
        toast.success('Drive updated!');
      } else {
        await onCampusAPI.create(fd);
        toast.success('Drive created!');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: '10px 14px', fontSize: '14px' };
  const labelStyle = { display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Company Name *</label>
          <input style={inputStyle} value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="e.g. TCS" />
        </div>
        <div>
  <label style={labelStyle}>Role *</label>
  <input
    style={inputStyle}
    value={form.role}
    onChange={e =>
      setForm({ ...form, role: e.target.value })
    }
    placeholder="e.g. Software Engineer"
  />
</div>
        <div>
          <label style={labelStyle}>Eligible Batches * (comma separated)</label>
          <input style={inputStyle} value={form.eligibleBatches} onChange={e => setForm({ ...form, eligibleBatches: e.target.value })} placeholder="2026, 2027" />
        </div>
        <div>
          <label style={labelStyle}>CGPA Cut-off *</label>
          <input type="number" step="0.1" min="0" max="10" style={inputStyle} value={form.cgpaCutOff} onChange={e => setForm({ ...form, cgpaCutOff: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Backlogs Allowed</label>
          <input type="number" min="0" style={inputStyle} value={form.backlogsAllowed} onChange={e => setForm({ ...form, backlogsAllowed: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Min Package (LPA)</label>
          <input type="number" style={inputStyle} value={form.minPackage} onChange={e => setForm({ ...form, minPackage: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Max Package (LPA)</label>
          <input type="number" style={inputStyle} value={form.maxPackage} onChange={e => setForm({ ...form, maxPackage: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Registration Deadline</label>
          <input type="date" style={inputStyle} value={form.registrationDeadline} onChange={e => setForm({ ...form, registrationDeadline: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Eligible Branches *</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {BRANCHES.map(b => (
            <button
              key={b} type="button"
              onClick={() => toggleBranch(b)}
              style={{
                padding: '6px 14px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer',
                background: form.eligibleBranches.includes(b)
  ? 'var(--accent-primary)'
  : 'var(--bg-elevated)',
border: `1px solid ${
  form.eligibleBranches.includes(b)
    ? 'var(--accent-primary)'
    : 'var(--border)'
}`,
color: form.eligibleBranches.includes(b)
  ? 'var(--bg-primary)'
  : 'var(--text-secondary)',
              }}
            >{b}</button>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Registration Link</label>
        <input style={inputStyle} value={form.registrationLink} onChange={e => setForm({ ...form, registrationLink: e.target.value })} placeholder="https://company.com/apply" />
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
      {/* Job Description */}
      <div>
        <label style={labelStyle}>
          Job Description
          <span
            style={{
              marginLeft: '6px',
              color: 'var(--text-muted)',
              fontWeight: 400,
            }}
          >
            (Optional)
          </span>
        </label>

        <input
          type="file"
          accept=".xlsx,.xls,.pdf"
          onChange={e => setDocFile(e.target.files[0])}
          style={{
            ...inputStyle,
            padding: '8px',
          }}
        />

        <p
          style={{
            marginTop: '6px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          Upload the Job Description as an Excel or PDF file.
          This document is optional.
        </p>

        {docFile && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(230,126,34,0.08)',
              border: '1px solid rgba(230,126,34,0.18)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
            }}
          >
            Selected: {docFile.name}
          </div>
        )}
      </div>

      {/* Eligibility Student List */}
      <div>
        <label style={labelStyle}>
          Eligibility Student List
          <span
            style={{
              marginLeft: '6px',
              color: 'var(--text-muted)',
              fontWeight: 400,
            }}
          >
            (Optional)
          </span>
        </label>

        <input
          type="file"
          accept=".xlsx,.xls,.pdf"
          onChange={e => setEligibilityListFile(e.target.files[0])}
          style={{
            ...inputStyle,
            padding: '8px',
          }}
        />

        <p
          style={{
            marginTop: '6px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          Upload the list of students eligible for this drive as an
          Excel or PDF file. Students must satisfy both the uploaded
          list and the drive criteria.
        </p>

        {eligibilityListFile && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(230,126,34,0.08)',
              border: '1px solid rgba(230,126,34,0.18)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
            }}
          >
            Selected: {eligibilityListFile.name}
          </div>
        )}
      </div>

      <button type="submit" disabled={loading}
        style={{ padding: '13px', background: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        {loading && <Spinner size={16} color="var(--bg-primary)" />}
        {drive ? 'Update Drive' : 'Create Drive'}
      </button>
    </form>
  );
}
function OffCampusForm({ drive, onSuccess }) {
  const [form, setForm] = useState({
    companyName: drive?.companyName || '',
    driveName: drive?.driveName || '',
    driveCategory: drive?.driveCategory || 'internship',
    eligibleBatches: drive?.eligibleBatches?.join(',') || '',
    eligibleBranches: drive?.eligibleBranches || [],
    description: drive?.description || '',
    applyLink: drive?.applyLink || '',
    lastDateToApply: drive?.lastDateToApply ? drive.lastDateToApply.split('T')[0] : '',
    appliedCount: drive?.appliedCount || 0,
    selectedCount: drive?.selectedCount || 0,
  });
  const [loading, setLoading] = useState(false);

  const toggleBranch = (b) => setForm(f => ({
    ...f,
    eligibleBranches: f.eligibleBranches.includes(b) ? f.eligibleBranches.filter(x => x !== b) : [...f.eligibleBranches, b],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const batches = form.eligibleBatches.split(',').map(b => Number(b.trim())).filter(Boolean);
      const payload = { ...form, eligibleBatches: JSON.stringify(batches), eligibleBranches: JSON.stringify(form.eligibleBranches) };
      if (drive) { await offCampusAPI.update(drive._id, payload); toast.success('Updated!'); }
      else { await offCampusAPI.create(payload); toast.success('Created!'); }
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: '10px 14px', fontSize: '14px' };
  const labelStyle = { display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div><label style={labelStyle}>Company Name *</label><input style={inputStyle} value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} /></div>
        <div><label style={labelStyle}>Drive Name *</label><input style={inputStyle} value={form.driveName} onChange={e => setForm({ ...form, driveName: e.target.value })} /></div>
        <div>
          <label style={labelStyle}>Category *</label>
          <select style={inputStyle} value={form.driveCategory} onChange={e => setForm({ ...form, driveCategory: e.target.value })}>
            <option value="internship">Internship</option>
            <option value="hackathon">Hackathon</option>
            <option value="job">Job</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div><label style={labelStyle}>Eligible Batches *</label><input style={inputStyle} value={form.eligibleBatches} onChange={e => setForm({ ...form, eligibleBatches: e.target.value })} placeholder="2026, 2027" /></div>
        <div><label style={labelStyle}>Apply Link *</label><input style={inputStyle} value={form.applyLink} onChange={e => setForm({ ...form, applyLink: e.target.value })} /></div>
        <div><label style={labelStyle}>Last Date to Apply</label><input type="date" style={inputStyle} value={form.lastDateToApply} onChange={e => setForm({ ...form, lastDateToApply: e.target.value })} /></div>
        <div><label style={labelStyle}>Applied Count</label><input type="number" style={inputStyle} value={form.appliedCount} onChange={e => setForm({ ...form, appliedCount: e.target.value })} /></div>
        <div><label style={labelStyle}>Selected Count</label><input type="number" style={inputStyle} value={form.selectedCount} onChange={e => setForm({ ...form, selectedCount: e.target.value })} /></div>
      </div>
      <div>
        <label style={labelStyle}>Eligible Branches</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {BRANCHES.map(b => (
            <button key={b} type="button" onClick={() => toggleBranch(b)}
              style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer', 
                background: form.eligibleBranches.includes(b)
  ? 'var(--accent-primary)'
  : 'var(--bg-elevated)',
border: `1px solid ${
  form.eligibleBranches.includes(b)
    ? 'var(--accent-primary)'
    : 'var(--border)'
}`,
color: form.eligibleBranches.includes(b)
  ? 'var(--bg-primary)'
  : 'var(--text-secondary)',}}
            >{b}</button>
          ))}
        </div>
      </div>
      <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <button type="submit" disabled={loading}
        style={{ padding: '13px', background: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
        {loading ? 'Saving...' : drive ? 'Update Drive' : 'Create Drive'}
      </button>
    </form>
  );
}

function CreateRoundForm({ driveId, onSuccess }) {
  const [form, setForm] = useState({
  roundName: '',
  mode: 'online',
  venue: '',
  description: '',
  date: '',
});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.roundName) {
      return toast.error('Round name is required');
    }

    setLoading(true);

    try {
      await roundsAPI.create({
        driveId,
        ...form,
      });

      toast.success('Round created!');

      onSuccess();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-primary)',
    padding: '10px 14px',
    fontSize: '14px',
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '6px',
            fontWeight: 500,
          }}
        >
          Round Name *
        </label>

        <input
          style={inputStyle}
          placeholder="e.g. Aptitude Test, Technical Interview"
          value={form.roundName}
          onChange={(e) =>
            setForm({
              ...form,
              roundName: e.target.value,
            })
          }
        />
      </div>

     <div>
  <label
    style={{
      display: 'block',
      fontSize: '12px',
      color: 'var(--text-secondary)',
      marginBottom: '6px',
      fontWeight: 500,
    }}
  >
    Mode *
  </label>

  <select
    style={inputStyle}
    value={form.mode}
    onChange={(e) =>
      setForm({
        ...form,
        mode: e.target.value,
        venue: e.target.value === 'online' ? '' : form.venue,
      })
    }
  >
    <option value="online">Online</option>
    <option value="offline">Offline</option>
  </select>
</div>

{form.mode === 'offline' && (
  <div>
    <label
      style={{
        display: 'block',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginBottom: '6px',
        fontWeight: 500,
      }}
    >
      Venue *
    </label>

    <input
      style={inputStyle}
      placeholder="e.g. Seminar Hall Block A"
      value={form.venue}
      onChange={(e) =>
        setForm({
          ...form,
          venue: e.target.value,
        })
      }
    />
  </div>
)}

      <div>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '6px',
            fontWeight: 500,
          }}
        >
          Date
        </label>

        <input
          type="date"
          style={inputStyle}
          value={form.date}
          onChange={(e) =>
            setForm({
              ...form,
              date: e.target.value,
            })
          }
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '6px',
            fontWeight: 500,
          }}
        >
          Description
        </label>

        <textarea
          style={{
            ...inputStyle,
            minHeight: '80px',
            resize: 'vertical',
          }}
          value={form.description}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
            })
          }
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '12px',
          background: 'var(--accent-primary)',
          color: 'var(--bg-primary)',
          border: 'none',
          borderRadius: 'var(--radius)',
          fontWeight: 700,
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        {loading ? 'Creating...' : 'Create Round'}
      </button>
    </form>
  );
}

function EditRoundForm({ round, onSuccess }) {
  const [form, setForm] = useState({
    roundName: round.roundName || '',
    mode: round.mode || 'online',
    venue: round.venue || '',
    date: round.date ? new Date(round.date).toISOString().slice(0, 10) : '',
    description: round.description || '',
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'mode' && value === 'online'
        ? { venue: '' }
        : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.roundName.trim()) {
      toast.error('Round name is required');
      return;
    }

    if (form.mode === 'offline' && !form.venue.trim()) {
      toast.error('Venue is required for offline rounds');
      return;
    }

    setSaving(true);

    try {
      await roundsAPI.update(round._id, {
        roundName: form.roundName.trim(),
        mode: form.mode,
        venue: form.mode === 'offline' ? form.venue.trim() : '',
        date: form.date || undefined,
        description: form.description,
      });

      toast.success('Round updated successfully');
      onSuccess();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          'Failed to update round'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <Input
        label="Round Name"
        name="roundName"
        value={form.roundName}
        onChange={handleChange}
        placeholder="e.g. Technical Interview"
        required
      />

      <Select
        label="Mode"
        name="mode"
        value={form.mode}
        onChange={handleChange}
        options={[
          { value: 'online', label: 'Online' },
          { value: 'offline', label: 'Offline' },
        ]}
      />

      {form.mode === 'offline' && (
        <Input
          label="Venue"
          name="venue"
          value={form.venue}
          onChange={handleChange}
          placeholder="Enter venue"
          required
        />
      )}

      <Input
        label="Date"
        name="date"
        type="date"
        value={form.date}
        onChange={handleChange}
      />

      <Textarea
        label="Description"
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Enter round description"
        rows={4}
      />

    <div
  style={{
    display: 'flex',
    width: '100%',
    marginTop: '8px',
  }}
>
        <button
  type="submit"
  disabled={saving}
  style={{
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '11px 18px',
    background: saving
      ? 'var(--bg-elevated)'
      : 'var(--accent-primary)',
    border: '1px solid var(--accent-primary)',
    borderRadius: '8px',
    color: saving
      ? 'var(--text-muted)'
      : 'var(--bg-primary)',
    cursor: saving ? 'not-allowed' : 'pointer',
    fontSize: '13px',
    fontWeight: 700,
    opacity: saving ? 0.7 : 1,
  }}
>
  {saving ? 'Saving...' : 'Save Changes'}
</button>
      </div>
    </form>
  );
}

function RoundResultForm({ round, onSuccess }) {
  const [resultText, setResultText] = useState('');
  const [resultFile, setResultFile] = useState(null);
  const [isFinalRound, setIsFinalRound] = useState(
    round?.isFinalRound || false
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resultText.trim() && !resultFile) {
      toast.error(
        'Enter roll numbers or upload an Excel/PDF file'
      );
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();

      if (resultText.trim()) {
        fd.append('rollNumbers', resultText);
      }

      if (resultFile) {
        fd.append('file', resultFile);
      }

      fd.append(
        'isFinalRound',
        String(isFinalRound)
      );

      await roundsAPI.uploadQualified(
        round._id,
        fd
      );

      toast.success(
        'Round results uploaded successfully'
      );

      onSuccess();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          'Failed to upload round results'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '6px',
            fontWeight: 600,
          }}
        >
          Student Roll Numbers
        </label>

        <textarea
          value={resultText}
          onChange={(e) =>
            setResultText(e.target.value)
          }
          placeholder={`Enter roll numbers separated by spaces, commas, or new lines.\n\nExample:\n23MH1A0501\n23MH1A0502\n23MH1A0505`}
          style={{
            width: '100%',
            minHeight: '140px',
            resize: 'vertical',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-primary)',
            padding: '12px 14px',
            fontSize: '13px',
            lineHeight: 1.6,
            boxSizing: 'border-box',
          }}
        />

        <p
          style={{
            marginTop: '6px',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          You can enter multiple roll numbers manually.
        </p>
      </div>

      <div
        style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '12px',
        }}
      >
        OR
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '6px',
            fontWeight: 600,
          }}
        >
          Upload Result File
        </label>

        <input
          type="file"
          accept=".xlsx,.xls,.pdf"
          onChange={(e) =>
            setResultFile(e.target.files?.[0] || null)
          }
          style={{
            width: '100%',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-primary)',
            padding: '9px',
            boxSizing: 'border-box',
          }}
        />

        <p
          style={{
            marginTop: '6px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          Supported formats: Excel (.xlsx, .xls) and
          PDF (.pdf).
        </p>

        {resultFile && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
            }}
          >
            Selected: {resultFile.name}
          </div>
        )}
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          borderRadius: '8px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={isFinalRound}
          onChange={(e) =>
            setIsFinalRound(e.target.checked)
          }
        />

        <span
          style={{
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          This is the final round
        </span>
      </label>

      {isFinalRound && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            lineHeight: 1.5,
          }}
        >
          Publishing this result will mark students in
          the result list as selected and freeze the drive.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          background: loading
            ? 'var(--bg-elevated)'
            : 'var(--accent-primary)',
          border: '1px solid var(--accent-primary)',
          borderRadius: '8px',
          color: loading
            ? 'var(--text-muted)'
            : 'var(--bg-primary)',
          cursor: loading
            ? 'not-allowed'
            : 'pointer',
          fontSize: '13px',
          fontWeight: 700,
        }}
      >
        {loading
          ? 'Uploading...'
          : 'Publish Round Results'}
      </button>
    </form>
  );
}