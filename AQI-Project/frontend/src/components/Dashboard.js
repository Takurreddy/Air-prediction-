import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Tooltip, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import runtimeConfig from "../config/runtimeConfig";
import CITIES from "../config/cities";
import useLocationTranslation from "../hooks/useLocationTranslation";

import {
  fetchAirQualityByCity,
  fetchAllStations,
  fetchStationsByCity,
} from "../services/airQualityService";

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png").default || require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png").default || require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default || require("leaflet/dist/images/marker-shadow.png"),
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

/* ── India GeoJSON border ── */
const INDIA_GEOJSON = {
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    properties: { name: "India" },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [68.17,7.97],[69.66,22.09],[68.84,24.36],[71.04,24.36],[70.84,25.22],
        [70.28,25.72],[70.17,26.49],[69.51,26.94],[70.62,28.02],[71.78,27.91],
        [72.82,28.96],[73.45,29.98],[74.42,30.98],[74.41,31.69],[75.26,32.27],
        [74.45,32.76],[74.10,33.44],[73.75,34.32],[74.24,34.75],[75.76,34.50],
        [76.87,34.65],[77.84,35.49],[78.91,34.32],[78.81,33.51],[79.21,32.50],
        [79.18,31.02],[80.68,30.77],[81.11,30.18],[80.48,29.73],[80.09,28.79],
        [81.06,28.42],[82.00,27.93],[83.30,27.36],[84.67,27.23],[85.25,26.73],
        [86.02,26.63],[87.23,26.40],[88.06,26.41],[88.17,26.81],[88.04,27.45],
        [88.73,28.09],[88.81,27.30],[89.28,26.01],[89.83,25.97],[89.92,25.27],
        [90.87,25.13],[91.80,25.15],[92.38,25.07],[93.30,24.08],[93.33,23.04],
        [93.09,22.70],[93.17,22.28],[92.67,22.04],[92.15,21.53],[92.10,21.06],
        [92.33,20.92],[92.08,21.19],[91.99,22.50],[91.16,22.82],[90.59,23.27],
        [90.27,21.84],[89.85,22.04],[89.70,21.86],[89.09,21.87],[88.21,21.70],
        [86.98,21.50],[87.03,21.61],[86.56,19.83],[85.43,19.89],[84.76,19.61],
        [83.94,18.30],[83.19,17.67],[82.19,17.02],[82.19,16.56],[81.69,16.31],
        [80.79,15.95],[80.32,15.90],[80.03,14.52],[80.23,13.84],[80.29,13.01],
        [79.86,12.06],[79.86,10.31],[79.34,10.31],[78.89,9.55],[79.19,9.22],
        [78.28,8.93],[77.94,8.25],[77.54,7.97],[76.59,8.90],[76.13,10.30],
        [75.75,11.31],[75.40,11.78],[74.86,12.74],[74.62,13.99],[74.44,14.62],
        [73.53,15.99],[73.12,17.93],[72.82,19.21],[72.82,20.42],[72.63,21.36],
        [71.18,20.76],[70.47,20.88],[69.16,22.09],[68.17,7.97]
      ]]
    }
  }]
};

/* ── Haversine formula to find closest city ── */
function findClosestCity(lat, lng, cities) {
  const toRad = (value) => (value * Math.PI) / 180;
  let minDistance = Infinity;
  let closest = null;
  const R = 6371; // Radius of Earth in km
  for (const city of cities) {
    if (!city.lat || !city.lng) continue;
    const dLat = toRad(city.lat - lat);
    const dLng = toRad(city.lng - lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat)) * Math.cos(toRad(city.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    if (distance < minDistance) {
      minDistance = distance;
      closest = city;
    }
  }
  return closest;
}

/* ── Map bounds for India ── */
const INDIA_BOUNDS = [[6.5, 68], [37, 97.5]];

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
const StarIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "#eab308" : "none"} stroke={filled ? "#eab308" : "currentColor"} strokeWidth="2"
    style={{ width: 16, height: 16, cursor: "pointer" }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, flexShrink: 0 }}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);
const WindArrow = ({ deg }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ width: 16, height: 16, transform: `rotate(${deg || 0}deg)`, transition: "transform 0.3s" }}>
    <path d="M12 2l4 8H8l4-8z" fill="currentColor"/>
    <line x1="12" y1="10" x2="12" y2="22"/>
  </svg>
);

const createCustomIcon = (aqi, isSelected) => {
  const color = aqiColor(aqi);
  const size = isSelected ? 44 : 36;
  const fontSize = isSelected ? 12 : 11;
  const border = isSelected ? '2px solid #fff' : '1px solid rgba(0,0,0,0.3)';

  const html = `
    <div class="aqi-marker-dot${isSelected ? ' aqi-marker-dot--selected' : ''}" style="
      background-color: ${color}90; /* translucent */
      backdrop-filter: blur(8px) saturate(150%);
      -webkit-backdrop-filter: blur(8px) saturate(150%);
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
      opacity: 1;
      animation: pulse-marker 2s ease-in-out infinite;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3);
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
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
        map.setView([city.lat, city.lng], 5.5, { animate: true });
      }
    }
  }, [selectedCity, cities, map]);
  return null;
}

/* ── Live mousemove coordinate tracker ── */
function MouseCoordinates({ onMove }) {
  useMapEvents({
    mousemove: (e) => {
      onMove({ lat: e.latlng.lat.toFixed(6), lng: e.latlng.lng.toFixed(6) });
    },
  });
  return null;
}

/* ── Exposure logger — writes to aq_exposure localStorage ── */
function logExposure(city, aqi) {
  try {
    const history = JSON.parse(localStorage.getItem("aq_exposure") || "[]");
    const now = new Date();
    const ts = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} · ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} ${now.getHours() >= 12 ? 'pm' : 'am'}`;
    history.unshift({ city, aqi, ts });
    // Keep last 50 entries
    localStorage.setItem("aq_exposure", JSON.stringify(history.slice(0, 50)));
  } catch { /* non-fatal */ }
}

/* ── Search history helpers ── */
function getSearchHistory() {
  try { return JSON.parse(localStorage.getItem("aq_search_history") || "[]"); }
  catch { return []; }
}
function addToSearchHistory(city) {
  const history = getSearchHistory().filter(c => c !== city);
  history.unshift(city);
  localStorage.setItem("aq_search_history", JSON.stringify(history.slice(0, 5)));
}

/* ── Favorites helpers ── */
function getFavorites() {
  try { return JSON.parse(localStorage.getItem("aq_favorites") || "[]"); }
  catch { return []; }
}
function toggleFavorite(city) {
  const favs = getFavorites();
  const idx = favs.indexOf(city);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(city);
  localStorage.setItem("aq_favorites", JSON.stringify(favs));
  return favs;
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

function RealIndiaMap({ cities, selectedCity, onSelect, mapTab, translateCity, t }) {
  const center = [22.5937, 78.9629]; // center of India
  const isLight = document.documentElement.getAttribute("data-theme") === "light";

  const isHybrid = mapTab === "hybrid";
  const standardTileUrl = isLight
    ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  const [mouseCoords, setMouseCoords] = useState({ lat: "—", lng: "—" });

  const geoJsonStyle = useMemo(() => ({
    color: isHybrid ? "#38bdf8" : (isLight ? "#64748b" : "#14b8a6"),
    weight: 1.5,
    opacity: 0.7,
    fillColor: isHybrid ? "#38bdf8" : (isLight ? "#6366f1" : "#14b8a6"),
    fillOpacity: 0.03,
    dashArray: "4, 4",
  }), [isLight, isHybrid]);

  return (
    <>
      <MapContainer
        center={center}
        zoom={5}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        scrollWheelZoom={true}
        maxBounds={[[6.5, 68.1], [35.5, 97.4]]}
        maxBoundsViscosity={0.8}
        minZoom={5}
      >
        {isHybrid ? (
          <>
            <TileLayer
              key="hybrid-sat"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              maxZoom={18}
            />
            <TileLayer
              key="hybrid-labels"
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              subdomains="abcd"
              maxZoom={19}
            />
          </>
        ) : (
          <TileLayer
            key={isLight ? "carto-light" : "carto-dark"}
            url={standardTileUrl}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />
        )}
        <GeoJSON data={INDIA_GEOJSON} style={() => geoJsonStyle} />
        <MouseCoordinates onMove={setMouseCoords} />
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
              <Tooltip>{translateCity(city.name)} (AQI: {aqi})</Tooltip>
            </Marker>
          );
        })}
        <FitBounds selectedCity={selectedCity} cities={cities} />
      </MapContainer>
      <div style={{ position: "absolute", bottom: 10, left: 14, fontSize: 11, color: "var(--text-muted)", zIndex: 1000, pointerEvents: "none" }}>
        {t('dashboard.lat')}: {mouseCoords.lat} &nbsp; {t('dashboard.lng')}: {mouseCoords.lng}
      </div>
    </>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { translateCity, searchCities } = useLocationTranslation();
  const [searchQuery, setSearchQuery]       = useState("");
  const [selectedCity, setSelectedCity]     = useState(CITIES[0].name);
  const [station, setStation]               = useState(null);
  const [cityAqiMap, setCityAqiMap]         = useState({});
  const [error, setError]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const [mapTab, setMapTab]                 = useState("iq");
  const [showPopup, setShowPopup]           = useState(true);
  const [availableCities, setAvailableCities] = useState([]);
  const [favorites, setFavorites]           = useState(getFavorites());
  const [searchHistory]                     = useState(getSearchHistory());
  const [showFavModal, setShowFavModal]     = useState(false);
  const [cityDirOpen, setCityDirOpen]       = useState(false);

  const loadCityData = useCallback(async (city) => {
    try {
      setLoading(true); setError("");
      const [, readings] = await Promise.all([
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
                wind_speed: (weatherData.wind.speed * 3.6).toFixed(1),
                wind_deg: weatherData.wind.deg,
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
        // Log exposure for the Exposure History page
        logExposure(city, first.aqi);
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
    addToSearchHistory(cityName);
    loadCityData(cityName);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const closest = findClosestCity(latitude, longitude, CITIES);
        if (closest) {
          handleCitySelect(closest.name);
        }
        setLoading(false);
      },
      (err) => {
        setError("Unable to retrieve your location. Please check permissions.");
        setLoading(false);
      }
    );
  };

  const handleToggleFavorite = (cityName) => {
    const newFavs = toggleFavorite(cityName);
    setFavorites([...newFavs]);
  };

  const aqiMeta    = getAqiMeta(station?.aqi);
  const displayAqi = station?.aqi ?? CITIES.find(c => c.name === selectedCity)?.defaultAqi ?? "—";
  const selectedCityData = CITIES.find(c => c.name === selectedCity);
  const selectedCityLabel = translateCity(selectedCity);

  const enrichedCities = CITIES.map(c => ({ ...c, aqi: cityAqiMap[c.name] ?? c.defaultAqi }));

  const filteredCities = useMemo(() => searchCities(searchQuery), [searchQuery, searchCities]);

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
        <button onClick={handleLocateMe} className="ai-btn ai-btn--ghost ai-btn--sm" style={{ marginLeft: 8, whiteSpace: "nowrap" }} title="Locate Me">
          📍 Locate Me
        </button>
        <div className="aq-cities-badge">
          <span>{t('dashboard.cities')}</span>
          <strong>{availableCities.length || CITIES.length} {t('dashboard.active')}</strong>
        </div>
        <button className="aq-fav-trigger-btn" onClick={() => setShowFavModal(!showFavModal)}>
          <BookmarkIcon /> Favorites
        </button>
      </div>

      {/* ── sidebar ── */}
      <aside className="aq-sidebar">
        <h1 className="aq-page-title">{t('dashboard.title')}</h1>
        <div className="aq-meta">
          <CalIcon />
          {dateStr} · {t('dashboard.localTime')}
          &nbsp;·&nbsp; Local → 🇮🇳 IND
        </div>

        {/* search history */}
        {searchHistory.length > 0 && !searchQuery && (
          <div className="aq-search-history">
            <div className="section-label" style={{ fontSize: 11, marginBottom: 6 }}>🕐 Recent</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {searchHistory.map(c => (
                <button key={c} className="ai-btn ai-btn--ghost ai-btn--sm" style={{ fontSize: 11 }}
                  onClick={() => handleCitySelect(c)}>{translateCity(c)}</button>
              ))}
            </div>
          </div>
        )}

        {/* favorites */}
        {favorites.length > 0 && !searchQuery && (
          <div className="aq-favorites" style={{ marginTop: 10, marginBottom: 10 }}>
            <div className="section-label" style={{ fontSize: 11, marginBottom: 6 }}>⭐ Favorites</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {favorites.map(c => (
                <button key={c} className="ai-btn ai-btn--ghost ai-btn--sm" style={{ fontSize: 11 }}
                  onClick={() => handleCitySelect(c)}>{translateCity(c)}</button>
              ))}
            </div>
          </div>
        )}

        {/* directory — collapsible */}
        <div className="aq-dir">
          <div className="section-label"><PinIcon /> {t('dashboard.interactiveDir')}</div>
          <div className="aq-dir__header" onClick={() => setCityDirOpen(prev => !prev)}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{t('dashboard.exploreCoords')} ({filteredCities.length})</div>
            <button className="aq-dir__toggle" title={cityDirOpen ? "Collapse" : "Expand"}>
              {cityDirOpen ? "▲ Hide" : "▼ Show"}
            </button>
          </div>
          <div className={`aq-dir__list${cityDirOpen ? "" : " aq-dir__list--collapsed"}`}>
            {filteredCities.map(city => {
              const aqi = cityAqiMap[city.name] ?? city.defaultAqi;
              const isFav = favorites.includes(city.name);
              return (
                <div
                  key={city.name}
                  className={`aq-dir__item${selectedCity === city.name ? " aq-dir__item--active" : ""}`}
                  onClick={() => handleCitySelect(city.name)}
                >
                  <div className="aq-dir__info">
                    <div className="aq-dir__city">
                      <strong>{translateCity(city.name)}</strong>
                      <span onClick={(e) => { e.stopPropagation(); handleToggleFavorite(city.name); }}
                        style={{ marginLeft: 4 }}>
                        <StarIcon filled={isFav} />
                      </span>
                    </div>
                    <div className="aq-dir__coords">
                      {city.state} · {city.lat.toFixed(2)}, {city.lng.toFixed(2)}
                    </div>
                  </div>
                  <div className="aq-dir__aqi" style={{ color: aqiColor(aqi) }}>
                    {aqi}
                    <span className="aqi-dot aqi-dot--pulse" style={{ background: aqiColor(aqi), boxShadow: `0 0 6px ${aqiColor(aqi)}` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* stats panel */}
        {station && (
          <div className="aq-stats">
            <div className="section-label">{t('dashboard.mainStats')}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{selectedCityLabel}</div>
              <span onClick={() => handleToggleFavorite(selectedCity)} style={{ cursor: "pointer" }}>
                <StarIcon filled={favorites.includes(selectedCity)} />
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>{selectedCityLabel}, India</div>
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

            {/* Full pollutant grid */}
            <div className="pollutant-grid">
              {[
                { key: "PM2.5", val: station.pm25 },
                { key: "PM10",  val: station.pm10 },
                { key: "CO",    val: station.co },
                { key: "NO₂",   val: station.no2 },
                { key: "SO₂",   val: station.so2 },
                { key: "O₃",    val: station.o3 },
              ].map(({ key, val }) => (
                <div key={key} className="pollutant-grid__item">
                  <span className="pollutant-grid__label">{key}</span>
                  <span className="pollutant-grid__value">{val != null ? val.toFixed?.(1) ?? val : "—"}</span>
                </div>
              ))}
            </div>

            {/* Wind speed + direction */}
            <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 13 }}>
              <div>💨 Wind: <strong>{station.wind_speed ?? "—"} km/h</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <WindArrow deg={station.wind_deg} /> <span style={{ color: "var(--text-muted)" }}>{station.wind_deg ?? "—"}°</span>
              </div>
            </div>

            {/* Google Maps link */}
            {selectedCityData && (
              <a
                href={`https://www.google.com/maps/@${selectedCityData.lat},${selectedCityData.lng},14z`}
                target="_blank"
                rel="noreferrer"
                className="ai-btn ai-btn--ghost ai-btn--sm"
                style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                📍 Open in Google Maps
              </a>
            )}

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
                <div className="aq-popup__title">📍 {selectedCityLabel}, India Air Quality</div>
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
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button className="ai-btn ai-btn--ghost ai-btn--sm" onClick={() => {}}>Details</button>
                  {selectedCityData && (
                    <a
                      href={`https://www.google.com/maps/@${selectedCityData.lat},${selectedCityData.lng},14z`}
                      target="_blank" rel="noreferrer"
                      className="ai-btn ai-btn--ghost ai-btn--sm"
                    >GMap ↗</a>
                  )}
                </div>
              </div>
              <button onClick={() => setShowPopup(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: 0 }}>✕</button>
            </div>
          </div>
        )}

        {/* map */}
        <div style={{ flex: 1, minHeight: 380, position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <RealIndiaMap
            cities={enrichedCities}
            selectedCity={selectedCity}
            onSelect={handleCitySelect}
            mapTab={mapTab}
            translateCity={translateCity}
            t={t}
          />
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

      {/* ── Favorite Locations Modal Drawer ── */}
      {showFavModal && (
        <div className="aq-fav-modal-backdrop" onClick={() => setShowFavModal(false)}>
          <div className="aq-fav-modal" onClick={e => e.stopPropagation()}>
            <div className="aq-fav-modal__header">
              <div className="aq-fav-modal__title">
                <BookmarkIcon /> Favorites
              </div>
              <button className="aq-fav-modal__close" onClick={() => setShowFavModal(false)}>✕</button>
            </div>

            <div className="aq-fav-modal__body">
              {favorites.length === 0 ? (
                <div className="aq-fav-empty">
                  <div className="aq-fav-empty__star">⭐</div>
                  <h3 className="aq-fav-empty__title">No favorites yet</h3>
                  <p className="aq-fav-empty__desc">Save your frequently monitored cities for quick access.</p>
                  <button className="ai-btn ai-btn--ghost ai-btn--sm" onClick={() => setShowFavModal(false)}>
                    Browse cities
                  </button>
                </div>
              ) : (
                <div className="aq-fav-list">
                  <div className="section-label" style={{ marginBottom: 8, fontSize: 11 }}>Saved locations ({favorites.length})</div>
                  {favorites.map(cityName => {
                    const city = CITIES.find(c => c.name === cityName);
                    const aqi = cityAqiMap[cityName] ?? city?.defaultAqi ?? 100;
                    const meta = getAqiMeta(aqi);
                    return (
                      <div key={cityName} className="aq-fav-card" onClick={() => { handleCitySelect(cityName); setShowFavModal(false); }}>
                        <div className="aq-fav-card__info">
                          <strong style={{ fontSize: 14 }}>📍 {translateCity(cityName)}</strong>
                          <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 4 }}>({city?.state ?? 'India'})</span>
                          <div style={{ fontSize: 12, marginTop: 3 }}>
                            <span style={{ color: aqiColor(aqi), fontWeight: 700 }}>AQI {aqi}</span> · {meta.label}
                          </div>
                        </div>
                        <button className="aq-fav-star-btn" title="Remove favorite" onClick={(e) => { e.stopPropagation(); handleToggleFavorite(cityName); }}>
                          ★
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* RECENTLY VIEWED */}
              <div className="aq-recent-section" style={{ marginTop: 20 }}>
                <div className="section-label" style={{ marginBottom: 8, fontSize: 11 }}>Recently viewed</div>
                {searchHistory.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>No recently viewed cities</div>
                ) : (
                  <div className="aq-recent-list">
                    {searchHistory.map(cityName => {
                      const city = CITIES.find(c => c.name === cityName) || { name: cityName, state: 'India', defaultAqi: 120 };
                      const aqi = cityAqiMap[cityName] ?? city.defaultAqi;
                      const meta = getAqiMeta(aqi);
                      return (
                        <div key={cityName} className="aq-recent-card" onClick={() => { handleCitySelect(cityName); setShowFavModal(false); }}>
                          <span style={{ fontSize: 14 }}>📍</span>
                          <div className="aq-recent-card__details">
                            <strong style={{ fontSize: 13 }}>{translateCity(cityName)}</strong> <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({city.state})</span>
                            <div style={{ fontSize: 11, marginTop: 2, color: "var(--text-muted)" }}>
                              <span style={{ color: aqiColor(aqi), fontWeight: 700 }}>AQI {aqi}</span> · {meta.label} &nbsp; ☀️ 34°C
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
