import React, { useState } from 'react';

// ── Button ───
export const Button = ({ children, variant = 'primary', size = 'md', loading, disabled, className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 select-none';
  const variants = {
    primary:  'bg-accent text-bg-primary hover:opacity-90 active:scale-95',
    secondary:'bg-bg-elevated text-text-primary border border-border hover:border-accent hover:text-accent',
    danger:   'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
    ghost:    'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
    success:  'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };
  const styles = {
    background: variant === 'primary' ? 'var(--accent-primary)' : undefined,
    color: variant === 'primary' ? 'var(--bg-primary)' : undefined,
  };
  if (variant === 'secondary') styles.borderColor = 'var(--border)';
  return (
    <button
      style={styles}
      className={`${base} ${sizes[size]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
};
// ── Input ────
export const Input = ({ label, error, className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>{label}</label>}
    <input
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${error ? 'var(--accent-red)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        color: 'var(--text-primary)',
        padding: '10px 14px',
        fontSize: '14px',
        width: '100%',
        transition: 'border-color 0.2s',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
      onBlur={e => e.target.style.borderColor = error ? 'var(--accent-red)' : 'var(--border)'}
      {...props}
    />
    {error && <span style={{ color: 'var(--accent-red)', fontSize: '12px' }}>{error}</span>}
  </div>
);
// ── Select ───
export const Select = ({ label, error, children, className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>{label}</label>}
    <select
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${error ? 'var(--accent-red)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        color: 'var(--text-primary)',
        padding: '10px 14px',
        fontSize: '14px',
        width: '100%',
      }}
      {...props}
    >
      {children}
    </select>
    {error && <span style={{ color: 'var(--accent-red)', fontSize: '12px' }}>{error}</span>}
  </div>
);
// ── Textarea ───
export const Textarea = ({ label, error, className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>{label}</label>}
    <textarea
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${error ? 'var(--accent-red)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        color: 'var(--text-primary)',
        padding: '10px 14px',
        fontSize: '14px',
        width: '100%',
        minHeight: '100px',
        resize: 'vertical',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
      onBlur={e => e.target.style.borderColor = error ? 'var(--accent-red)' : 'var(--border)'}
      {...props}
    />
    {error && <span style={{ color: 'var(--accent-red)', fontSize: '12px' }}>{error}</span>}
  </div>
);

// ── Card ──────
export const Card = ({ children, className = '', glow, style = {}, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      boxShadow: glow ? 'var(--shadow-glow)' : 'var(--shadow-card)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'var(--transition)',
      ...style,
    }}
    className={className}
  >
    {children}
  </div>
);
// ── Badge ───
export const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const colors = {
    default:  { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: 'var(--border)' },
    primary:  { bg: 'rgba(0,212,255,0.1)', color: 'var(--accent-primary)', border: 'rgba(0,212,255,0.2)' },
    success:  { bg: 'rgba(0,230,118,0.1)', color: 'var(--accent-green)', border: 'rgba(0,230,118,0.2)' },
    danger:   { bg: 'rgba(255,71,87,0.1)', color: 'var(--accent-red)', border: 'rgba(255,71,87,0.2)' },
    warning:  { bg: 'rgba(255,107,53,0.1)', color: 'var(--accent-orange)', border: 'rgba(255,107,53,0.2)' },
    purple:   { bg: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: 'rgba(124,58,237,0.2)' },
  };
  const c = colors[variant] || colors.default;
  const padding = size === 'sm' ? '2px 8px' : '4px 12px';
  const fontSize = size === 'sm' ? '11px' : '12px';
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: '999px', padding, fontSize, fontWeight: 600,
      display: 'inline-block', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
};
// ── Spinner ────────
export const Spinner = ({ size = 20, color = 'var(--accent-primary)' }) => (
  <div style={{
    width: size, height: size, minWidth: size, minHeight: size,
    border: `2px solid transparent`,
    borderTop: `2px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  }} />
);
// ── Modal ───
// ── Modal ───
export const Modal = ({ open, onClose, title, children, width = '560px' }) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="joblens-modal"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflow: 'hidden',
          animation: 'slideUp 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              margin: 0,
            }}
          >
            {title}
          </h3>

          <button
            onClick={onClose}
            type="button"
            style={{
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '20px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          className="joblens-modal-body"
          style={{
            overflowY: 'auto',
            minHeight: 0,
            padding: '24px',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
// ── StatCard ─────
export const StatCard = ({ label, value, icon, color = 'var(--accent-primary)', trend }) => (
  <Card>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
        <p style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 800, color }}>{value}</p>
        {trend && <p style={{ fontSize: '12px', color: 'var(--accent-green)', marginTop: '4px' }}>{trend}</p>}
      </div>
      <div style={{ background: `${color}15`, borderRadius: '12px', padding: '12px', color }}>{icon}</div>
    </div>
  </Card>
);
// ── Table ─────
export const Table = ({ headers, children, empty = 'No data found' }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} style={{
              padding: '12px 16px', textAlign: 'left',
              color: 'var(--text-secondary)', fontSize: '11px',
              fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
              borderBottom: '1px solid var(--border)',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
    {!children?.length && (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{empty}</div>
    )}
  </div>
);
export const Tr = ({ children, onClick }) => (
  <tr
    onClick={onClick}
    style={{
      borderBottom: '1px solid var(--border)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
  >
    {children}
  </tr>
);
export const Td = ({ children, style = {} }) => (
  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-primary)', ...style }}>
    {children}
  </td>
);
// ── Tabs ─────
export const Tabs = ({ tabs, active, onChange }) => (
  <div style={{
    display: 'flex', gap: '4px', background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius)', padding: '4px', border: '1px solid var(--border)',
    overflowX: 'auto',
  }}>
    {tabs.map(tab => (
      <button
        key={tab.value}
        onClick={() => onChange(tab.value)}
        style={{
          padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
          background: active === tab.value ? 'var(--accent-primary)' : 'transparent',
          color: active === tab.value ? 'var(--bg-primary)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap', transition: 'var(--transition)',
        }}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
// ── Alert ───
export const Alert = ({ type = 'info', children }) => {
  const colors = {
    info:    { bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)', color: 'var(--accent-primary)' },
    success: { bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.2)', color: 'var(--accent-green)' },
    danger:  { bg: 'rgba(255,71,87,0.08)', border: 'rgba(255,71,87,0.2)', color: 'var(--accent-red)' },
    warning: { bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.2)', color: 'var(--accent-orange)' },
  };
  const c = colors[type];
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 'var(--radius)',
      padding: '12px 16px', color: c.color, fontSize: '13px',
    }}>
      {children}
    </div>
  );
};
// ── Progress Bar ───
export const ProgressBar = ({ value, max = 100, color = 'var(--accent-primary)', label }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ fontSize: '12px', color, fontWeight: 600 }}>{pct}%</span>
        </div>
      )}
      <div style={{ background: 'var(--bg-elevated)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color,
          borderRadius: '999px', transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
};
// ── Empty State ─────
export const EmptyState = ({ icon, title, description, action }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon || '📭'}</div>
    <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px' }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{description}</p>
    {action}
  </div>
);
// Loading Page 
export const LoadingPage = ({ text = 'Loading...' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
    <Spinner size={40} />
    <p style={{ color: 'var(--text-secondary)' }}>{text}</p>
  </div>
);