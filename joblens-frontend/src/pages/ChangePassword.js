import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChangePassword() {
  const [form, setForm]     = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [err, setErr]       = useState('');
  const [loading, setLoad]  = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const handle = async e => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { setErr("Passwords don't match."); return; }
    if (form.newPassword.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    setLoad(true); setErr('');
    try {
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      updateUser({ isFirstLogin: false });
      navigate(user?.role === 'coordinator' ? '/coordinator' : '/student');
    } catch(ex) {
      setErr(ex.response?.data?.message || 'Failed to change password.');
    } finally { setLoad(false); }
  };
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)' }}>
      <div style={{ width:'100%', maxWidth:440, padding:24 }}>
        <div className="card">
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:'2.5rem', marginBottom:12 }}>🔐</div>
            <h2 style={{ fontSize:'1.5rem', marginBottom:6 }}>Set Your Password</h2>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>
              First login — please set a new password to continue.
            </p>
          </div>
          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="form-group">
              <label className="form-label">Current (Temporary) Password</label>
              <input className="form-input" type="password" placeholder="Enter temporary password"
                value={form.currentPassword} onChange={e => setForm({...form, currentPassword:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" placeholder="Min 8 characters"
                value={form.newPassword} onChange={e => setForm({...form, newPassword:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" placeholder="Repeat new password"
                value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword:e.target.value})} />
            </div>
            {err && <div className="alert alert-danger">{err}</div>}
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              {loading ? <><span className="spinner"/> Saving...</> : '→ Set Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
