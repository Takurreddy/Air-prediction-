import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import runtimeConfig from "../config/runtimeConfig";

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ width: 16, height: 16 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("No reset token provided in the URL.");
    }
  }, [location]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${runtimeConfig.apiBaseUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          new_password: password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to reset password.");

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      <div className="auth-card">
        <h2 className="auth-card__title">Reset <span>Password</span></h2>
        <p className="auth-card__sub" style={{ marginBottom: 30 }}>
          Enter your new password below.
        </p>

        {success ? (
          <div style={{ width: "100%", textAlign: "center" }}>
            <p className="status-message status-success" style={{ color: 'var(--teal-lt)', marginBottom: 20 }}>
              Password has been successfully reset!
            </p>
            <button className="auth-submit" onClick={() => navigate("/auth")}>
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <div className="auth-field">
              <label>New Password</label>
              <div className="auth-field__row">
                <span className="auth-field__icon"><LockIcon /></span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </div>

            {error && (
              <p className="status-message status-error" style={{ width: "100%", marginBottom: 12 }}>
                {error}
              </p>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading || !token}
            >
              {loading ? "Please wait…" : "Reset Password →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
