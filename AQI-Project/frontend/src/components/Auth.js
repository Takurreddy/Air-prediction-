import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import runtimeConfig from "../config/runtimeConfig";

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

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ width: 16, height: 16 }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const COUNTRIES = [
  { code: "+91", label: "India", flag: "🇮🇳" },
  { code: "+1",  label: "USA / Canada", flag: "🇺🇸" },
  { code: "+44", label: "UK", flag: "🇬🇧" },
  { code: "+971", label: "UAE", flag: "🇦🇪" },
  { code: "+65", label: "Singapore", flag: "🇸🇬" },
  { code: "+61", label: "Australia", flag: "🇦🇺" },
];

/* ── Card shell ── */
function AuthCard({ tab, setTab, children, onGuest }) {
  return (
    <div className="auth-page">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      <div className="auth-card">
        <div className="auth-card__icon"><WindIcon /></div>
        <h2 className="auth-card__title">AirAware <span>India</span></h2>
        <p className="auth-card__sub">
          Access India's premier air quality monitoring network
        </p>
        {tab === "forgot" ? (
          <div className="auth-tabs">
            <button className="auth-tab auth-tab--active" type="button" style={{ background: 'transparent', color: 'var(--text-main)', boxShadow: 'none' }}>
              Reset Password
            </button>
            <button className="auth-tab" type="button" onClick={() => setTab("signin")}>
              Back to Sign In
            </button>
          </div>
        ) : (
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
        )}
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
  const [countryCode, setCountryCode] = useState("+91");
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [otp,       setOtp]       = useState("");
  const [authMethod, setAuthMethod] = useState("email");
  const [otpStep,   setOtpStep]   = useState(false);
  const [password,  setPassword]  = useState("");
  const [fullName,  setFullName]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function resetForm() {
    setEmail("");
    setPhone("");
    setOtp("");
    setOtpStep(false);
    setPassword("");
    setFullName("");
    setError("");
    setSuccessMsg("");
  }

  function handleTabChange(newTab) {
    setTab(newTab);
    resetForm();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (tab === "forgot") {
      if (!email.trim()) {
        setError("Enter your email address.");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${runtimeConfig.apiBaseUrl}/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Request failed.");
        setSuccessMsg(data.message || "Reset link sent!");
      } catch (err) {
        setError(err.message || "Could not send reset link.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (authMethod === "phone") {
      if (!phone.trim()) {
        setError("Enter your phone number.");
        return;
      }
      const fullPhone = `${countryCode}${phone.trim()}`;
      setLoading(true);
      try {
        if (!otpStep) {
          const res = await fetch(`${runtimeConfig.apiBaseUrl}/auth/otp/request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone_number: fullPhone })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || "Failed to request OTP.");
          
          setOtpStep(true);
          return;
        }

        if (!otp.trim()) {
          setError("Enter the OTP sent to your phone.");
          return;
        }
        
        const payload = {
          phone_number: fullPhone,
          code: otp.trim(),
        };
        
        if (tab === "signup" && fullName.trim()) {
          payload.full_name = fullName.trim();
        }

        const res = await fetch(`${runtimeConfig.apiBaseUrl}/auth/otp/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.detail || "Invalid OTP.");

        login(data.access_token, { phone_number: fullPhone, full_name: fullName.trim() || null });
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
        const res = await fetch(`${runtimeConfig.apiBaseUrl}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password,
            full_name: fullName.trim() || null
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to create account.");

        login(data.access_token, {
          email: email.trim().toLowerCase(),
          full_name: fullName.trim() || null,
        });
        navigate("/dashboard");

      } else {
        const res = await fetch(`${runtimeConfig.apiBaseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Invalid email or password.");

        login(data.access_token, {
          email: email.trim().toLowerCase(),
        });
        navigate("/dashboard");
      }

    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
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

        <div style={{ textAlign: "center", margin: "8px 0", color: "#888", fontSize: "0.9rem" }}></div>

        {/* Auth method toggle */}
        {tab !== "forgot" && (
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
        )}

        {authMethod === "phone" && tab !== "forgot" ? (
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
              <div className="auth-phone-wrap">
                {/* Custom Glassmorphism Country Code Selector */}
                <div className="auth-country-selector">
                  <button
                    type="button"
                    className="auth-country-btn"
                    disabled={otpStep}
                    onClick={() => setShowCountryMenu(prev => !prev)}
                  >
                    <span className="auth-country-flag">{COUNTRIES.find(c => c.code === countryCode)?.flag || "🇮🇳"}</span>
                    <span className="auth-country-code">{countryCode}</span>
                    <span className="auth-country-arrow">▾</span>
                  </button>

                  {showCountryMenu && !otpStep && (
                    <div className="auth-country-menu">
                      {COUNTRIES.map(c => (
                        <div
                          key={c.code}
                          className={`auth-country-option${c.code === countryCode ? " active" : ""}`}
                          onClick={() => {
                            setCountryCode(c.code);
                            setShowCountryMenu(false);
                          }}
                        >
                          <span className="auth-country-flag">{c.flag}</span>
                          <span className="auth-country-label">{c.label}</span>
                          <span className="auth-country-code">{c.code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone Input with PhoneIcon */}
                <div className="auth-field__row" style={{ flex: 1 }}>
                  <span className="auth-field__icon"><PhoneIcon /></span>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    autoComplete="tel"
                    disabled={otpStep}
                  />
                </div>
              </div>
            </div>
            {otpStep && (
              <div className="auth-field">
                <label>One-Time Password</label>
                <div className="auth-field__row">
                  <span className="auth-field__icon"><LockIcon /></span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>
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
        {authMethod === "email" && tab !== "forgot" && (
          <div className="auth-field">
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
          {tab === "signin" && (
            <button type="button" className="auth-field__forgot" onClick={() => setTab("forgot")} style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, padding: 0 }}>
              Forgot password?
            </button>
          )}
        </div>)}

        {/* Success message */}
        {successMsg && (
          <p className="status-message status-success"
            style={{ width: "100%", marginBottom: 12, color: 'var(--teal-lt)', textAlign: 'center', fontSize: '0.9rem' }}>
            {successMsg}
          </p>
        )}

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
            : tab === "forgot"
            ? "Send Reset Link →"
            : authMethod === "phone"
            ? (otpStep ? "Verify OTP →" : "Send OTP →")
            : tab === "signin" ? "Sign In →" : "Create Account →"}
        </button>
      </form>
    </AuthCard>
  );
}
