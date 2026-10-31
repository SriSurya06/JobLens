import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, feedbackAPI } from '../../services/api';
import {
  Card,
  Badge,
  Modal,
  Tabs,
  LoadingPage,
  EmptyState,
  Alert,
} from '../../components/ui';
import {
  Building2,
  FolderClock,
  MessageSquare,
  FileText,
  GraduationCap,
  ClipboardList,
  CalendarDays,
  Trophy,
  ClipboardCheck,
  Star,
  Clock3,
  CircleX,
  CheckCircle2,
  MapPin,
  ExternalLink,
  MessageSquareText,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_META = {
  registered: {
    label: 'Registered',
    variant: 'warning',
    icon: ClipboardCheck,
  },

  shortlisted: {
  label: 'Shortlisted for Round 1',
  variant: 'warning',
  icon: Star,
  },

  in_progress: {
  label: 'In Progress',
  variant: 'warning',
  icon: Clock3,
},

  selected: {
    label: 'Selected',
    variant: 'success',
    icon: Trophy,
  },

  rejected: {
    label: 'Not Qualified',
    variant: 'danger',
    icon: CircleX,
  },

  not_shortlisted: {
    label: 'Not Shortlisted',
    variant: 'danger',
    icon: CircleX,
  },
};


function getExtendedDeadline(date) {
  if (!date) return null;
  return new Date(date);
}

function canApplyNow(drive) {
  // Backend already places this drive in Active Drives.
  // If there is no application, the student can apply.
  return !drive.applicationId;
}
export default function StudentDrives() {
  const [tab, setTab] = useState('active');
  const [drives, setDrives] = useState({ activeDrives: [], pastDrives: [] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [feedbackDrive, setFeedbackDrive] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
  let isMounted = true;

  const fetchDrives = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const res = await studentAPI.getOnCampusDrives();

      if (isMounted) {
        setDrives(res.data.data);
      }
    } catch (err) {
      if (isMounted) {
        toast.error('Failed to load drives');
      }
    } finally {
      if (isMounted && showLoader) {
        setLoading(false);
      }
    }
  };

  // Load immediately when page opens
  fetchDrives(true);

  // Refresh automatically every 10 seconds
  const interval = setInterval(() => {
    fetchDrives(false);
  }, 10000);

  // Refresh immediately when user comes back to this tab/window
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      fetchDrives(false);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    isMounted = false;
    clearInterval(interval);
    document.removeEventListener(
      'visibilitychange',
      handleVisibilityChange
    );
  };
}, []);

  const handleApply = async (driveId, companyName) => {
    try {
      await studentAPI.applyToDrive(driveId);
      toast.success(`Successfully applied to ${companyName}!`);

      const res = await studentAPI.getOnCampusDrives();
      setDrives(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    }
  };

  const currentList = tab === 'active' ? drives.activeDrives : drives.pastDrives;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>
            On-Campus Drives
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            {drives.activeDrives.length} active · {drives.pastDrives.length} past
          </p>
        </div>

       <button
          type="button"
          onClick={() => navigate('/student/feedback')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '8px 14px',
            background: 'rgba(211,84,0,0.08)',
            border: '1px solid rgba(211,84,0,0.25)',
            borderRadius: '8px',
            color: '#B85C00',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          <MessageSquareText size={14} />
          Company Experiences
        </button>
      </div>

      <Tabs
        tabs={[
          {
            value: 'active',
            label: `Active Drives (${drives.activeDrives.length})`,
          },
          {
            value: 'past',
            label: `Past Drives (${drives.pastDrives.length})`,
          },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? (
        <LoadingPage />
      ) : currentList.length === 0 ? (
        <EmptyState
          icon={tab === 'active' ? '🏢' : '📁'}
          title={tab === 'active' ? 'No active drives' : 'No past drives'}
          description={tab === 'active' ? 'New drives will appear here when posted' : 'Completed drives will show here'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {currentList.map(drive => (
            <DriveCard
              key={drive._id}
              drive={drive}
              isPast={tab === 'past'}
              onView={() => setSelected(drive)}
              onApply={() => handleApply(drive._id, drive.companyName)}
              onFeedback={() => setFeedbackDrive(drive)}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.companyName || 'Drive Details'}
        width="640px"
      >
        {selected && <DriveDetail drive={selected} />}
      </Modal>

      <Modal
        open={!!feedbackDrive}
        onClose={() => setFeedbackDrive(null)}
        title={`Feedback — ${feedbackDrive?.companyName}`}
        width="600px"
      >
        {feedbackDrive && (
          <FeedbackForm
            drive={feedbackDrive}
            onSuccess={async () => {
  setFeedbackDrive(null);

  try {
    const res = await studentAPI.getOnCampusDrives();
    setDrives(res.data.data);
    toast.success('Feedback submitted anonymously!');
  } catch (err) {
    toast.success('Feedback submitted anonymously!');
  }
}}
          />
        )}
      </Modal>
    </div>
  );
}

function DriveCard({ drive, isPast, onView, onApply, onFeedback }) {
  const meta = STATUS_META[drive.overallStatus] || {};
  const canGiveFeedback =
  isPast &&
  ['selected', 'rejected', 'not_shortlisted'].includes(drive.overallStatus) &&
  !drive.feedbackSubmitted;
  const isSelected = drive.overallStatus === 'selected';

 const extendedDeadline = getExtendedDeadline(drive.registrationDeadline);

const isDeadlinePassed = extendedDeadline
  ? new Date() > new Date(
      new Date(extendedDeadline).setUTCHours(23, 59, 59, 999)
    )
  : false;
  return (
    <Card
  
  style={{
    border: '1px solid #F4B97A',
    background: '#FFE4BF',
    transition: 'all 0.2s ease',
  }}
//>
>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h3
              style={{
  fontFamily: 'var(--font-display)',
  fontSize: '17px',
  fontWeight: 800,
  color: 'var(--text-primary)',
  transition: 'color 0.2s ease',
}}
            >
              {drive.companyName}
            </h3>

            {drive.overallStatus && (
                <Badge variant={meta.variant || 'default'} size="sm">
                  {meta.icon && (
                    <meta.icon
                      size={12}
                      strokeWidth={2.4}
                      style={{
                        verticalAlign: 'middle',
                        marginRight: '5px',
                      }}
                    />
                  )}
                  {meta.label}
                </Badge>
              )}
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {drive.minPackage && (
             <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                color: 'var(--accent-green)',
              }}
            >
              <Trophy size={14} />
              {drive.minPackage}–{drive.maxPackage} LPA
            </span>
            )}

            <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <GraduationCap size={14} />
            CGPA ≥ {drive.cgpaCutOff}
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <ClipboardList size={14} />
            Max Backlogs: {drive.backlogsAllowed}
          </span>
            {extendedDeadline && (
              <span
                style={{
                  fontSize: '12px',
                  color: isDeadlinePassed
                    ? 'var(--accent-red)'
                    : 'var(--accent-orange)',
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {/* <CalendarDays size={14} /> */}

                  {isDeadlinePassed ? (
                    <>
                      <CircleX size={14} />
                      Registration Closed
                    </>
                  ) : (
                    <>
                      <CalendarDays size={14} />
                      Registration closes on{' '}
                      {extendedDeadline.toLocaleDateString()}
                    </>
                  )}
                </span>
              </span>
            )}
          </div>

        {drive.roundStatuses?.length > 0 && (
  <div
    style={{
      display: 'flex',
      gap: '7px',
      flexWrap: 'wrap',
      marginTop: '4px',
    }}
  >
    {drive.roundStatuses.map((rs, i) => {
   const roundStatus = rs.status || rs._doc?.status;
  const roundNumber = rs.roundNumber || rs._doc?.roundNumber || i + 1;
      const statusStyles = {
        qualified: {
          background: 'rgba(46,139,87,0.10)',
          color: '#2E8B57',
          border: 'rgba(46,139,87,0.28)',
        },

        eligible: {
          background: 'rgba(194,106,0,0.10)',
          color: '#C26A00',
          border: 'rgba(194,106,0,0.28)',
        },

        attended: {
          background: 'rgba(71,85,105,0.10)',
          color: '#475569',
          border: 'rgba(71,85,105,0.25)',
        },

        not_qualified: {
          background: 'rgba(217,74,74,0.10)',
          color: '#D94A4A',
          border: 'rgba(217,74,74,0.28)',
        },

        not_attended: {
          background: 'rgba(217,74,74,0.10)',
          color: '#D94A4A',
          border: 'rgba(217,74,74,0.28)',
        },
      };

      const style =
        statusStyles[roundStatus] || {
          background: 'rgba(107,114,128,0.10)',
          color: '#6B7280',
          border: 'rgba(107,114,128,0.25)',
        };

     const statusLabel = {
  qualified: 'Qualified',
  rejected: 'Rejected',
  not_qualified: 'Rejected',
  eligible: 'Eligible',
  attended: 'Attended',
  not_attended: 'Not Attended',
};

      return (
        <span
          key={i}
          style={{
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '999px',
            background: style.background,
            color: style.color,
            border: `1px solid ${style.border}`,
            fontWeight: 700,
          }}
        >
     {`Round ${roundNumber} ${
  statusLabel[roundStatus] 
}`}   </span>
      );
    })}
  </div>
)}
{isPast && drive.visibilityReason && (
  <div
    style={{
      marginTop: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      color: 'var(--text-muted)',
    }}
  >
    <span style={{ fontSize: '14px' }}>ⓘ</span>
    <span>{drive.visibilityReason}</span>
  </div>
)}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
          <button
          onClick={onView}
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            padding: '8px 16px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <FileText size={14} />
          View Details
        </button>

          {!isPast && canApplyNow(drive) && (
            <button
              onClick={onApply}
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                padding: '8px 16px',
                background: 'var(--accent-primary)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--bg-primary)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <ClipboardCheck size={14} />
              Apply Now
            </button>
          )}

         {canGiveFeedback && (
  <button
    onClick={onFeedback}
    type="button"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: '8px 16px',
      background: 'rgba(211,84,0,0.10)',
      border: '1px solid rgba(211,84,0,0.28)',
      borderRadius: '8px',
      color: 'var(--accent-primary)',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 700,
    }}
  >
    <MessageSquare size={14} />
    Add Feedback
  </button>
)}

{isPast && drive.feedbackSubmitted && (
  <div
    style={{
      padding: '8px 16px',
      border: '1px solid rgba(46,139,87,0.28)',
      borderRadius: '8px',
      color: '#2E8B57',
      fontSize: '12px',
      fontWeight: 700,
    }}
  >
    Feedback Submitted
  </div>
)}

{isPast && drive.feedbackUnavailableReason && (
  <div
    style={{
      maxWidth: '190px',
      padding: '8px 10px',
      borderRadius: '8px',
      background: 'rgba(211,84,0,0.06)',
      border: '1px solid rgba(211,84,0,0.16)',
      color: 'var(--text-muted)',
      fontSize: '11px',
      lineHeight: '1.4',
      textAlign: 'center',
    }}
  >
    {drive.feedbackUnavailableReason}
  </div>
)}
        </div>
      </div>
    </Card>
  );
}

function DriveDetail({ drive }) {
  const extendedDeadline = getExtendedDeadline(
    drive.registrationDeadline
  );

  const isDeadlinePassed = extendedDeadline
  ? new Date() > new Date(
      new Date(extendedDeadline).setUTCHours(23, 59, 59, 999)
    )
  : false;
  const infoItems = [
    ['Company', drive.companyName],
    [
      'Package',
      drive.minPackage
        ? `${drive.minPackage}–${drive.maxPackage} LPA`
        : 'N/A',
    ],
    ['CGPA Cut-off', drive.cgpaCutOff],
    ['Backlogs Allowed', drive.backlogsAllowed],
    [
      'Eligible Batches',
      (drive.eligibleBatches || []).join(', '),
    ],
    [
      'Eligible Branches',
      (drive.eligibleBranches || []).join(', '),
    ],
    ['Status', drive.status],
    [
      'Registration Deadline',
      extendedDeadline
        ? extendedDeadline.toLocaleDateString()
        : 'N/A',
    ],
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      }}
    >
      {/* Information Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {infoItems.map(([label, value]) => (
          <div
            key={label}
            style={{
              padding: '14px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              {label}
            </p>

            <p
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              {value || 'N/A'}
            </p>
          </div>
        ))}

        {/* Registration Link */}
        <div
          style={{
            padding: '14px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginBottom: '7px',
            }}
          >
            Registration
          </p>

          {isDeadlinePassed ? (
            <span
              style={{
                color: 'var(--accent-red)',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              Registration Closed
            </span>
          ) : drive.registrationLink ? (
            <a
              href={drive.registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--accent-primary)',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                cursor: 'pointer',
              }}
            >
              Registration Link
              <ExternalLink size={14} />
            </a>
          ) : (
            <span
              style={{
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              Registration link unavailable
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {drive.description && (
        <div>
          <h4
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
            }}
          >
            Description
          </h4>

          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.7,
              color: 'var(--text-primary)',
            }}
          >
            {drive.description}
          </p>
        </div>
      )}

      {/* Rounds */}
      {drive.rounds?.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginBottom: '10px',
            }}
          >
            Selection Rounds
          </h4>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {drive.rounds.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: '14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(211,84,0,0.10)',
                      border:
                        '1px solid rgba(211,84,0,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-primary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>

                  <strong
                    style={{
                      fontSize: '13px',
                    }}
                  >
                    {r.roundName}
                  </strong>
                </div>

                {r.venue && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    Venue: {r.venue}
                  </p>
                )}

                {r.date && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    Date: {new Date(r.date).toLocaleDateString()}
                  </p>
                )}

                {r.description && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      marginTop: '6px',
                      lineHeight: 1.6,
                    }}
                  >
                    {r.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackForm({ drive, onSuccess }) {
  const [form, setForm] = useState({
    role: '',
    outcome: '',
    rounds: [{ roundName: '', description: '', challenges: '' }],
  });

  const [loading, setLoading] = useState(false);

  const addRound = () =>
    setForm(f => ({
      ...f,
      rounds: [...f.rounds, { roundName: '', description: '', challenges: '' }],
    }));

  const removeRound = (i) =>
    setForm(f => ({
      ...f,
      rounds: f.rounds.filter((_, idx) => idx !== i),
    }));

  const updateRound = (i, field, value) =>
    setForm(f => {
      const rounds = [...f.rounds];
      rounds[i] = { ...rounds[i], [field]: value };
      return { ...f, rounds };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await feedbackAPI.submit({
        driveId: drive._id,
        driveType: 'on-campus',
        companyName: drive.companyName,
        role: form.role,
        outcome: form.outcome,
        rounds: form.rounds,
      });

      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    padding: '9px 12px',
    fontSize: '13px',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Alert type="info">
        Your feedback is completely anonymous — your identity is never stored.
      </Alert>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Role Applied For
          </label>
          <input
            style={inputStyle}
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            placeholder="e.g. Systems Engineer"
          />
        </div>

        <div style={{ flex: 1, minWidth: '220px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Outcome
          </label>
          <select
            style={inputStyle}
            value={form.outcome}
            onChange={e => setForm({ ...form, outcome: e.target.value })}
          >
            <option value="">Select</option>
            <option value="selected">Selected</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {form.rounds.map((round, i) => (
        <div
          key={i}
          style={{
            padding: '14px',
            background: 'var(--bg-elevated)',
            borderRadius: '10px',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)' }}>
              Round {i + 1}
            </span>

            {i > 0 && (
              <button
                type="button"
                onClick={() => removeRound(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-red)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ✕ Remove
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              style={inputStyle}
              placeholder="Round Name (e.g. Technical Interview)"
              value={round.roundName}
              onChange={e => updateRound(i, 'roundName', e.target.value)}
            />

            <textarea
              style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
             placeholder="Questions / Topics covered in this round"
              value={round.description}
              onChange={e => updateRound(i, 'description', e.target.value)}
            />

            <textarea
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
              placeholder="Challenges / Experience"
              value={round.challenges}
              onChange={e => updateRound(i, 'challenges', e.target.value)}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRound}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '10px',
          background: 'rgba(211,84,0,0.08)',
          border: '1px dashed rgba(211,84,0,0.35)',
          borderRadius: '8px',
          color: 'var(--accent-primary)',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        + Add Another Round
      </button>

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
        {loading ? 'Submitting...' : 'Submit Anonymous Feedback'}
      </button>
    </form>
  );
}