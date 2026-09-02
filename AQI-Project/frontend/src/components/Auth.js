import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import runtimeConfig from "../config/runtimeConfig";
import { doc, setDoc } from "firebase/firestore";
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
  const [countryCode, setCountryCode] = useState("+91");
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

  // (reCAPTCHA removed for Twilio-based backend OTP)

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Save user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        createdAt: new Date()
      }, { merge: true });
      
      login(user.accessToken, { email: user.email, full_name: user.displayName });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Could not complete Google Sign-In.");
    } finally {
      setLoading(false);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

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
          
          if (data.dev_code) {
            setDevCode(data.dev_code);
          }
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

        // We don't save to Firebase Firestore here because the backend handles the user DB.
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

        {/* reCAPTCHA removed */}

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

        {/* Google Sign-in */}
        <button 
          type="button" 
          onClick={handleGoogleSignIn} 
          className="auth-google-btn"
          style={{ width: "100%", marginBottom: "16px", padding: "10px", background: "white", color: "#333", border: "1px solid #ccc", borderRadius: "4px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", fontWeight: "bold", cursor: "pointer" }}
        >
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        
        <div style={{ textAlign: "center", margin: "8px 0", color: "#888", fontSize: "0.9rem" }}>OR</div>

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
              <div className="auth-field__row" style={{ paddingLeft: 0 }}>
                <span className="auth-field__icon" style={{ paddingLeft: '12px', paddingRight: '8px' }}><UserIcon /></span>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={otpStep}
                  style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', borderRight: '1px solid var(--border)', paddingRight: '4px', cursor: 'pointer' }}
                >
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
                <input type="tel" placeholder="98765 43210" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} autoComplete="tel" disabled={otpStep} style={{ paddingLeft: '8px' }} />
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
