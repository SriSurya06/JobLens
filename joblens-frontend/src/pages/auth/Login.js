import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  GraduationCap,
  ShieldCheck,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  Target,
} from 'lucide-react';
export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
const [loading, setLoading] = useState(false);
const [showPass, setShowPass] = useState(false);
const [loginType, setLoginType] = useState('student');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
     const { user } = await login(form.email, form.password);

if (user.role !== loginType) {
  toast.error(
    `This account is registered as ${user.role}. Please use the ${user.role} login.`
  );
  return;
}

if (user.isFirstLogin) {
  toast('Welcome! Please change your default password.');
  navigate('/change-password');
} else if (user.role === 'coordinator') {
  navigate('/coordinator/dashboard');
} else {
  navigate('/student/dashboard');
}
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

 return (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      backgroundImage:
        'radial-gradient(circle at 15% 20%, rgba(230,126,34,0.10), transparent 35%), radial-gradient(circle at 85% 80%, rgba(230,126,34,0.07), transparent 35%)',
      padding: '24px',
    }}
  >
    {/* Main Login Container */}
    <div
      style={{
        width: '100%',
        maxWidth: '1050px',
        minHeight: '620px',
        display: 'grid',
        gridTemplateColumns: '0.9fr 1.1fr',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: '0 25px 70px rgba(0,0,0,0.12)',
      }}
    >

      {/* ================= LEFT BRANDING ================= */}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '55px',
          overflow: 'hidden',
          background:
            'linear-gradient(145deg, #fff7ed 0%, #ffedd5 55%, #fff8f1 100%)',
        }}
      >
        {/* Decorative circles */}

        <div
          style={{
            position: 'absolute',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'rgba(230,126,34,0.10)',
            top: -120,
            right: -100,
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: '50%',
            border: '1px solid rgba(230,126,34,0.18)',
            bottom: -80,
            left: -80,
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>

          {/* Logo */}

          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'linear-gradient(135deg, #f97316, #e67e22)',
              color: '#fff',
              boxShadow: '0 10px 28px rgba(230,126,34,0.28)',
              marginBottom: 24,
            }}
          >
            <Target size={32} strokeWidth={2.2} />
          </div>

          <h1
            style={{
              fontSize: '42px',
              fontWeight: 850,
              letterSpacing: '-1.5px',
              color: '#3a2415',
              margin: 0,
            }}
          >
            Job<span style={{ color: '#e67e22' }}>Lens</span>
          </h1>

          <p
            style={{
              marginTop: 14,
              maxWidth: 380,
              fontSize: 16,
              lineHeight: 1.6,
              color: '#6b4b35',
            }}
          >
            Campus Placement Management System
          </p>

          {/* Feature cards */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginTop: 40,
            }}
          >
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(230,126,34,0.16)',
              }}
            >
              <ShieldCheck
                size={21}
                color="#e67e22"
              />

              <div
                style={{
                  marginTop: 9,
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#4a2f1e',
                }}
              >
                Secure Access
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: '#7a604c',
                }}
              >
                Role-based authentication
              </div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(230,126,34,0.16)',
              }}
            >
              <GraduationCap
                size={21}
                color="#e67e22"
              />

              <div
                style={{
                  marginTop: 9,
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#4a2f1e',
                }}
              >
                Placement Hub
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: '#7a604c',
                }}
              >
                Manage your opportunities
              </div>
            </div>
          </div>

        </div>
      </div>


      {/* ================= RIGHT LOGIN ================= */}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '50px 60px',
          background: 'var(--bg-card)',
        }}
      >

        <div
          style={{
            maxWidth: 440,
            width: '100%',
            margin: '0 auto',
          }}
        >

          {/* Header */}

          <div style={{ marginBottom: 26 }}>

            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--accent-primary)',
                marginBottom: 8,
                letterSpacing: '0.04em',
              }}
            >
              WELCOME TO JOBLENS
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              Sign in to continue
            </h2>

            <p
              style={{
                marginTop: 8,
                color: 'var(--text-secondary)',
                fontSize: 13,
              }}
            >
              Select your account type before signing in.
            </p>

          </div>


          {/* ================= ROLE SELECTOR ================= */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              padding: 5,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 15,
              marginBottom: 26,
            }}
          >

            {/* Coordinator */}

            <button
              type="button"
              onClick={() => {
                setLoginType('coordinator');
                setForm({ email: '', password: '' });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '13px 10px',
                borderRadius: 11,
                border:
                  loginType === 'coordinator'
                    ? '1px solid rgba(230,126,34,0.35)'
                    : '1px solid transparent',
                background:
                  loginType === 'coordinator'
                    ? 'rgba(230,126,34,0.13)'
                    : 'transparent',
                color:
                  loginType === 'coordinator'
                    ? 'var(--accent-primary)'
                    : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <ShieldCheck size={18} />
              Coordinator
            </button>


            {/* Student */}

            <button
              type="button"
              onClick={() => {
                setLoginType('student');
                setForm({ email: '', password: '' });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '13px 10px',
                borderRadius: 11,
                border:
                  loginType === 'student'
                    ? '1px solid rgba(230,126,34,0.35)'
                    : '1px solid transparent',
                background:
                  loginType === 'student'
                    ? 'rgba(230,126,34,0.13)'
                    : 'transparent',
                color:
                  loginType === 'student'
                    ? 'var(--accent-primary)'
                    : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <GraduationCap size={18} />
              Student
            </button>

          </div>


          {/* ================= SELECTED ROLE ================= */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 22,
            }}
          >

            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(230,126,34,0.11)',
                color: 'var(--accent-primary)',
              }}
            >
              {loginType === 'coordinator' ? (
                <ShieldCheck size={22} />
              ) : (
                <GraduationCap size={22} />
              )}
            </div>

            <div>

              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                {loginType === 'coordinator'
                  ? 'Coordinator Login'
                  : 'Student Login'}
              </div>

              <div
                style={{
                  marginTop: 3,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                {loginType === 'coordinator'
                  ? 'Manage campus placements and drives'
                  : 'Explore drives and placement opportunities'}
              </div>

            </div>

          </div>


          {/* ================= FORM ================= */}

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 17,
            }}
          >

            {/* Email */}

            <div>

              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginBottom: 7,
                  fontWeight: 600,
                }}
              >
                College Email
              </label>

              <div style={{ position: 'relative' }}>

                <Mail
                  size={17}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />

                <input
                  type="email"
                  placeholder={
                    loginType === 'coordinator'
                      ? 'coordinator@college.edu'
                      : 'student@college.edu'
                  }
                  value={form.email}
                  onChange={e =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    color: 'var(--text-primary)',
                    padding: '13px 16px 13px 43px',
                    fontSize: 14,
                    outline: 'none',
                  }}
                  onFocus={e =>
                    e.target.style.borderColor =
                      'var(--accent-primary)'
                  }
                  onBlur={e =>
                    e.target.style.borderColor =
                      'var(--border)'
                  }
                />

              </div>

            </div>


            {/* Password */}

            <div>

              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginBottom: 7,
                  fontWeight: 600,
                }}
              >
                Password
              </label>

              <div style={{ position: 'relative' }}>

                <LockKeyhole
                  size={17}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />

                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    color: 'var(--text-primary)',
                    padding: '13px 45px 13px 43px',
                    fontSize: 14,
                    outline: 'none',
                  }}
                  onFocus={e =>
                    e.target.style.borderColor =
                      'var(--accent-primary)'
                  }
                  onBlur={e =>
                    e.target.style.borderColor =
                      'var(--border)'
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 11,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={
                    showPass
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPass ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

            </div>


            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background:
                  'linear-gradient(135deg, #e67e22, #f39c12)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 750,
                cursor: loading
                  ? 'not-allowed'
                  : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow:
                  '0 7px 20px rgba(230,126,34,0.22)',
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.35)',
                      borderTop: '2px solid #fff',
                      borderRadius: '50%',
                      animation:
                        'spin 0.7s linear infinite',
                    }}
                  />
                  Signing in...
                </>
              ) : (
                <>
                  {loginType === 'coordinator'
                    ? 'Coordinator Sign In'
                    : 'Student Sign In'}

                  <ArrowRight size={17} />
                </>
              )}
            </button>

          </form>


          {/* Forgot Password */}

          <div
            style={{
              marginTop: 18,
              textAlign: 'center',
            }}
          >
            <button
              onClick={() =>
                navigate('/forgot-password')
              }
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Forgot password?
            </button>
          </div>


          {/* Bottom information */}

          <div
            style={{
              marginTop: 26,
              padding: '12px 14px',
              background: 'rgba(230,126,34,0.06)',
              border:
                '1px solid rgba(230,126,34,0.14)',
              borderRadius: 12,
              fontSize: 11.5,
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
              textAlign: 'center',
            }}
          >
            {loginType === 'coordinator'
              ? 'Coordinator accounts are authorized for placement administration.'
              : 'Student accounts are authorized for placement opportunities and student tools.'}
          </div>

        </div>
      </div>

    </div>
  </div>
);
}