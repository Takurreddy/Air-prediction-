import { useCallback, useEffect, useMemo, useState } from "react";
import runtimeConfig from "../config/runtimeConfig";
import {
  fetchAirQualityByCity,
  fetchAllStations,
  fetchStationsByCity,
} from "../services/airQualityService";

/* ── helpers ── */
function getAqiMeta(v) {
  if (v == null)  return { label: "Unavailable", tone: "neutral",   dot: "neutral" };
  if (v <= 50)    return { label: "Good",         tone: "good",      dot: "good" };
  if (v <= 100)   return { label: "Moderate",     tone: "moderate",  dot: "moderate" };
  if (v <= 150)   return { label: "Unhealthy for Sensitive", tone: "sensitive", dot: "sensitive" };
  if (v <= 200)   return { label: "Unhealthy",    tone: "unhealthy", dot: "unhealthy" };
  return           { label: "Very Unhealthy",      tone: "hazardous", dot: "hazardous" };
}

function aqiColor(v) {
  if (v == null) return "#64748b";
  if (v <= 50)   return "#22c55e";
  if (v <= 100)  return "#eab308";
  if (v <= 150)  return "#f97316";
  if (v <= 200)  return "#ef4444";
  return "#8b5cf6";
}

const CITIES = [
  { name: "Delhi",         state: "Delhi",         lat: 28.6139, lng: 77.2090, defaultAqi: 284 },
  { name: "Mumbai",        state: "Maharashtra",   lat: 19.0760, lng: 72.8777, defaultAqi: 82  },
  { name: "Bengaluru",     state: "Karnataka",     lat: 12.9716, lng: 77.5946, defaultAqi: 42  },
  { name: "Chennai",       state: "Tamil Nadu",    lat: 13.0827, lng: 80.2707, defaultAqi: 68  },
  { name: "Kolkata",       state: "West Bengal",   lat: 22.5726, lng: 88.3639, defaultAqi: 112 },
  { name: "Hyderabad",     state: "Telangana",     lat: 17.3850, lng: 78.4867, defaultAqi: 78  },
  { name: "Ahmedabad",     state: "Gujarat",       lat: 23.0225, lng: 72.5714, defaultAqi: 95  },
  { name: "Pune",          state: "Maharashtra",   lat: 18.5204, lng: 73.8567, defaultAqi: 64  },
  { name: "Jaipur",        state: "Rajasthan",     lat: 26.9124, lng: 75.7873, defaultAqi: 135 },
  { name: "Lucknow",       state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, defaultAqi: 170 },
  { name: "Surat",         state: "Gujarat",       lat: 21.1702, lng: 72.8311, defaultAqi: 88  },
  { name: "Visakhapatnam", state: "Andhra Pradesh",lat: 17.6868, lng: 83.2185, defaultAqi: 56  },
];

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
  </svg>
);
const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const CalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);
const TargetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);

/* ── India SVG map mock with AQI bubbles ── */
function IndiaMapMock({ cities, selectedCity, onSelect }) {
  /* approximate normalized positions inside a 520×500 viewBox */
  const positions = {
    Delhi:         { x: 210, y: 110 },
    Mumbai:        { x: 130, y: 270 },
    Bengaluru:     { x: 195, y: 360 },
    Chennai:       { x: 250, y: 370 },
    Kolkata:       { x: 340, y: 210 },
    Hyderabad:     { x: 220, y: 300 },
    Ahmedabad:     { x: 125, y: 200 },
    Pune:          { x: 145, y: 285 },
    Jaipur:        { x: 180, y: 140 },
    Lucknow:       { x: 260, y: 145 },
    Surat:         { x: 128, y: 240 },
    Visakhapatnam: { x: 285, y: 310 },
  };


  return (
    <svg viewBox="0 0 520 500" style={{ width: "100%", height: "100%" }}>
      {/* simplified India outline placeholder */}
      <ellipse cx="230" cy="270" rx="180" ry="200" fill="rgba(30,30,60,0.5)" stroke="rgba(120,100,220,0.3)" strokeWidth="1.5" />
      {/* AQI bubbles */}
      {cities.map((city) => {
        const pos = positions[city.name];
        if (!pos) return null;
        const aqi = city.aqi ?? city.defaultAqi;
        const color = aqiColor(aqi);
        const isSelected = selectedCity === city.name;
        return (
          <g key={city.name} onClick={() => onSelect(city.name)} style={{ cursor: "pointer" }}>
            <circle cx={pos.x} cy={pos.y} r={isSelected ? 22 : 18}
              fill={color} fillOpacity="0.9"
              stroke={isSelected ? "#fff" : "rgba(0,0,0,0.3)"} strokeWidth={isSelected ? 2 : 1}
            />
            <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
              fill="#fff" fontSize="11" fontWeight="700">{aqi}</text>
          </g>
        );
      })}
    </svg>
  );
}

function SocialShare({ station, aqi }) {
  const shareText = `Check out the Air Quality in ${station?.city || 'my city'}! AQI is ${aqi}. Stay safe!`;
  const shareUrl = "http://localhost:3000";

  return (
    <div className="social-share" style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noreferrer"
        className="ai-btn ai-btn--ghost ai-btn--sm"
        title="Share on Facebook"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noreferrer"
        className="ai-btn ai-btn--ghost ai-btn--sm"
        title="Share on X (Twitter)"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
      </a>
      <a
        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
        target="_blank"
        rel="noreferrer"
        className="ai-btn ai-btn--ghost ai-btn--sm"
        title="Share on WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
      </a>
    </div>
  );
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery]       = useState("");
  const [selectedCity, setSelectedCity]     = useState(CITIES[0].name);
  const [station, setStation]               = useState(null);
  const [cityAqiMap, setCityAqiMap]         = useState({});
  const [error, setError]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const [mapTab, setMapTab]                 = useState("iq");
  const [showPopup, setShowPopup]           = useState(true);
  const [availableCities, setAvailableCities] = useState([]);

  const loadCityData = useCallback(async (city) => {
    try {
      setLoading(true); setError("");
      const [stations, readings] = await Promise.all([
        fetchStationsByCity(city),
        fetchAirQualityByCity(city),
      ]);
      let first = readings[0] ?? null;

      if (first && (first.temperature == null || first.humidity == null)) {
        try {
          const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
          if (apiKey) {
            const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
            if (weatherRes.ok) {
              const weatherData = await weatherRes.json();
              first = {
                ...first,
                temperature: Math.round(weatherData.main.temp),
                humidity: weatherData.main.humidity,
                wind_speed: (weatherData.wind.speed * 3.6).toFixed(1)
              };
            }
          }
        } catch (we) {
          console.error("Weather fallback failed", we);
        }
      }

      setStation(first);
      if (first) {
        setCityAqiMap(prev => ({ ...prev, [city]: first.aqi }));
      }
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load air quality data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const all = await fetchAllStations();
        const unique = [...new Set(all.map(s => s.city).filter(Boolean))].sort();
        setAvailableCities(unique);
      } catch { /* non-fatal */ }
    }
    init();
    loadCityData(runtimeConfig.defaultCity || CITIES[0].name);
  }, [loadCityData]);

  const handleCitySelect = (cityName) => {
    setSelectedCity(cityName);
    setShowPopup(true);
    loadCityData(cityName);
  };

  const aqiMeta    = getAqiMeta(station?.aqi);
  const displayAqi = station?.aqi ?? CITIES.find(c => c.name === selectedCity)?.defaultAqi ?? "—";

  const enrichedCities = CITIES.map(c => ({ ...c, aqi: cityAqiMap[c.name] ?? c.defaultAqi }));

  const filteredCities = useMemo(() =>
    CITIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );

  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

  return (
    <div className="aq-page">
      {/* ── top search bar ── */}
      <div className="aq-page__topbar">
        <div className="aq-search">
          <SearchIcon />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search Indian cities (e.g. Delhi, Mumbai, Bengaluru)..."
          />
        </div>
        <div className="aq-cities-badge">
          <span>Cities:</span>
          <strong>{availableCities.length || CITIES.length} Active</strong>
        </div>
      </div>

      {/* ── sidebar ── */}
      <aside className="aq-sidebar">
        <h1 className="aq-page-title">Air Quality <span>Index</span></h1>
        <div className="aq-meta">
          <CalIcon />
          {dateStr} · Local time
          &nbsp;·&nbsp; Local → 🇮🇳 IND
        </div>

        {/* directory */}
        <div className="aq-dir">
          <div className="section-label"><PinIcon /> Interactive Directory</div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Explore City Coordinates</div>
          {filteredCities.map(city => {
            const aqi = cityAqiMap[city.name] ?? city.defaultAqi;
            return (
              <div
                key={city.name}
                className={`aq-dir__item${selectedCity === city.name ? " aq-dir__item--active" : ""}`}
                onClick={() => handleCitySelect(city.name)}
              >
                <div className="aq-dir__info">
                  <div className="aq-dir__city">
                    <strong>{city.name}</strong>
                    <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> ({city.state})</span>
                  </div>
                  <div className="aq-dir__coords">
                    Lat: {city.lat} | Lng: {city.lng}
                  </div>
                </div>
                <div className="aq-dir__aqi" style={{ color: aqiColor(aqi) }}>
                  AQI {aqi}
                  <span className="aqi-dot" style={{ background: aqiColor(aqi), boxShadow: `0 0 6px ${aqiColor(aqi)}` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* stats panel */}
        {station && (
          <div className="aq-stats">
            <div className="section-label">Main Statistics</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{selectedCity}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>{selectedCity}, India</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div className="aq-big-aqi">
                <span className="aq-big-aqi__val" style={{ color: aqiColor(displayAqi) }}>{displayAqi}</span>
                <span className="aq-big-aqi__unit">AQI</span>
              </div>
              <div>
                <span className={`aqi-badge aqi-badge--${aqiMeta.dot}`}>
                  <span className={`aqi-dot aqi-dot--${aqiMeta.dot}`} /> {aqiMeta.label.toUpperCase()}
                </span>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
                  <div>Dominant &nbsp; <strong style={{ color: "var(--text-main)" }}>{station.pm25 != null ? "PM2.5" : "PM10"}</strong></div>
                  <div style={{ marginTop: 4 }}>Temp &nbsp; <strong style={{ color: "var(--text-main)" }}>{station.temperature ?? "—"}°C</strong></div>
                </div>
              </div>
            </div>
            <SocialShare station={station} aqi={displayAqi} />
            {error && <p className="status-message status-error">{error}</p>}
          </div>
        )}
        {loading && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</p>}
      </aside>

      {/* ── map panel ── */}
      <main className="aq-map">
        <div className="aq-map__toolbar">
          <div className="aq-map__tabs">
            <button className={`aq-map__tab${mapTab === "iq" ? " aq-map__tab--active" : ""}`} onClick={() => setMapTab("iq")}>
              IQ AIR MAP
            </button>
            <button className={`aq-map__tab${mapTab === "hybrid" ? " aq-map__tab--active" : ""}`} onClick={() => setMapTab("hybrid")}>
              HYBRID VIEW
            </button>
          </div>

          <button className="aq-map__recenter" onClick={() => setShowPopup(true)}>
            <TargetIcon style={{ width: 14, height: 14 }} /> RECENTER
          </button>
        </div>

        {/* popup info card */}
        {showPopup && station && (
          <div className="aq-popup" style={{ position: "relative", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="aq-popup__title">📍 {selectedCity}, India Air Quality</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <div style={{ background: "var(--purple)", padding: "2px 10px", borderRadius: 6, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                    {displayAqi}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>IND AQI</div>
                </div>
                <div className="aq-popup__cat" style={{ color: aqiColor(displayAqi) }}>{aqiMeta.label}</div>
                <div className="aq-popup__meta">
                  <span>🌡 {station.temperature ?? "—"}°C</span>
                  <span>💧 {station.humidity ?? "—"}%</span>
                  <span>💨 {station.wind_speed ?? "8.5"} km/h</span>
                </div>
              </div>
              <button onClick={() => setShowPopup(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: 0 }}>✕</button>
            </div>
          </div>
        )}

        {/* map */}
        <div style={{ flex: 1, minHeight: 380, position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <IndiaMapMock cities={enrichedCities} selectedCity={selectedCity} onSelect={handleCitySelect} />
          <div style={{ position: "absolute", bottom: 10, left: 14, fontSize: 11, color: "var(--text-muted)" }}>
            X: 4.772374 &nbsp; Y: 76.871379
          </div>
          <div style={{ position: "absolute", bottom: 10, right: 14, display: "flex", gap: 6 }}>
            {["ZOOM", "+", "−"].map((l, i) => (
              <button key={i} style={{
                padding: "4px 10px", background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 6, color: "var(--text-muted)", fontSize: 12, cursor: "pointer"
              }}>{l}</button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
