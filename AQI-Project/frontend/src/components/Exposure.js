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
    /* seed with demo data matching the screenshot */
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

  return (
    <div className="exposure-page">
      <div className="panel" style={{ maxWidth: 720 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 6 }}>
              <ClockIcon /> {t('exposure.title')}
            </div>
            <h2 style={{ margin: 0 }}>{t('exposure.timeline')}</h2>
          </div>
          {history.length > 0 && (
            <button className="ai-btn ai-btn--ghost ai-btn--sm" onClick={clearHistory}>
              {t('exposure.clear')}
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>{t('exposure.noHistory')}</p>
        ) : (
          <div className="exposure-timeline">
            {history.map((item, i) => (
              <div key={i} className="exposure-item">
                <span
                  className="exposure-item__dot"
                  style={{ background: aqiColor(item.aqi), boxShadow: `0 0 6px ${aqiColor(item.aqi)}` }}
                />
                <div>
                  <div className="exposure-item__city">{item.city}</div>
                  <div className="exposure-item__time">{item.ts}</div>
                </div>
                {item.aqi && (
                  <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: aqiColor(item.aqi) }}>
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
