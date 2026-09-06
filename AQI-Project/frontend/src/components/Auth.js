import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";

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

/* ── Main Auth component — talks to Supabase ── */
export default function Auth() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [authMethod, setAuthMethod] = useState("email");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function resetForm() {
    setEmail("");
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

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    setLoading(true);

    try {
      if (tab === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setSuccessMsg("Reset link sent to your email!");
      } 
      else if (authMethod === "magiclink") {
        const { error: magicLinkError } = await supabase.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
          options: {
            data: tab === "signup" ? { full_name: fullName.trim() || null } : undefined,
          }
        });
        if (magicLinkError) throw magicLinkError;
        setSuccessMsg("Check your email for the login link!");
      } 
      else {
        // Password auth
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          setLoading(false);
          return;
        }

        if (tab === "signup") {
          const { error: signUpError } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password: password,
            options: {
              data: {
                full_name: fullName.trim() || null
              }
            }
          });
          if (signUpError) throw signUpError;
          setSuccessMsg("Account created! You can now sign in or check your email for a confirmation link.");
        } else {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: password
          });
          if (signInError) throw signInError;
          navigate("/dashboard");
        }
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
              onClick={() => { setAuthMethod("email"); setError(""); setSuccessMsg(""); }}>
              Email &amp; Password
            </button>
            <button type="button" className={authMethod === "magiclink" ? "active" : ""}
              onClick={() => { setAuthMethod("magiclink"); setError(""); setSuccessMsg(""); }}>
              Email Magic Link
            </button>
          </div>
        )}

        <div className="auth-field">
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
        </div>

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
          </div>
        )}

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
            : authMethod === "magiclink"
            ? "Send Magic Link →"
            : tab === "signin" ? "Sign In →" : "Create Account →"}
        </button>
      </form>
    </AuthCard>
  );
}
