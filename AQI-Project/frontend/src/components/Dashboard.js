import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker, useMap, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import runtimeConfig from "../config/runtimeConfig";

import {
  fetchAirQualityByCity,
  fetchAllStations,
  fetchStationsByCity,
} from "../services/airQualityService";

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

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

const createCustomIcon = (aqi, isSelected) => {
  const color = aqiColor(aqi);
  const size = isSelected ? 44 : 36;
  const fontSize = isSelected ? 12 : 11;
  const border = isSelected ? '2px solid #fff' : '1px solid rgba(0,0,0,0.3)';
  
  const html = `
    <div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: ${border};
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: ${fontSize}px;
      opacity: 0.9;
    ">
      ${aqi}
    </div>
  `;
  
  return L.divIcon({
    html,
    className: 'custom-aqi-icon',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

function FitBounds({ selectedCity, cities }) {
  const map = useMap();
  useEffect(() => {
    if (selectedCity) {
      const city = cities.find(c => c.name === selectedCity);
      if (city && city.lat && city.lng) {
        map.setView([city.lat, city.lng], 7, { animate: true });
      }
    }
  }, [selectedCity, cities, map]);
  return null;
}

function RealIndiaMap({ cities, selectedCity, onSelect, mapTab }) {
  const center = [20.5937, 78.9629]; // center of India
  const tileUrl = mapTab === "hybrid" 
    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%", zIndex: 1 }} scrollWheelZoom={true}>
      <TileLayer url={tileUrl} />
      {cities.map(city => {
        const aqi = city.aqi ?? city.defaultAqi;
        const isSelected = selectedCity === city.name;
        return (
          <Marker 
            key={city.name} 
            position={[city.lat, city.lng]} 
            icon={createCustomIcon(aqi, isSelected)}
            eventHandlers={{
              click: () => onSelect(city.name),
            }}
          >
            <Tooltip>{city.name} (AQI: {aqi})</Tooltip>
          </Marker>
        );
      })}
      <FitBounds selectedCity={selectedCity} cities={cities} />
    </MapContainer>
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
  const { t } = useTranslation();
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
            placeholder={t('dashboard.search')}
          />
        </div>
        <div className="aq-cities-badge">
          <span>{t('dashboard.cities')}</span>
          <strong>{availableCities.length || CITIES.length} {t('dashboard.active')}</strong>
        </div>
      </div>

      {/* ── sidebar ── */}
      <aside className="aq-sidebar">
        <h1 className="aq-page-title">{t('dashboard.title')}</h1>
        <div className="aq-meta">
          <CalIcon />
          {dateStr} · {t('dashboard.localTime')}
          &nbsp;·&nbsp; Local → 🇮🇳 IND
        </div>

        {/* directory */}
        <div className="aq-dir">
          <div className="section-label"><PinIcon /> {t('dashboard.interactiveDir')}</div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{t('dashboard.exploreCoords')}</div>
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
                    {t('dashboard.lat')}: {city.lat} | {t('dashboard.lng')}: {city.lng}
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
                  <div>{t('dashboard.dominant')} &nbsp; <strong style={{ color: "var(--text-main)" }}>{station.pm25 != null ? "PM2.5" : "PM10"}</strong></div>
                  <div style={{ marginTop: 4 }}>{t('dashboard.temp')} &nbsp; <strong style={{ color: "var(--text-main)" }}>{station.temperature ?? "—"}°C</strong></div>
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
              {t('dashboard.iqMap')}
            </button>
            <button className={`aq-map__tab${mapTab === "hybrid" ? " aq-map__tab--active" : ""}`} onClick={() => setMapTab("hybrid")}>
              {t('dashboard.hybrid')}
            </button>
          </div>

          <button className="aq-map__recenter" onClick={() => setShowPopup(true)}>
            <TargetIcon style={{ width: 14, height: 14 }} /> {t('dashboard.recenter')}
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
          <RealIndiaMap cities={enrichedCities} selectedCity={selectedCity} onSelect={handleCitySelect} mapTab={mapTab} />
          <div style={{ position: "absolute", bottom: 10, left: 14, fontSize: 11, color: "var(--text-muted)", zIndex: 1000, pointerEvents: "none" }}>
            X: 4.772374 &nbsp; Y: 76.871379
          </div>
          <div style={{ position: "absolute", bottom: 10, right: 14, display: "flex", gap: 6, zIndex: 1000 }}>
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
