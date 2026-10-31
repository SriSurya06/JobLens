import React, { useEffect, useState } from 'react';
import { coordinatorAPI } from '../../services/api';
import { Card, Badge, Table, Tr, Td, LoadingPage, EmptyState } from '../../components/ui';
import { Megaphone, Users, Mail, Eye, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'DS'];
const BATCHES = [2026, 2027, 2028, 2029];
// ── Announcements Page ──────
export function NotifyPage() {
  const [form, setForm] = useState({ subject: '', message: '', batch: '', branch: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(null);
  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) return toast.error('Subject and message are required');
    setLoading(true);
    try {
      const res = await coordinatorAPI.sendNotification(form);
      setSent(res.data.data.recipientCount);
      toast.success(`Email dispatched to ${res.data.data.recipientCount} students!`);
      setForm({ subject: '', message: '', batch: '', branch: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally { setLoading(false); }
  };
  const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', padding: '11px 13px', fontSize: '13px' };
  const labelStyle = { display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(230,126,34,0.12)', color: 'var(--accent-primary)' }}>
          <Megaphone size={21} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>Announcements</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Share targeted placement updates with students</p>
        </div>
      </div>
      {sent && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '13px 15px', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: '8px', color: 'var(--accent-green)' }}>
          <CheckCircle2 size={17} /> Announcement published to <strong>{sent}</strong> students
        </div>
      )}
      <form onSubmit={handleSend} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(260px, 0.65fr)', gap: '16px', alignItems: 'start' }}>
        <Card style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '18px' }}>
            <Users size={17} color="var(--accent-primary)" />
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800 }}>Audience</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '3px' }}>Choose who should receive this announcement.</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '22px' }}>
            <div>
              <label style={labelStyle}>Batch</label>
              <select style={inputStyle} value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })}>
                <option value="">All batches</option>
                {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Branch</label>
              <select style={inputStyle} value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}>
                <option value="">All branches</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '18px' }}>
              <Mail size={17} color="var(--accent-primary)" />
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 800 }}>Announcement details</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '3px' }}>This content appears in the student notification bell and email.</p>
              </div>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Important placement notice" />
            </div>
            <div>
              <label style={labelStyle}>Message *</label>
              <textarea style={{ ...inputStyle, minHeight: '170px', resize: 'vertical', lineHeight: 1.55 }} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Write the update students need to see..." />
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '20px', padding: '11px 17px', background: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            <Send size={15} /> {loading ? 'Publishing...' : 'Publish announcement'}
          </button>
        </Card>
        <Card style={{ padding: '20px', position: 'sticky', top: '84px', background: 'rgba(255,248,240,0.72)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '16px' }}>
            <Eye size={17} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '15px', fontWeight: 800 }}>Student preview</h2>
          </div>
          <div style={{ padding: '16px', background: '#fffdf9', border: '1px solid rgba(230,126,34,0.22)', borderLeft: '3px solid var(--accent-primary)', borderRadius: '8px', boxShadow: '0 8px 20px rgba(90,55,25,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 800, letterSpacing: '0.08em' }}>ANNOUNCEMENT</span>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{form.subject || 'Announcement title'}</h3>
            <p style={{ fontSize: '12px', lineHeight: 1.55, color: 'var(--text-secondary)', marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{form.message || 'Your announcement message will appear here.'}</p>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '14px' }}>Just now · Unread</p>
          </div>
          <div style={{ marginTop: '14px', padding: '11px', background: 'rgba(230,126,34,0.07)', borderRadius: '8px' }}>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>AUDIENCE</p>
            <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{form.batch || form.branch ? `${form.batch || 'All'} · ${form.branch || 'All'}` : 'All students'}</strong>
          </div>
          <p style={{ marginTop: '14px', color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.5 }}>Leave both filters blank to reach every student. Automatic drive and round notifications are managed separately.</p>
        </Card>
      </form>
    </div>
  );
}
// ── Audit Logs Page ───────
export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');

  const ACTION_COLORS = {
    DRIVE_CREATED: 'primary',
    DRIVE_UPDATED: 'warning',
    DRIVE_DELETED: 'danger',
    ROUND_CREATED: 'purple',
    ROUND_UPDATED: 'warning',
    ELIGIBLE_LIST_UPLOADED: 'primary',
    ATTENDED_LIST_UPLOADED: 'warning',
    RESULTS_PUBLISHED: 'success',
    NOTIFICATION_SENT: 'default',
  };

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (actionFilter) params.action = actionFilter;
      const res = await coordinatorAPI.getAuditLogs(params);
      setLogs(res.data.data.logs);
      setTotal(res.data.data.pagination.total);
      setPage(p);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchLogs(1); }, [actionFilter]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>Audit Logs</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>All coordinator actions — {total} entries</p>
        </div>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: '8px 14px', fontSize: '13px' }}
        >
          <option value="">All Actions</option>
          {Object.keys(ACTION_COLORS).map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <LoadingPage text="Loading logs..." /> : logs.length === 0 ? (
          <EmptyState icon="📋" title="No audit logs" description="Actions will appear here" />
        ) : (
          <>
            <Table headers={['Action', 'Entity', 'Details', 'By', 'Time']}>
              {logs.map(log => (
                <Tr key={log._id}>
                  <Td><Badge variant={ACTION_COLORS[log.action] || 'default'} size="sm">{log.action}</Badge></Td>
                  <Td><span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.entity}</span></Td>
                  <Td>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {log.details ? Object.entries(log.details).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ') : '—'}
                    </span>
                  </Td>
                  <Td><span style={{ fontSize: '12px' }}>{log.user?.email || '—'}</span></Td>
                  <Td>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </Td>
                </Tr>
              ))}
            </Table>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '16px', borderTop: '1px solid var(--border)' }}>
              <button disabled={page <= 1} onClick={() => fetchLogs(page - 1)}
                style={{ padding: '6px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                ← Prev
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', alignSelf: 'center' }}>Page {page} · {total} total</span>
              <button disabled={page * 20 >= total} onClick={() => fetchLogs(page + 1)}
                style={{ padding: '6px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: page * 20 >= total ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page * 20 >= total ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                Next →
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}