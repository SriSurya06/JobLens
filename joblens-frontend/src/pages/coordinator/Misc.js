import React, { useState, useEffect } from 'react';
import { Sidebar, Topbar, Spinner, toast } from '../../components/shared';
import { coordinatorAPI } from '../../services/api';

export function Notifications() {
  const [form, setForm] = useState({ subject: '', message: '', batch: '', branch: '', emails: '' });
  const [loading, setLoading] = useState(false);

  const send = async e => {
    e.preventDefault();
    if (!form.subject || !form.message) { toast('Subject and message required', 'warning'); return; }
    setLoading(true);
    try {
      await coordinatorAPI.sendNotification(form);
      toast('Notification sent to students!');
      setForm({ subject: '', message: '', batch: '', branch: '', emails: '' });
    } catch (ex) { toast(ex.response?.data?.message || 'Send failed', 'danger'); }
    finally { setLoading(false); }
  };

  return (
    <div className="app-layout">
      <Sidebar role="coordinator" />
      <div className="main-content">
        <Topbar title="Notifications" />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Send Notifications</h1>
              <p className="page-subtitle">Email students about updates, results and announcements</p>
            </div>
          </div>

          <div style={{ maxWidth: 680 }}>
            <div className="card">
              <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">Filter by Batch</label>
                    <select className="form-select" value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })}>
                      <option value="">All Batches</option>
                      {[2026, 2027, 2028, 2029].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Filter by Branch</label>
                    <select className="form-select" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}>
                      <option value="">All Branches</option>
                      {['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'DS'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input className="form-input" required value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. TCS Drive Results Announced" />
                </div>

                <div className="form-group">
                  <label className="form-label">Message *</label>
                  <textarea className="form-textarea" rows={6} required value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="Write your notification message here..." />
                </div>

                <div style={{ padding: '12px 16px', background: 'var(--info-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--info)', fontSize: '0.85rem', color: 'var(--info)' }}>
                  ℹ️ Emails will be sent to all students matching the selected filters (or all students if no filter is applied).
                </div>

                <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                  {loading ? <><span className="spinner" /> Sending...</> : '📨 Send Notification'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    coordinatorAPI.getAuditLogs()
      .then(r => setLogs(r.data.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoad(false));
  }, []);

  const actionColor = action => {
    if (action?.includes('CREATE')) return 'var(--success)';
    if (action?.includes('UPDATE')) return 'var(--warning)';
    if (action?.includes('DELETE')) return 'var(--danger)';
    return 'var(--info)';
  };

  return (
    <div className="app-layout">
      <Sidebar role="coordinator" />
      <div className="main-content">
        <Topbar title="Audit Logs" />
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Audit Logs</h1>
              <p className="page-subtitle">All coordinator actions are recorded here</p>
            </div>
          </div>

          {loading ? <Spinner text="Loading logs..." /> :
            logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>📋</div>
                <div>No audit logs yet</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Action</th>
                      <th>Resource</th>
                      <th>User</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={log._id || i}>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <span style={{ color: actionColor(log.action), fontWeight: 700, fontSize: '0.8rem', fontFamily: 'var(--font-display)' }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>{log.resource || '—'}</td>
                        <td style={{ fontSize: '0.875rem' }}>{log.performedBy?.email || '—'}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.details || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export function NewDrive() {
  const navigate = require('react-router-dom').useNavigate();
  return (
    <div className="app-layout">
      <Sidebar role="coordinator" />
      <div className="main-content">
        <Topbar title="New Drive" />
        <div className="page-body">
          <div className="page-header">
            <h1 className="page-title">Create New Drive</h1>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 700 }}>
            {[
              { icon: '🏢', title: 'On-Campus Drive', desc: 'For drives conducted at campus — manage rounds, eligible lists, and results.', path: '/coordinator/oncampus', color: 'var(--brand)' },
              { icon: '🌐', title: 'Off-Campus Drive', desc: 'Verified external drives — jobs, internships, and hackathons.', path: '/coordinator/offcampus', color: 'var(--success)' },
            ].map(opt => (
              <div key={opt.title} className="card clickable" onClick={() => navigate(opt.path)}
                style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center', padding: 32, transition: 'all 0.2s' }}>
                <div style={{ fontSize: '3rem' }}>{opt.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: opt.color }}>{opt.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{opt.desc}</p>
                <button className="btn btn-primary">→ Create</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}