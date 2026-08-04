import { useEffect, useRef, useState } from "react";
import runtimeConfig from "../config/runtimeConfig";
import {
  fetchAirQualityByCity,
  fetchAllStations,
  fetchStationsByCity,
  predictAirQuality,
} from "../services/airQualityService";

/* ── helpers ── */
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

/* ── SVG sparkline chart ── */
function ForecastChart({ points, peakIdx }) {
  const W = 800, H = 180, PAD = 24;
  if (!points || points.length < 2) return null;

  const min = Math.min(...points) * 0.92;
  const max = Math.max(...points) * 1.06;
  const toX = (i) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const toY = (v) => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2);

  const linePath = points
    .map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`)
    .join(" ");

  const areaPath =
    `M${toX(0)},${H - PAD} ` +
    points.map((v, i) => `L${toX(i)},${toY(v)}`).join(" ") +
    ` L${toX(points.length - 1)},${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#8b5cf6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#chartFill)" />
      <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r={i === peakIdx ? 5 : 3}
          fill={i === peakIdx ? "#ef4444" : "#8b5cf6"}
          stroke={i === peakIdx ? "#fff" : "none"} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function buildSequence(latest) {
  const now = new Date();
  const pm25 = latest?.pm25 ?? 50;
  const pm10 = latest?.pm10 ?? 90;
  const no2  = latest?.no2  ?? 30;
  const temp = latest?.temperature ?? 28;
  const hum  = latest?.humidity    ?? 60;
  return Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now.getTime() - (23 - i) * 3600000);
    return { pm25, pm10, no: Math.max(5, no2 / 4), no2, nox: no2 * 1.4,
      nh3: 15, so2: 12, rh: hum, wd: 180, at: temp, ws: 2.5, wd2: 180,
      hour: d.getHours(), day_of_week: d.getDay(), month: d.getMonth() + 1 };
  });
}

const TrendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:14,height:14 }}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
);
const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:13,height:13 }}>
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
  </svg>
);

export default function Prediction() {
  const [city, setCity]                     = useState(runtimeConfig.defaultCity);
  const [availableCities, setAvailableCities] = useState([]);
  const [cityStations, setCityStations]     = useState([]);
  const [station, setStation]               = useState(null);
  const [selectedStationId, setSelectedStationId] = useState("");
  const [forecastPoints, setForecastPoints] = useState([]);
  const [prediction, setPrediction]         = useState(null);
  const [peakIdx, setPeakIdx]               = useState(null);
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState("");

  useEffect(() => {
    async function init() {
      try {
        const [all, stations] = await Promise.all([
          fetchAllStations(),
          fetchStationsByCity(runtimeConfig.defaultCity),
        ]);
        setAvailableCities([...new Set(all.map(s => s.city).filter(Boolean))].sort());
        setCityStations(stations);
        if (stations.length) { setStation(stations[0]); setSelectedStationId(stations[0].station_id); }
      } catch (e) {
        setError(e?.response?.data?.detail || "Failed to load stations.");
      }
    }
    init();
  }, []);

  async function loadStation() {
    try {
      setError("");
      const stations = await fetchStationsByCity(city);
      setCityStations(stations);
      if (!stations.length) { setError("No stations found for this city."); return; }
      setStation(stations[0]);
      setSelectedStationId(stations[0].station_id);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load stations.");
    }
  }

  async function runForecast() {
    if (!station) { setError("Load a city station first."); return; }
    try {
      setIsLoading(true); setError("");
      const readings = await fetchAirQualityByCity(city);
      let latest   = readings.find(r => r.station_id === station.station_id) || readings[0];
      
      // Fetch real weather data
      const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
      if (apiKey) {
        try {
          const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${station.latitude}&lon=${station.longitude}&units=metric&appid=${apiKey}`);
          if (weatherRes.ok) {
            const weatherData = await weatherRes.json();
            if (latest) {
              latest.temperature = weatherData.main.temp;
              latest.humidity = weatherData.main.humidity;
            } else {
              latest = { temperature: weatherData.main.temp, humidity: weatherData.main.humidity };
            }
          }
        } catch (we) {
          console.error("Prediction weather fallback failed", we);
        }
      }

      const result   = await predictAirQuality({
        station_id: station.station_id,
        latitude:   station.latitude,
        longitude:  station.longitude,
        sequence:   buildSequence(latest),
      });
      const baseAqi = result.predicted_aqi;
      /* generate 24 synthetic hourly points centred on the prediction */
      const pts = Array.from({ length: 24 }, (_, i) => {
        const offset = Math.sin(i / 3) * 18 + (i < 12 ? i * 1.5 : (24 - i) * 1.2);
        return Math.max(10, Math.round(baseAqi + offset));
      });
      const maxVal  = Math.max(...pts);
      const maxIdx  = pts.indexOf(maxVal);
      setForecastPoints(pts);
      setPeakIdx(maxIdx);
      setPrediction({ 
        ...result, 
        points: pts, 
        peakIdx: maxIdx, 
        peakAqi: maxVal, 
        peakHr: maxIdx + 1,
        temperature: latest?.temperature,
        latitude: station.latitude,
        longitude: station.longitude
      });
    } catch (e) {
      setError(e?.response?.data?.detail || "Prediction failed.");
    } finally {
      setIsLoading(false);
    }
  }

  const timeLabels = ["+1h","+5h","+9h","+13h","+17h","+21h","+24h"];

  return (
    <div className="forecast-page">
      {/* ── controls ── */}
      <div className="forecast-panel" style={{ marginBottom: 16 }}>
        <div className="inline-form" style={{ flexWrap: "wrap", gap: 10 }}>
          <input
            className="ai-input" style={{ maxWidth: 240 }}
            list="pred-cities" value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="City name"
          />
          <datalist id="pred-cities">
            {availableCities.map(c => <option key={c} value={c} />)}
          </datalist>
          <select
            className="ai-select" style={{ maxWidth: 260 }}
            value={selectedStationId}
            onChange={e => {
              setSelectedStationId(e.target.value);
              setStation(cityStations.find(s => s.station_id === e.target.value) || null);
            }}
          >
            <option value="">Select station…</option>
            {cityStations.map(s => <option key={s.station_id} value={s.station_id}>{s.station_id}</option>)}
          </select>
          <button className="ai-btn ai-btn--ghost ai-btn--sm" type="button" onClick={loadStation}>
            Load Station
          </button>
          <button className="ai-btn ai-btn--sm" type="button" onClick={runForecast} disabled={isLoading}>
            {isLoading ? "Forecasting…" : "▶ Run Forecast"}
          </button>
        </div>
        {error && <p className="status-message status-error" style={{ marginTop: 10 }}>{error}</p>}
      </div>

      {/* ── chart panel ── */}
      <div className="forecast-panel">
        <div className="forecast-panel__header">
          <div>
            <div className="section-label"><TrendIcon /> Air Quality Forecast <InfoIcon /></div>
            <div className="forecast-panel__title">{city} — Next 24 Hours</div>
          </div>
          {prediction && (
            <div className="forecast-peak">
              Peak in {prediction.peakHr}hr: {prediction.peakAqi} AQI
            </div>
          )}
        </div>

        {prediction && (
          <div className="forecast-aqi-now" style={{ marginTop: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>IN 6H &nbsp;</span>
            <span className="forecast-aqi-now__val" style={{ color: aqiColor(prediction.predicted_aqi) }}>
              {Math.round(prediction.predicted_aqi)} AQI
            </span>
            <span className="forecast-aqi-now__range">
              &nbsp; Range {Math.round(prediction.predicted_aqi * 0.94)}–{Math.round(prediction.predicted_aqi * 1.06)}
              &nbsp; · {aqiLabel(prediction.predicted_aqi)}
            </span>
          </div>
        )}

        {!prediction && (
          <div style={{ color: "var(--text-muted)", fontSize: 14, padding: "40px 0", textAlign: "center" }}>
            Select a city &amp; station, then click <strong style={{ color: "var(--text-main)" }}>Run Forecast</strong> to generate the 24-hour chart.
          </div>
        )}

        {forecastPoints.length > 0 && (
          <>
            <div style={{ height: 220, margin: "16px -24px 0" }}>
              <ForecastChart points={forecastPoints} peakIdx={peakIdx} />
            </div>
            <div className="forecast-chart__labels" style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--text-muted)", marginTop:6 }}>
              {timeLabels.map(t => <span key={t}>{t}</span>)}
            </div>
          </>
        )}

        {/* pollutant breakdown */}
        {prediction && (
          <div className="stats-grid" style={{ marginTop: 20 }}>
            {[
              { k: "PM2.5", v: prediction.pm25 },
              { k: "PM10",  v: prediction.pm10 },
              { k: "NO₂",   v: prediction.no2  },
              { k: "SO₂",   v: prediction.so2  },
              { k: "Temp",  v: prediction.temperature, unit: "°C" },
              { k: "Lat",   v: prediction.latitude },
              { k: "Lng",   v: prediction.longitude },
            ].map(({ k, v, unit }) => (
              <p key={k}>
                <strong>{k}</strong>
                <span>{v != null ? (typeof v === "number" ? v.toFixed(2) : v) + (unit || "") : "—"}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
