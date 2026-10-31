import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock3,
  BriefcaseBusiness,
} from 'lucide-react';
import { studentAPI } from '../../services/api';
import { Card, Badge, LoadingPage } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  selected: '#2E8B57',
  rejected: '#D94A4A',
  in_progress: '#D97706',
  shortlisted: '#C26A00',
  registered: '#B7791F',
  not_shortlisted: '#6B7280',
};

const STATUS_LABELS = {
  selected: 'Selected',
  rejected: 'Rejected',
  in_progress: 'In Progress',
  shortlisted: 'Shortlisted',
  registered: 'Registered',
  not_shortlisted: 'Not Shortlisted',
};

const STATUS_ICONS = {
  applied: FileText,
  selected: CheckCircle2,
  rejected: XCircle,
  in_progress: Clock3,
  shortlisted: BriefcaseBusiness,
  registered: BriefcaseBusiness,
  not_shortlisted: XCircle,
};

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    studentAPI
      .getDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage text="Loading your dashboard..." />;
  if (!data) return null;

  const statusData = Object.entries(data.statusBreakdown || {})
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: STATUS_LABELS[k] || k,
      value: v,
      fill: STATUS_COLORS[k] || '#00d4ff',
    }));

  const barData = Object.entries(data.statusBreakdown || {}).map(([k, v]) => ({
    name: STATUS_LABELS[k] || k,
    count: v,
    fill: STATUS_COLORS[k] || '#00d4ff',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Welcome Banner */}
      <div
        style={{
          background:
            'linear-gradient(135deg, #FFF1DD 0%, #FFE4BF 100%)',
          border: '1px solid #F4B97A',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 800,
              marginBottom: '6px',
            }}
          >
            Welcome back, {data.student.name?.split(' ')[0]} 👋
          </h1>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              🎓 {data.student.branch} · Batch {data.student.passedOutYear}
            </span>

            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              📊 CGPA:{' '}
              <span
                style={{
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                }}
              >
                {data.student.cgpa}
              </span>
            </span>

            {!data.student.hasResume && (
              <span
                style={{
                  fontSize: '13px',
                  color: 'var(--accent-orange)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={() => navigate('/student/profile')}
              >
                ⚠ Upload your resume to apply for drives
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate('/student/drives')}
          style={{
            padding: '10px 20px',
            background: 'var(--accent-primary)',
            color: 'var(--bg-primary)',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          View Drives →
        </button>
      </div>

      

      {/* Application Status */}
{/* {data.totalApplications > 0 && ( */}
  <Card className="application-status-card">

    {/* Header */}
    <div className="application-status-header">
      <div>
        <div className="application-status-title">
          <div className="application-status-title-icon">
            <BriefcaseBusiness size={20} />
          </div>

          <div>
            <h3>Application Status</h3>
            <p>
              Track your applications and current progress
            </p>
          </div>
        </div>
      </div>

      <div className="application-total">
        <span>Total</span>
        <strong>{data.totalApplications}</strong>
      </div>
    </div>


    {/* Status Cards */}
    <div className="application-status-grid">

      {[
        {
          key: 'applied',
          label: 'Applied',
          value: data.stats?.drivesApplied || 0,
          color: '#D97706',
        },
        {
          key: 'selected',
          label: 'Selected',
          value: data.stats?.drivesSelected || 0,
          color: '#2E8B57',
        },
        {
          key: 'rejected',
          label: 'Rejected',
          value: data.stats?.drivesRejected || 0,
          color: '#D94A4A',
        },
        {
          key: 'in_progress',
          label: 'In Progress',
          value: data.statusBreakdown?.in_progress || 0,
          color: '#C26A00',
        },
      ].map((item) => {

        const Icon = STATUS_ICONS[item.key];

        return (
          <div
            key={item.key}
            className="application-status-item"
            style={{
              '--status-color': item.color,
            }}
          >

            <div className="application-status-icon">
              <Icon size={20} strokeWidth={2.2} />
            </div>

            <div className="application-status-info">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>

          </div>
        );
      })}

    </div>


    {/* Application Overview */}
    <div className="application-overview">

      <div className="application-overview-header">
        <div>
          <h4>Application Overview</h4>
          <p>
            Current distribution of your applications
          </p>
        </div>
      </div>


      <div className="application-overview-list">

        {[
          {
            label: 'Applied',
            value: data.stats?.drivesApplied || 0,
            color: '#D97706',
          },
          {
            label: 'Selected',
            value: data.stats?.drivesSelected || 0,
            color: '#2E8B57',
          },
          {
            label: 'Rejected',
            value: data.stats?.drivesRejected || 0,
            color: '#D94A4A',
          },
          {
            label: 'In Progress',
            value: data.statusBreakdown?.in_progress || 0,
            color: '#C26A00',
          },
        ].map((item) => {

          const percentage =
            data.totalApplications > 0
              ? (item.value / data.totalApplications) * 100
              : 0;

          return (
            <div
              key={item.label}
              className="application-overview-row"
            >

              <div className="application-overview-label">
                <span
                  className="application-overview-dot"
                  style={{
                    background: item.color,
                  }}
                />

                <span>{item.label}</span>
              </div>

              <div className="application-overview-progress">
                <div className="application-progress-track">
                  <div
                    className="application-progress-fill"
                    style={{
                      width: `${Math.max(
                        percentage,
                        item.value > 0 ? 8 : 0
                      )}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>

              <strong className="application-overview-value">
                {item.value}
              </strong>

            </div>
          );
        })}

      </div>

    </div>

  </Card>
{/* )} */}


      {/* Selected Companies */}
      {(() => {
        const selectedCompanies = (data.driveHistory || []).filter(
          (app) => app.overallStatus === 'selected'
        );

        if (!selectedCompanies.length) return null;

        return (
          <Card>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                marginBottom: '16px',
              }}
            >
              Selected Companies
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedCompanies.slice(0, 5).map((app) => (
                <div
                  key={app.applicationId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius)',
                    flexWrap: 'wrap',
                    gap: '8px',
                    border: '1px solid rgba(0,230,118,0.2)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>
                      {app.companyName}
                    </span>

                    {app.appliedAt && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          marginLeft: '8px',
                        }}
                      >
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <Badge variant="success" size="sm">
                    Selected
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}
    </div>
  );
}