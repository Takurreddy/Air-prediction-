import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ── Icons ── */
const WindIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 30, height: 30 }}>
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ width: 16, height: 16 }}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ width: 16, height: 16 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ width: 16, height: 16 }}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/* ── Card shell ── */
function AuthCard({ tab, setTab, children, onGuest }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__icon"><WindIcon /></div>
        <h2 className="auth-card__title">AirAware <span>India</span></h2>
        <p className="auth-card__sub">
          Access India's premier air quality monitoring network
        </p>
        <div className="auth-tabs">
          <button
            className={`auth-tab${tab === "signin" ? " auth-tab--active" : ""}`}
            type="button"
            onClick={() => setTab("signin")}
          >
            Sign In
          </button>
          <button
            className={`auth-tab${tab === "signup" ? " auth-tab--active" : ""}`}
            type="button"
            onClick={() => setTab("signup")}
          >
            Create Account
          </button>
        </div>
        {children}
        <button className="auth-guest" type="button" onClick={onGuest}>
          <UserIcon /> Continue as Guest
        </button>
      </div>
    </div>
  );
}

/* ── Main Auth component — talks directly to FastAPI ── */
export default function Auth() {
  const navigate        = useNavigate();
  const { login }       = useAuth();

  const [tab,       setTab]       = useState("signin");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [otp,       setOtp]       = useState("");
  const [authMethod, setAuthMethod] = useState("email");
  const [otpStep,   setOtpStep]   = useState(false);
  const [devCode,   setDevCode]   = useState("");
  const [password,  setPassword]  = useState("");
  const [fullName,  setFullName]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  function resetForm() {
    setEmail("");
    setPhone("");
    setOtp("");
    setOtpStep(false);
    setDevCode("");
    setPassword("");
    setFullName("");
    setError("");
  }

  function handleTabChange(newTab) {
    setTab(newTab);
    resetForm();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const apiBase = process.env.REACT_APP_API_BASE_URL
      || process.env.REACT_APP_API_URL
      || "https://air-prediction-production.up.railway.app";

    if (authMethod === "phone") {
      if (!phone.trim()) {
        setError("Enter your phone number with country code, for example +919876543210.");
        return;
      }
      setLoading(true);
      try {
        if (!otpStep) {
          const response = await fetch(`${apiBase}/auth/otp/request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone_number: phone.trim(), full_name: fullName.trim() || null }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data?.detail || "Could not send OTP.");
          setDevCode(data?.dev_code || "");
          setOtpStep(true);
          return;
        }

        if (!otp.trim()) {
          setError("Enter the OTP sent to your phone.");
          return;
        }
        const response = await fetch(`${apiBase}/auth/otp/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: phone.trim(), code: otp.trim(), full_name: fullName.trim() || null }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.detail || "Invalid OTP.");
        login(data.access_token, { phone_number: phone.trim(), full_name: fullName.trim() || null });
        navigate("/dashboard");
      } catch (err) {
        setError(err.message || "Could not complete phone sign in.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      if (tab === "signup") {
        /* ── Create account ── */
        const signupRes = await fetch(`${apiBase}/auth/signup`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email:     email.trim().toLowerCase(),
            password,
            full_name: fullName.trim() || null,
          }),
        });

        const signupData = await signupRes.json();

        if (!signupRes.ok) {
          setError(
            signupData?.detail ||
            signupData?.message ||
            "Sign-up failed. Please try again."
          );
          return;
        }

        /* Signup returns a token directly — log the user in */
        login(signupData.access_token, {
          email: email.trim().toLowerCase(),
          full_name: fullName.trim() || null,
        });
        navigate("/dashboard");

      } else {
        /* ── Sign in ── */
        const loginRes = await fetch(`${apiBase}/auth/login`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email:    email.trim().toLowerCase(),
            password,
          }),
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
          setError(
            loginData?.detail ||
            loginData?.message ||
            "Invalid email or password."
          );
          return;
        }

        login(loginData.access_token, {
          email: email.trim().toLowerCase(),
        });
        navigate("/dashboard");
      }

    } catch (err) {
      setError(
        "Could not reach the server. Make sure the backend is reachable."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      tab={tab}
      setTab={handleTabChange}
      onGuest={() => navigate("/dashboard")}
    >
      <form onSubmit={handleSubmit} style={{ width: "100%" }}>

        {/* Full name — signup only */}
        {tab === "signup" && (
          <div className="auth-field">
            <label>Full Name (optional)</label>
            <div className="auth-field__row">
              <span className="auth-field__icon"><UserIcon /></span>
              <input
                type="text"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>
        )}

        {/* Email */}
        <div className="auth-method-switch" role="group" aria-label="Authentication method">
          <button type="button" className={authMethod === "email" ? "active" : ""}
            onClick={() => { setAuthMethod("email"); setOtpStep(false); setError(""); }}>
            Email &amp; password
          </button>
          <button type="button" className={authMethod === "phone" ? "active" : ""}
            onClick={() => { setAuthMethod("phone"); setError(""); }}>
            Phone OTP
          </button>
        </div>

        {authMethod === "phone" ? (
          <>
            {tab === "signup" && (
              <div className="auth-field">
                <label>Full Name (optional)</label>
                <div className="auth-field__row">
                  <span className="auth-field__icon"><UserIcon /></span>
                  <input type="text" placeholder="Your name" value={fullName}
                    onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
                </div>
              </div>
            )}
            <div className="auth-field">
              <label>Phone Number</label>
              <div className="auth-field__row">
                <span className="auth-field__icon"><UserIcon /></span>
                <input type="tel" placeholder="+91 98765 43210" value={phone}
                  onChange={(e) => setPhone(e.target.value)} autoComplete="tel" disabled={otpStep} />
              </div>
            </div>
            {otpStep && (
              <div className="auth-field">
                <label>One-Time Password</label>
                <div className="auth-field__row">
                  <span className="auth-field__icon"><LockIcon /></span>
                  <input type="text" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit OTP"
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    autoComplete="one-time-code" autoFocus />
                </div>
                {devCode && <small className="auth-help">Development OTP: {devCode}</small>}
              </div>
            )}
          </>
        ) : <div className="auth-field">
          <label>Email Address</label>
          <div className="auth-field__row">
            <span className="auth-field__icon"><MailIcon /></span>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>}

        {/* Password */}
        {authMethod === "email" && <div className="auth-field">
          <label>Password</label>
          <div className="auth-field__row">
            <span className="auth-field__icon"><LockIcon /></span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
            />
          </div>
        </div>}

        {/* Error message */}
        {error && (
          <p className="status-message status-error"
            style={{ width: "100%", marginBottom: 12 }}>
            {error}
          </p>
        )}

        <button
          className="auth-submit"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Please wait…"
            : authMethod === "phone"
            ? (otpStep ? "Verify OTP →" : "Send OTP →")
            : tab === "signin" ? "Sign In →" : "Create Account →"}
        </button>
      </form>
    </AuthCard>
  );
}
