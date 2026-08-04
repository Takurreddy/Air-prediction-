import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createAlert, deleteAlert, listAlerts } from "../services/airQualityService";

const CONDITIONS = [
  "Asthma / respiratory condition",
  "Heart or cardiovascular condition",
  "Elderly (65+)",
  "Young child in household",
  "Pregnant",
];
const AGE_GROUPS = ["Child (0-12)", "Adult (20-60)", "Elderly"];

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:18,height:18 }}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const NotifIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:18,height:18 }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.5 2 2 0 0 1 3.62 1.31h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:18,height:18 }}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const AlertTriIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:18,height:18 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

/* ── Toggle switch component ── */
function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle__track" />
      <span className="toggle__thumb" />
    </label>
  );
}

export default function Alerts() {
  const { isAuthenticated } = useAuth();

  /* health profile state */
  const [ageGroup,    setAgeGroup]    = useState("Adult (20-60)");
  const [conditions,  setConditions]  = useState([CONDITIONS[0], CONDITIONS[3], CONDITIONS[4]]);
  const [threshold,   setThreshold]   = useState(170);
  const [savedOk,     setSavedOk]     = useState(false);

  /* notification prefs */
  const [emailAlerts,   setEmailAlerts]   = useState(false);
  const [breachOnly,    setBreachOnly]    = useState(true);

  /* legacy alerts */
  const [stationId,    setStationId]    = useState("");
  const [alerts,       setAlerts]       = useState([]);
  const [alertError,   setAlertError]   = useState("");

  useEffect(() => {
    if (isAuthenticated) loadAlerts();
  }, [isAuthenticated]);

  async function loadAlerts() {
    try { setAlerts(await listAlerts()); setAlertError(""); }
    catch (e) { setAlertError(e?.response?.data?.detail || "Failed to load alerts."); }
  }

  function toggleCondition(cond) {
    setConditions(prev =>
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
    );
  }

  function handleSave() {
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2500);
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await createAlert({ station_id: stationId, threshold_aqi: threshold, notify_email: emailAlerts, notify_push: false });
      setStationId(""); await loadAlerts();
    } catch (err) { setAlertError(err?.response?.data?.detail || "Failed to create alert."); }
  }

  async function handleDelete(id) {
    try { await deleteAlert(id); await loadAlerts(); }
    catch (err) { setAlertError(err?.response?.data?.detail || "Failed to delete alert."); }
  }

  if (!isAuthenticated) {
    return (
      <div className="page-wrap">
        <div className="panel" style={{ textAlign: "center", padding: 48 }}>
          <BellIcon />
          <h2 style={{ marginTop: 16 }}>Sign in to manage your profile &amp; alerts</h2>
          <p style={{ color: "var(--text-muted)" }}>Personalise thresholds, conditions and notification preferences.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-page">
      {/* ── LEFT: Health Profile ── */}
      <div className="alerts-panel">
        <div className="section-label" style={{ marginBottom: 4 }}>
          <BellIcon /> Health Profile
        </div>
        <h2>Your Sensitivity Settings</h2>

        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>Age Group</div>
        <div className="age-pills">
          {AGE_GROUPS.map(g => (
            <button key={g} className={`age-pill${ageGroup === g ? " age-pill--active" : ""}`}
              type="button" onClick={() => setAgeGroup(g)}>
              {g}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>Pre-existing Conditions</div>
        <div className="conditions-list">
          {CONDITIONS.map(c => (
            <label key={c} className="condition-item">
              <input type="checkbox"
                checked={conditions.includes(c)}
                onChange={() => toggleCondition(c)} />
              {c}
            </label>
          ))}
        </div>

        <div className="threshold-row">
          <label>Alert me when AQI exceeds:</label>
          <span>{threshold}</span>
        </div>
        <input type="range" className="threshold-slider"
          min={50} max={300} value={threshold}
          onChange={e => setThreshold(Number(e.target.value))} />
        <div className="threshold-range">
          <span>50 (Cautious)</span>
          <span>300 (Only extreme)</span>
        </div>

        <button className="save-profile-btn" type="button" onClick={handleSave}>
          {savedOk ? "✓ Saved!" : "Save Health Profile"}
        </button>

        {/* quick station alert creator */}
        {isAuthenticated && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Station Alerts</div>
            <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input className="ai-input" style={{ flex: 1, minWidth: 160 }}
                placeholder="Station ID (e.g. delhi-anand-vihar)"
                value={stationId} onChange={e => setStationId(e.target.value)} required />
              <button className="ai-btn ai-btn--sm" type="submit">Add</button>
            </form>
            {alertError && <p className="status-message status-error" style={{ marginTop: 8 }}>{alertError}</p>}
            {alerts.length > 0 && (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {alerts.map(a => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px", background: "var(--bg-card)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{a.station_id}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>AQI ≥ {a.threshold_aqi}</div>
                    </div>
                    <button className="ai-btn ai-btn--ghost ai-btn--sm" type="button" onClick={() => handleDelete(a.id)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT: Notification Preferences ── */}
      <div className="alerts-panel">
        <div className="section-label" style={{ marginBottom: 4 }}>
          <NotifIcon /> Notification Preferences
        </div>
        <h2>Delivery Channels</h2>

        {/* browser push — always shown as enabled */}
        <div className="notif-item">
          <div className="notif-item__left">
            <BellIcon />
            <div>
              <div className="notif-item__title">Browser push notifications</div>
              <div className="notif-item__sub">Enabled for this browser.</div>
            </div>
          </div>
        </div>

        <div className="notif-item">
          <div className="notif-item__left">
            <MailIcon />
            <div>
              <div className="notif-item__title">Enable Email Alerts</div>
            </div>
          </div>
          <Toggle checked={emailAlerts} onChange={setEmailAlerts} />
        </div>

        <div className="notif-item">
          <div className="notif-item__left">
            <AlertTriIcon />
            <div>
              <div className="notif-item__title">Only alert when AQI breaches my threshold</div>
            </div>
          </div>
          <Toggle checked={breachOnly} onChange={setBreachOnly} />
        </div>

        <div style={{ marginTop: 24, padding: 16, background: "var(--bg-card)",
          borderRadius: "var(--radius)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--text-main)", display: "block", marginBottom: 6 }}>Current threshold: {threshold} AQI</strong>
          Alerts fire for: {conditions.length ? conditions.join(", ") : "No conditions selected"}.<br />
          Age group: <strong style={{ color: "var(--text-main)" }}>{ageGroup}</strong>.
        </div>
      </div>
    </div>
  );
}
