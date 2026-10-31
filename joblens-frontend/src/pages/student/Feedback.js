import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { feedbackAPI } from '../../services/api';
import { Card, Badge, LoadingPage, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';

export default function FeedbackPage() {
  const [params] = useSearchParams();
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFB, setLoadingFB] = useState(false);

  const feedbackRef = useRef(null);

  useEffect(() => {
    feedbackAPI.getCompanies()
      .then(res => setCompanies(res.data.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const loadFeedback = async (companyName) => {
    setSelected(companyName);
    setLoadingFB(true);

    setTimeout(() => {
      if (window.innerWidth <= 768) {
        feedbackRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 150);

    try {
      const res = await feedbackAPI.getByCompany(companyName);
      setFeedbacks(res.data.data.feedbacks);
    } catch {
      toast.error('Failed');
    } finally {
      setLoadingFB(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>
          Company Feedback
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Anonymous experiences shared by seniors — browse by company
        </p>
      </div>

      {loading ? (
        <LoadingPage />
      ) : (
        <div className="feedback-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Companies ({companies.length})
            </p>

            {companies.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No feedback yet</p>
            ) : (
              companies.map(c => (
                <button
                  key={c.companyName}
                  onClick={() => loadFeedback(c.companyName)}
                  style={{
  padding: '12px 16px',
  borderRadius: '10px',
  cursor: 'pointer',

  background:
    selected === c.companyName
      ? 'rgba(230,126,34,0.10)'
      : 'var(--bg-card)',

  border:
    selected === c.companyName
      ? '1px solid rgba(230,126,34,0.30)'
      : '1px solid var(--border)',

  color:
    selected === c.companyName
      ? 'var(--accent-primary)'
      : 'var(--text-primary)',

  textAlign: 'left',
  transition: 'var(--transition)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
}}
                >
                  <span style={{ fontSize: '14px', fontWeight: selected === c.companyName ? 600 : 400 }}>
                    {c.companyName}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {c.count} review{c.count !== 1 ? 's' : ''}
                  </span>
                </button>
              ))
            )}
          </div>

          <div ref={feedbackRef}>
            {!selected ? (
              <EmptyState icon="💬" title="Select a company" description="Click on any company to see anonymous feedback from seniors" />
            ) : loadingFB ? (
              <LoadingPage text="Loading feedback..." />
            ) : feedbacks.length === 0 ? (
              <EmptyState icon="📭" title="No feedback yet" description={`Be the first to share your experience at ${selected}`} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700 }}>
                  {selected} — {feedbacks.length} Review{feedbacks.length !== 1 ? 's' : ''}
                </h2>

                {feedbacks.map((fb, i) => (
                  <Card key={fb._id || i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        {fb.role && <p style={{ fontSize: '14px', fontWeight: 600 }}>Role: {fb.role}</p>}
                        {fb.passedOutYear && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Batch {fb.passedOutYear}</p>}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {fb.outcome && (
                          <Badge variant={fb.outcome === 'selected' ? 'success' : 'danger'} size="sm">
                            {fb.outcome === 'selected' ? '🏆 Selected' : '❌ Rejected'}
                          </Badge>
                        )}
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {fb.rounds?.map((round, ri) => (
                      <div key={ri} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px', marginBottom: '10px', border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '8px' }}>
                          Round {ri + 1}: {round.roundName}
                        </p>

                        {round.description && (
                          <div style={{ marginBottom: '8px' }}>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>EXPERIENCE</p>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                              {round.description}
                            </p>
                          </div>
                        )}

                        {round.challenges && (
                          <div>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>CHALLENGES</p>
                            <p style={{ fontSize: '13px', color: 'var(--accent-orange)', lineHeight: 1.6 }}>
                              ⚡ {round.challenges}
                            </p>
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