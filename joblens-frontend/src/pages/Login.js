import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ThemeSwitcher } from "../../components/shared";
import {
  GraduationCap,
  ShieldCheck,
  Mail,
  LockKeyhole,
  ArrowRight,
  BriefcaseBusiness,
} from "lucide-react";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState("student");
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErr("Please fill all fields.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const user = await login(email, password);

if (user.role !== loginType) {
  setErr(
    `This account is registered as ${user.role}. Please use the ${user.role} login.`
  );
  return;
}

if (user.isFirstLogin) {
  navigate("/change-password");
  return;
}

navigate(
  user.role === "coordinator"
    ? "/coordinator"
    : "/student"
);
    } catch (ex) {
      setErr(ex.response?.data?.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--bg-base)",
      }}
    >
      {/* Left panel – branding */}
      <div
        style={{
          flex: 1,
          background:
            "linear-gradient(135deg, #0a0e1a 0%, #1a2235 50%, #0f172a 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
          display: window.innerWidth < 900 ? "none" : "flex",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 500,
            height: 500,
            borderRadius: "50%",
            border: "1px solid rgba(249,115,22,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 340,
            height: 340,
            borderRadius: "50%",
            border: "1px solid rgba(249,115,22,0.05)",
          }}
        />

        <div style={{ position: "relative", textAlign: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              background: "linear-gradient(135deg, #f97316, #c2410c)",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              color: "#fff",
              fontWeight: 800,
              margin: "0 auto 24px",
              fontFamily: "var(--font-display)",
              boxShadow: "0 8px 32px rgba(249,115,22,0.4)",
            }}
          >
            JL
          </div>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              color: "#f1f5f9",
              marginBottom: 12,
            }}
          >
            JobLens
          </h1>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "1rem",
              maxWidth: 320,
              lineHeight: 1.6,
            }}
          >
            Centralized Campus Placement &amp; Drive Management System
          </p>
          <div
            style={{
              display: "flex",
              gap: 24,
              justifyContent: "center",
              marginTop: 40,
            }}
          >
            {[
              { icon: "🏢", label: "On-Campus Drives" },
              { icon: "🌐", label: "Off-Campus Access" },
              { icon: "🤖", label: "AI-Powered Tools" },
              { icon: "🛡️", label: "Fraud Detection" },
            ].map((f) => (
              <div
                key={f.label}
                style={{
                  background: "rgba(249,115,22,0.08)",
                  border: "1px solid rgba(249,115,22,0.2)",
                  borderRadius: 12,
                  padding: "12px 10px",
                  textAlign: "center",
                  minWidth: 80,
                }}
              >
                <div style={{ fontSize: "1.4rem" }}>{f.icon}</div>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "#94a3b8",
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {f.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    {/* Right panel – login */}
<div
  style={{
    width: 500,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "48px 42px",
    background: "var(--bg-surface)",
    borderLeft: "1px solid var(--border)",
    position: "relative",
  }}
>
  {/* Theme switcher */}
  <div
    style={{
      position: "absolute",
      top: 24,
      right: 24,
    }}
  >
    <ThemeSwitcher />
  </div>

  {/* Heading */}
  <div style={{ marginBottom: 28 }}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        color: "var(--accent-primary)",
        fontSize: 13,
        fontWeight: 700,
        marginBottom: 10,
      }}
    >
      <BriefcaseBusiness size={17} />
      JOBLENS
    </div>

    <h2
      style={{
        fontSize: "1.8rem",
        fontWeight: 800,
        marginBottom: 8,
        color: "var(--text-primary)",
      }}
    >
      Welcome back
    </h2>

    <p
      style={{
        color: "var(--text-secondary)",
        fontSize: "0.9rem",
        margin: 0,
      }}
    >
      Choose your account type to continue.
    </p>
  </div>

  {/* Login type selector */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      padding: 5,
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      marginBottom: 28,
    }}
  >
    <button
      type="button"
      onClick={() => {
        setLoginType("coordinator");
        setErr("");
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "11px 10px",
        borderRadius: 10,
        border:
          loginType === "coordinator"
            ? "1px solid rgba(230,126,34,0.35)"
            : "1px solid transparent",
        background:
          loginType === "coordinator"
            ? "rgba(230,126,34,0.12)"
            : "transparent",
        color:
          loginType === "coordinator"
            ? "var(--accent-primary)"
            : "var(--text-secondary)",
        fontWeight: loginType === "coordinator" ? 700 : 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <ShieldCheck size={17} />
      Coordinator
    </button>

    <button
      type="button"
      onClick={() => {
        setLoginType("student");
        setErr("");
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "11px 10px",
        borderRadius: 10,
        border:
          loginType === "student"
            ? "1px solid rgba(230,126,34,0.35)"
            : "1px solid transparent",
        background:
          loginType === "student"
            ? "rgba(230,126,34,0.12)"
            : "transparent",
        color:
          loginType === "student"
            ? "var(--accent-primary)"
            : "var(--text-secondary)",
        fontWeight: loginType === "student" ? 700 : 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <GraduationCap size={17} />
      Student
    </button>
  </div>

  {/* Selected login heading */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 22,
    }}
  >
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(230,126,34,0.12)",
        color: "var(--accent-primary)",
      }}
    >
      {loginType === "coordinator" ? (
        <ShieldCheck size={21} />
      ) : (
        <GraduationCap size={21} />
      )}
    </div>

    <div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: "var(--text-primary)",
        }}
      >
        {loginType === "coordinator"
          ? "Coordinator Login"
          : "Student Login"}
      </div>

      <div
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          marginTop: 3,
        }}
      >
        {loginType === "coordinator"
          ? "Access placement management tools"
          : "Access your placement opportunities"}
      </div>
    </div>
  </div>

  {/* Login form */}
  <form
    onSubmit={handleSubmit}
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 18,
    }}
  >
    <div className="form-group">
      <label className="form-label">College Email</label>

      <div style={{ position: "relative" }}>
        <Mail
          size={17}
          style={{
            position: "absolute",
            left: 13,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />

        <input
          className="form-input"
          type="email"
          placeholder={
            loginType === "coordinator"
              ? "coordinator@college.edu"
              : "student@college.edu"
          }
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          style={{
            paddingLeft: 42,
          }}
        />
      </div>
    </div>

    <div className="form-group">
      <label className="form-label">Password</label>

      <div style={{ position: "relative" }}>
        <LockKeyhole
          size={17}
          style={{
            position: "absolute",
            left: 13,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />

        <input
          className="form-input"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            paddingLeft: 42,
          }}
        />
      </div>
    </div>

    {err && <div className="alert alert-danger">{err}</div>}

    <button
      className="btn btn-primary btn-lg"
      type="submit"
      disabled={loading}
      style={{
        marginTop: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {loading ? (
        <>
          <span className="spinner" />
          Signing in...
        </>
      ) : (
        <>
          {loginType === "coordinator"
            ? "Coordinator Sign In"
            : "Student Sign In"}

          <ArrowRight size={17} />
        </>
      )}
    </button>

    <div style={{ textAlign: "center" }}>
      <a
        href="/forgot-password"
        style={{
          fontSize: "0.875rem",
          color: "var(--text-muted)",
        }}
      >
        Forgot password?
      </a>
    </div>
  </form>

  {/* Login information */}
  <div
    style={{
      marginTop: 28,
      padding: "13px 15px",
      background: "rgba(230,126,34,0.06)",
      borderRadius: 12,
      border: "1px solid rgba(230,126,34,0.14)",
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
    }}
  >
    {loginType === "coordinator" ? (
      <ShieldCheck
        size={17}
        color="var(--accent-primary)"
        style={{ marginTop: 1, flexShrink: 0 }}
      />
    ) : (
      <GraduationCap
        size={17}
        color="var(--accent-primary)"
        style={{ marginTop: 1, flexShrink: 0 }}
      />
    )}

    <div
      style={{
        fontSize: 12,
        color: "var(--text-secondary)",
        lineHeight: 1.5,
      }}
    >
      {loginType === "coordinator"
        ? "Coordinator accounts can access drive management, student records, rounds and placement administration."
        : "Student accounts can access campus drives, off-campus opportunities, profile and AI placement tools."}
    </div>
  </div>
</div>
</div>
  );
}