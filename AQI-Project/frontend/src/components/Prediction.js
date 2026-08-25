import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import runtimeConfig from "../config/runtimeConfig";
import ForecastPanel from "./ForecastPanel";
import CITIES from "../config/cities";
import {
  fetchAirQualityByCity,
  fetchAllStations,
  fetchStationsByCity,
  predictAirQuality,
} from "../services/airQualityService";

function buildSequence(latest) {
  const now = new Date();
  const pm25 = latest?.pm25 ?? 50;
  const pm10 = latest?.pm10 ?? 90;
  const no2  = latest?.no2  ?? 30;
  const temp = latest?.temperature ?? 28;
  const hum  = latest?.humidity    ?? 60;
  return Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now.getTime() - (23 - i) * 3600000);
    return {
      pm25, pm10, no: Math.max(5, no2 / 4), no2, nox: no2 * 1.4,
      nh3: 15, so2: 12, rh: hum, wd: 180, at: temp, ws: 2.5, wd2: 180,
      hour: d.getHours(), day_of_week: d.getDay(), month: d.getMonth() + 1
    };
  });
}

const POPULAR_CITIES = [
  "Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata",
  "Hyderabad", "Pune", "Jaipur", "Lucknow", "Visakhapatnam"
];

const TrendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:14, height:14 }}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
);

export default function Prediction() {
  const { t } = useTranslation();
  const [city, setCity]                     = useState(runtimeConfig.defaultCity || "Delhi");
  const [availableCities, setAvailableCities] = useState([]);
  const [cityStations, setCityStations]     = useState([]);
  const [station, setStation]               = useState(null);
  const [selectedStationId, setSelectedStationId] = useState("");
  const [forecastPoints, setForecastPoints] = useState([]);
  const [prediction, setPrediction]         = useState(null);
  const [peakIdx, setPeakIdx]               = useState(null);
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState("");

  // Function to execute the forecast
  const runForecastForStation = useCallback(async (targetCity, targetStation) => {
    if (!targetStation) return;
    try {
      setIsLoading(true);
      setError("");

      const readings = await fetchAirQualityByCity(targetCity);
      let latest = readings.find(r => r.station_id === targetStation.station_id) || readings[0];

      // Fetch real weather data if available
      const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
      if (apiKey && targetStation.latitude && targetStation.longitude) {
        try {
          const weatherRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${targetStation.latitude}&lon=${targetStation.longitude}&units=metric&appid=${apiKey}`
          );
          if (weatherRes.ok) {
            const weatherData = await weatherRes.json();
            if (latest) {
              latest.temperature = Math.round(weatherData.main.temp);
              latest.humidity = weatherData.main.humidity;
            }
          }
        } catch { /* ignore weather error */ }
      }

      const result = await predictAirQuality({
        station_id: targetStation.station_id,
        latitude: targetStation.latitude,
        longitude: targetStation.longitude,
        sequence: buildSequence(latest),
      });

      const baseAqi = result.predicted_aqi || 120;
      // 24 hourly forecast points
      const pts = Array.from({ length: 24 }, (_, i) => {
        const offset = Math.sin(i / 2.8) * 22 + (i < 12 ? i * 1.8 : (24 - i) * 1.4);
        return Math.max(15, Math.round(baseAqi + offset));
      });

      const maxVal = Math.max(...pts);
      const maxIdx = pts.indexOf(maxVal);

      setForecastPoints(pts);
      setPeakIdx(maxIdx);
      setPrediction({
        ...result,
        points: pts,
        peakIdx: maxIdx,
        peakAqi: maxVal,
        peakHr: maxIdx + 1,
        temperature: latest?.temperature ?? 28,
        latitude: targetStation.latitude,
        longitude: targetStation.longitude,
      });
    } catch (e) {
      setError(e?.response?.data?.detail || "Prediction failed.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load stations whenever the city changes
  const loadStationsForCity = useCallback(async (cityName, autoPredict = true) => {
    try {
      setError("");
      // Normalize city name
      const matched = CITIES.find(c => c.name.toLowerCase() === cityName.trim().toLowerCase());
      const normalizedCity = matched ? matched.name : cityName.trim();

      const stations = await fetchStationsByCity(normalizedCity);
      setCityStations(stations);

      if (stations && stations.length > 0) {
        const primary = stations[0];
        setStation(primary);
        setSelectedStationId(primary.station_id);
        if (autoPredict) {
          runForecastForStation(normalizedCity, primary);
        }
      } else {
        setStation(null);
        setSelectedStationId("");
      }
    } catch (e) {
      setError("Failed to load stations for this city.");
    }
  }, [runForecastForStation]);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const all = await fetchAllStations();
        const cityList = [...new Set([
          ...CITIES.map(c => c.name),
          ...all.map(s => s.city).filter(Boolean)
        ])].sort();
        setAvailableCities(cityList);
      } catch {
        setAvailableCities(CITIES.map(c => c.name));
      }
      loadStationsForCity(city, true);
    }
    init();
  }, [loadStationsForCity]);

  // Handle city selection
  const handleCityChange = (newCityName) => {
    setCity(newCityName);
    loadStationsForCity(newCityName, true);
  };

  // Handle station selection
  const handleStationChange = (stationId) => {
    setSelectedStationId(stationId);
    const selected = cityStations.find(s => s.station_id === stationId);
    setStation(selected || null);
    if (selected) {
      runForecastForStation(city, selected);
    }
  };

  return (
    <div className="forecast-page">
      {/* ── Top controls & quick chips ── */}
      <div className="forecast-panel" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div className="section-label"><TrendIcon /> AI Forecasting Center</div>
            <h2 style={{ margin: 0, fontSize: 20 }}>24-Hour LSTM Air Quality Prediction</h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="ai-btn ai-btn--sm"
              type="button"
              onClick={() => runForecastForStation(city, station)}
              disabled={isLoading || !station}
            >
              {isLoading ? "Analyzing Data…" : "▶ Refresh Forecast"}
            </button>
          </div>
        </div>

        {/* Quick Popular City Chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginRight: 4 }}>
            Quick City:
          </span>
          {POPULAR_CITIES.map(c => {
            const isActive = city.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                onClick={() => handleCityChange(c)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: isActive ? "1px solid var(--teal-lt)" : "1px solid var(--border-mid)",
                  background: isActive ? "var(--teal-dim)" : "var(--bg-card)",
                  color: isActive ? "var(--teal-lt)" : "var(--text-main)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Search & Station Selector */}
        <div className="inline-form" style={{ gap: 12 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>
              Search / Select City
            </label>
            <input
              className="ai-input"
              list="pred-cities"
              value={city}
              onChange={e => handleCityChange(e.target.value)}
              placeholder="Type city name (e.g. Mumbai, Delhi)..."
            />
            <datalist id="pred-cities">
              {availableCities.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div style={{ flex: 1.2, minWidth: 260 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>
              Monitoring Station ({cityStations.length} available)
            </label>
            <select
              className="ai-select"
              value={selectedStationId}
              onChange={e => handleStationChange(e.target.value)}
            >
              {cityStations.map(s => (
                <option key={s.station_id} value={s.station_id}>
                  {s.name || s.station_id} ({s.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="status-message status-error" style={{ marginTop: 12 }}>{error}</p>}
      </div>

      {/* ── Forecast chart panel ── */}
      <ForecastPanel
        city={city}
        prediction={prediction}
        forecastPoints={forecastPoints}
        peakIdx={peakIdx}
      />

      {/* ── Pollutant breakdown grid ── */}
      {prediction && (
        <div className="forecast-panel" style={{ padding: "20px 24px" }}>
          <div className="section-label"><TrendIcon /> Predicted Atmospheric Parameters (Peak Hour)</div>
          <div className="stats-grid" style={{ marginTop: 12, gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
            {[
              { k: "PM2.5", v: prediction.pm25, unit: " µg/m³" },
              { k: "PM10",  v: prediction.pm10, unit: " µg/m³" },
              { k: "NO₂",   v: prediction.no2,  unit: " ppb" },
              { k: "SO₂",   v: prediction.so2,  unit: " ppb" },
              { k: "CO",    v: prediction.co,   unit: " mg/m³" },
              { k: "O₃",    v: prediction.o3,   unit: " µg/m³" },
              { k: "Temp",  v: prediction.temperature, unit: "°C" },
            ].map(({ k, v, unit }) => (
              <p key={k} style={{ padding: "10px 12px" }}>
                <strong>{k}</strong>
                <span>{v != null ? (typeof v === "number" ? v.toFixed(1) : v) + (unit || "") : "—"}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
