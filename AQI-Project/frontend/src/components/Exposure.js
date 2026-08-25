import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function aqiColor(aqi) {
  if (!aqi)      return "#64748b";
  if (aqi <= 50)  return "#22c55e";
  if (aqi <= 100) return "#eab308";
  if (aqi <= 150) return "#f97316";
  if (aqi <= 200) return "#ef4444";
  return "#8b5cf6";
}

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:13,height:13 }}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

/* pull exposure history from localStorage so it persists between sessions */
function loadHistory() {
  try { return JSON.parse(localStorage.getItem("aq_exposure") || "[]"); }
  catch { return []; }
}

export default function Exposure() {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const stored = loadHistory();
    if (stored.length) { setHistory(stored); return; }
    /* seed with demo data */
    const demo = [
      { city: "Delhi",   aqi: 284, ts: "3/8/2026 · 09:03 pm" },
      { city: "Delhi",   aqi: 284, ts: "3/8/2026 · 05:28 pm" },
      { city: "Delhi",   aqi: 284, ts: "3/8/2026 · 05:28 pm" },
      { city: "Chennai", aqi: 68,  ts: "3/8/2026 · 05:27 pm" },
      { city: "Delhi",   aqi: 284, ts: "3/8/2026 · 05:22 pm" },
      { city: "Guwahati",aqi: 195, ts: "3/8/2026 · 01:37 pm" },
    ];
    setHistory(demo);
  }, []);

  function clearHistory() {
    localStorage.removeItem("aq_exposure");
    setHistory([]);
  }

  const avgAqi = history.length > 0
    ? Math.round(history.reduce((acc, h) => acc + (h.aqi || 0), 0) / history.length)
    : 0;

  const maxAqi = history.length > 0
    ? Math.max(...history.map(h => h.aqi || 0))
    : 0;

  return (
    <div className="exposure-page">
      {/* ── Left Column: Analytics Summary Panel ── */}
      <div className="panel exposure-summary-panel">
        <div className="section-label" style={{ marginBottom: 6 }}>
          <ClockIcon /> {t('exposure.title')}
        </div>
        <h2 style={{ margin: "0 0 16px", fontSize: 22 }}>Personal AQI Analytics</h2>

        <div className="exposure-stat-card" style={{ marginBottom: 14 }}>
          <span className="section-label">LOGGED COMMUTES</span>
          <div style={{ fontSize: 32, fontWeight: 800, color: "var(--teal-lt)" }}>{history.length}</div>
        </div>

        <div className="exposure-stat-card" style={{ marginBottom: 14 }}>
          <span className="section-label">AVERAGE EXPOSURE</span>
          <div style={{ fontSize: 32, fontWeight: 800, color: aqiColor(avgAqi) }}>
            {avgAqi ? `AQI ${avgAqi}` : "—"}
          </div>
        </div>

        <div className="exposure-stat-card" style={{ marginBottom: 18 }}>
          <span className="section-label">PEAK EXPOSURE</span>
          <div style={{ fontSize: 32, fontWeight: 800, color: aqiColor(maxAqi) }}>
            {maxAqi ? `AQI ${maxAqi}` : "—"}
          </div>
        </div>

        {history.length > 0 && (
          <button className="ai-btn ai-btn--ghost" style={{ width: "100%" }} onClick={clearHistory}>
            🗑️ {t('exposure.clear')}
          </button>
        )}
      </div>

      {/* ── Right Column: Interactive Timeline List ── */}
      <div className="panel exposure-timeline-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 4 }}>TIMELINE LOG</div>
            <h2 style={{ margin: 0, fontSize: 20 }}>{t('exposure.timeline')}</h2>
          </div>
          <span className="aq-chip-sm" style={{ padding: "4px 12px", background: "var(--bg-card)", border: "1px solid var(--border-mid)", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            {history.length} Logged Entries
          </span>
        </div>

        {history.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontStyle: "italic", margin: "20px 0" }}>{t('exposure.noHistory')}</p>
        ) : (
          <div className="exposure-timeline">
            {history.map((item, i) => (
              <div key={i} className="exposure-item">
                <span
                  className="exposure-item__dot"
                  style={{ background: aqiColor(item.aqi), boxShadow: `0 0 6px ${aqiColor(item.aqi)}` }}
                />
                <div style={{ flex: 1 }}>
                  <div className="exposure-item__city">📍 {item.city}</div>
                  <div className="exposure-item__time">📅 {item.ts}</div>
                </div>
                {item.aqi && (
                  <span style={{ fontSize: 14, fontWeight: 700, color: aqiColor(item.aqi), padding: "4px 12px", background: "var(--bg-card)", border: "1px solid var(--border-mid)", borderRadius: 8 }}>
                    AQI {item.aqi}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
