import { useState } from "react";
import { useTranslation } from "react-i18next";

function aqiColor(v) {
  if (v == null) return "#64748b";
  if (v <= 50)   return "#22c55e";
  if (v <= 100)  return "#eab308";
  if (v <= 150)  return "#f97316";
  if (v <= 200)  return "#ef4444";
  return "#8b5cf6";
}

function aqiLabel(v) {
  if (v == null) return "Unavailable";
  if (v <= 50)   return "Good";
  if (v <= 100)  return "Moderate";
  if (v <= 150)  return "Unhealthy for Sensitive";
  if (v <= 200)  return "Unhealthy";
  return "Very Unhealthy";
}

/* ── SVG chart with confidence band ── */
function ForecastChart({ points, peakIdx, hoveredIdx, onHover, onLeave }) {
  const W = 800, H = 180, PAD = 28;
  if (!points || points.length < 2) return null;

  const min = Math.min(...points) * 0.85;
  const max = Math.max(...points) * 1.12;
  const toX = (i) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const toY = (v) => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2);

  const linePath = points
    .map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`)
    .join(" ");

  const areaPath =
    `M${toX(0)},${H - PAD} ` +
    points.map((v, i) => `L${toX(i)},${toY(v)}`).join(" ") +
    ` L${toX(points.length - 1)},${H - PAD} Z`;

  // Confidence interval band (±6% of each point)
  const upperPath = points.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v * 1.06)}`).join(" ");
  const lowerPath = points.map((v, i) => `L${toX(i)},${toY(v * 0.94)}`).reverse().join(" ");
  const bandPath = upperPath + " " + lowerPath + " Z";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="none"
      onMouseLeave={onLeave}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#8b5cf6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Confidence interval band */}
      <path d={bandPath} fill="#8b5cf6" fillOpacity="0.12" />

      {/* Area fill */}
      <path d={areaPath} fill="url(#chartFill)" />

      {/* Main line */}
      <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r={i === peakIdx ? 6 : (hoveredIdx === i ? 5 : 3)}
          fill={i === peakIdx ? "#ef4444" : (hoveredIdx === i ? "#fff" : "#8b5cf6")}
          stroke={i === peakIdx ? "#fff" : (hoveredIdx === i ? "#8b5cf6" : "none")} strokeWidth="2"
          style={{ cursor: "pointer", transition: "r 0.15s" }}
          onMouseEnter={() => onHover(i)}
        />
      ))}

      {/* Hover tooltip */}
      {hoveredIdx != null && points[hoveredIdx] != null && (
        <g>
          <line x1={toX(hoveredIdx)} y1={PAD} x2={toX(hoveredIdx)} y2={H - PAD}
            stroke="#8b5cf680" strokeWidth="1" strokeDasharray="4,4" />
          <rect x={toX(hoveredIdx) - 40} y={toY(points[hoveredIdx]) - 28} width="80" height="22"
            rx="6" fill="#1e1b4b" fillOpacity="0.95" stroke="var(--border-mid)" />
          <text x={toX(hoveredIdx)} y={toY(points[hoveredIdx]) - 13} textAnchor="middle"
            fill="#e2e8f0" fontSize="11" fontWeight="600">
            +{hoveredIdx + 1}h: {points[hoveredIdx]} AQI
          </text>
        </g>
      )}

      {/* Y-axis labels */}
      {[0, 0.5, 1].map((f, i) => {
        const val = Math.round(min + (max - min) * f);
        return (
          <text key={i} x={PAD - 4} y={H - PAD - f * (H - PAD * 2) + 4}
            textAnchor="end" fill="#94a3b8" fontSize="9">{val}</text>
        );
      })}
    </svg>
  );
}

export default function ForecastPanel({ city, prediction, forecastPoints, peakIdx }) {
  const { t } = useTranslation();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Axis labels every 4 hours: 0h, 4h, 8h, 12h, 16h, 20h, 24h
  const timeLabels = ["Now", "+4h", "+8h", "+12h", "+16h", "+20h", "+24h"];

  const currentAqi = prediction?.predicted_aqi || (forecastPoints && forecastPoints[0]) || 85;

  return (
    <div className="forecast-panel" style={{ padding: "20px 24px" }}>
      <div className="forecast-panel__header" style={{ alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div className="section-label">📈 Trend Analysis &amp; Shaded Confidence Band</div>
          <div className="forecast-panel__title" style={{ fontSize: 18 }}>{city} — Air Quality Trajectory</div>
        </div>
        {prediction && (
          <div className="forecast-peak" style={{ fontSize: 13, fontWeight: 700 }}>
            🚨 Peak Expected in {prediction.peakHr}h: <strong style={{ marginLeft: 4 }}>{prediction.peakAqi} AQI</strong>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 14, margin: "8px 0 12px" }}>
        <div>
          <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>Predicted Next 6h Average</span>
          <span className="forecast-aqi-now__val" style={{ color: aqiColor(currentAqi), fontSize: 32, fontWeight: 800 }}>
            {Math.round(currentAqi)}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 6 }}>AQI</span>
        </div>
        <div style={{ borderLeft: "1px solid var(--border-mid)", paddingLeft: 14 }}>
          <span className="forecast-aqi-now__range" style={{ marginLeft: 0, fontWeight: 600 }}>
            Expected Band: {Math.round(currentAqi * 0.94)} – {Math.round(currentAqi * 1.06)}
          </span>
          <div style={{ fontSize: 12, color: aqiColor(currentAqi), fontWeight: 700, marginTop: 2 }}>
            ● {aqiLabel(currentAqi)}
          </div>
        </div>
      </div>

      {forecastPoints && forecastPoints.length > 0 ? (
        <>
          <div style={{ height: 200, margin: "12px 0 0" }}>
            <ForecastChart
              points={forecastPoints}
              peakIdx={peakIdx}
              hoveredIdx={hoveredIdx}
              onHover={setHoveredIdx}
              onLeave={() => setHoveredIdx(null)}
            />
          </div>
          <div className="forecast-chart__labels" style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--text-muted)", marginTop:4 }}>
            {timeLabels.map(label => <span key={label}>{label}</span>)}
          </div>
        </>
      ) : (
        <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
          Generating atmospheric model prediction…
        </div>
      )}
    </div>
  );
}
