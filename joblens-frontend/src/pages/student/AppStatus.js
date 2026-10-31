import React, { useState, useEffect } from 'react';
import { Sidebar, Topbar, Spinner, EmptyState } from '../../components/shared';
import { studentAPI } from '../../services/api';

const statusConfig = {
  applied: { color: 'var(--info)', icon: '📋', label: 'Applied' },
  shortlisted: { color: 'var(--warning)', icon: '⚡', label: 'Shortlisted' },
  selected: { color: 'var(--success)', icon: '✅', label: 'Selected' },
  rejected: { color: 'var(--danger)', icon: '❌', label: 'Not Selected' },
};

export default function ApplicationStatus() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getOnCampus()
      .then(r => setDrives((r.data.data || []).filter(d => d.applicationStatus)))
      .catch(() => setDrives([]))
      .finally(() => setLoading(false));
  }, []);

  const selected = drives.filter(d => d.applicationStatus === 'SELECTED');
  const ongoing = drives.filter(d => !['SELECTED', 'NOT_SHORTLISTED'].includes(d.applicationStatus));
  const pastDrives = drives.filter(d => ['NOT_SHORTLISTED', 'NOT_QUALIFIED', 'NOT_ATTENDED'].includes(d.applicationStatus));

  const SectionHead = ({ title, count, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color }}>{title}</h3>
      <span className="badge" style={{ background: `${color}20`, color }}>{count}</span>
    </div>
  );

  const DriveRow = ({ drive }) => {
    const statusStr = drive.applicationStatus || 'applied';
    const isSelected = statusStr === 'SELECTED';
    const notOk = ['NOT_SHORTLISTED', 'NOT_QUALIFIED', 'NOT_ATTENDED'].includes(statusStr);

    return (
      <div style={{
        padding: '16px 20px',
        background: isSelected ? 'var(--success-bg)' : 'var(--bg-elevated)',
        borderRadius: 'var(--radius)',
        border: `1px solid ${isSelected ? 'var(--success)' : notOk ? 'var(--danger)' : 'var(--border)'}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
      }}>
        <div>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
            {isSelected && '🎉 '}{drive.companyName}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>
            {drive.maxPackage ? `💰 ${drive.minPackage}–${drive.maxPackage} LPA` : ''} {drive.branch ? ` · ${drive.branch}` : ''}
          </div>
          {drive.roundRejectedAt && (
            <div style={{ fontSize: '0.78rem', color: 'var(--danger)', marginTop: 4 }}>
              Eliminated at: {drive.roundRejectedAt}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontWeight: 700, fontSize: '0.85rem', fontFamily: 'var(--font-display)',
            color: isSelected ? 'var(--success)' : notOk ? 'var(--danger)' : 'var(--warning)'
          }}>
            {statusStr.replace(/_/g, ' ')}
          </div>
          {drive.rounds?.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {drive.rounds.length} round(s)
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <Topbar title="Application Status" />
        <div className="page-body">

          <div className="page-header">
            <div>
              <h1 className="page-title">Application Status</h1>
              <p className="page-subtitle">Track all your drive applications and round results</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ textAlign: 'center', padding: '6px 14px', background: 'var(--success-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--success)' }}>
                <div style={{ fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-display)' }}>{selected.length}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>Selected</div>
              </div>
              <div style={{ textAlign: 'center', padding: '6px 14px', background: 'var(--info-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--info)' }}>
                <div style={{ fontWeight: 800, color: 'var(--info)', fontFamily: 'var(--font-display)' }}>{drives.length}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--info)' }}>Total Applied</div>
              </div>
            </div>
          </div>
          {loading ? <Spinner text="Loading applications..." /> :
            drives.length === 0 ? (
              <EmptyState icon="📋" title="No applications yet"
                msg="Apply to on-campus drives to track your status here." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {selected.length > 0 && (
                  <div>
                    <SectionHead title="🎉 Congratulations! Selected" count={selected.length} color="var(--success)" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selected.map(d => <DriveRow key={d._id} drive={d} />)}
                    </div>
                  </div>
                )}
                {ongoing.length > 0 && (
                  <div>
                    <SectionHead title="⚡ Ongoing Applications" count={ongoing.length} color="var(--warning)" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {ongoing.map(d => <DriveRow key={d._id} drive={d} />)}
                    </div>
                  </div>
                )}
                {pastDrives.length > 0 && (
                  <div>
                    <SectionHead title="📁 Past Applications" count={pastDrives.length} color="var(--text-muted)" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {pastDrives.map(d => <DriveRow key={d._id} drive={d} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}