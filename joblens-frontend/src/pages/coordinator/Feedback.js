import React, { useEffect, useState } from 'react';
import { feedbackAPI } from '../../services/api';
import { Card, Badge, LoadingPage, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';

export default function CoordinatorFeedbackPage() {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFB, setLoadingFB] = useState(false);

  useEffect(() => {
    feedbackAPI.getCompanies()
      .then((res) => setCompanies(res.data.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const loadFeedback = async (companyName) => {
    setSelected(companyName);
    setLoadingFB(true);
    try {
      const res = await feedbackAPI.getByCompany(companyName);
      setFeedbacks(res.data.data.feedbacks);
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoadingFB(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>Student Feedback</h1>
          <p className="page-subtitle">
            Anonymous placement-experience feedback submitted by students — identities are never shown.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingPage />
      ) : (
        <div className="feedback-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Companies ({companies.length})
            </p>

            {companies.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No feedback submitted yet</p>
            ) : (
              companies.map((c) => (
                <button
                  key={c.companyName}
                  onClick={() => loadFeedback(c.companyName)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    background: selected === c.companyName ? 'rgba(37,99,235,0.08)' : 'var(--bg-card)',
                    border: `1px solid ${selected === c.companyName ? 'rgba(37,99,235,0.3)' : 'var(--border)'}`,
                    color: selected === c.companyName ? 'var(--accent-primary)' : 'var(--text-primary)',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: selected === c.companyName ? 600 : 400 }}>{c.companyName}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {c.count} review{c.count !== 1 ? 's' : ''}
                  </span>
                </button>
              ))
            )}
          </div>

          <div>
            {!selected ? (
              <EmptyState icon="💬" title="Select a company" description="Click on any company to see anonymous feedback from students" />
            ) : loadingFB ? (
              <LoadingPage text="Loading feedback..." />
            ) : feedbacks.length === 0 ? (
              <EmptyState icon="📭" title="No feedback yet" description={`No feedback submitted for ${selected} yet`} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
                  {selected} — {feedbacks.length} Review{feedbacks.length !== 1 ? 's' : ''}
                </h2>

                {feedbacks.map((fb, i) => (
                  <Card key={fb._id || i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        {fb.role && <p style={{ fontSize: 14, fontWeight: 600 }}>Role: {fb.role}</p>}
                        {fb.passedOutYear && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Batch {fb.passedOutYear}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {fb.outcome && (
                          <Badge variant={fb.outcome === 'selected' ? 'success' : 'danger'} size="sm">
                            {fb.outcome === 'selected' ? '🏆 Selected' : '❌ Rejected'}
                          </Badge>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {fb.rounds?.map((round, ri) => (
                      <div key={ri} style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 10, marginBottom: 10, border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)', marginBottom: 8 }}>
                          Round {ri + 1}: {round.roundName}
                        </p>
                        {round.description && (
                          <div style={{ marginBottom: 8 }}>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>EXPERIENCE</p>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{round.description}</p>
                          </div>
                        )}
                        {round.challenges && (
                          <div>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CHALLENGES</p>
                            <p style={{ fontSize: 13, color: 'var(--accent-orange)', lineHeight: 1.6 }}>⚡ {round.challenges}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
