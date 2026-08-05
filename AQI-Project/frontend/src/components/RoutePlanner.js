import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { evaluateRoutes } from "../services/airQualityService";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const DEFAULT_CENTER = [20.5937, 78.9629]; // centre of India

const CITIES = [
  { name: "Delhi", lat: 28.6139, lng: 77.2090 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
  { name: "Surat", lat: 21.1702, lng: 72.8311 },
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
];

const RouteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:13,height:13 }}>
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/>
  </svg>
);

// Helper component to auto-fit bounds when markers change
function FitBounds({ start, dest }) {
  const map = useMap();
  useEffect(() => {
    if (start && dest) {
      const bounds = L.latLngBounds([start.lat, start.lng], [dest.lat, dest.lng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (start) {
      map.setView([start.lat, start.lng], 8);
    } else if (dest) {
      map.setView([dest.lat, dest.lng], 8);
    }
  }, [start, dest, map]);
  return null;
}

export default function RoutePlanner() {
  const { t } = useTranslation();
  const [startCityName, setStartCityName] = useState("");
  const [destCityName,  setDestCityName]  = useState("");
  const [departAt,  setDepartAt]    = useState("09:00");
  const [start,     setStart]       = useState(null);
  const [dest,      setDest]        = useState(null);
  const [result,    setResult]      = useState(null);
  const [routeError, setRouteError] = useState("");
  const [loading,   setLoading]     = useState(false);

  function handleStartChange(e) {
    const name = e.target.value;
    setStartCityName(name);
    const c = CITIES.find(city => city.name === name);
    setStart(c ? { lat: c.lat, lng: c.lng } : null);
  }

  function handleDestChange(e) {
    const name = e.target.value;
    setDestCityName(name);
    const c = CITIES.find(city => city.name === name);
    setDest(c ? { lat: c.lat, lng: c.lng } : null);
  }

  async function findRoute() {
    if (!start || !dest) { setRouteError("Select both source and destination."); return; }
    try {
      setLoading(true); setRouteError("");
      const res = await evaluateRoutes({
        origin_lat: start.lat, origin_lon: start.lng,
        dest_lat:   dest.lat,  dest_lon:   dest.lng,
        alternatives: 3, use_predictions: true,
      });
      const rec  = res.alternatives?.[res.recommended_index];
      setResult({
        distance:       rec?.distance_m != null ? (rec.distance_m / 1000).toFixed(1) : "—",
        duration:       rec?.duration_s != null ? Math.round(rec.duration_s / 60)     : "—",
        score:          rec?.avg_aqi    != null ? Math.max(0, 100 - rec.avg_aqi).toFixed(0) : "—",
        recommendation: res.recommendation || "Recommended route selected.",
        avgAqi:         rec?.avg_aqi?.toFixed(0) ?? "—",
      });
    } catch (e) {
      setRouteError(e?.response?.data?.detail || "Route evaluation failed.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setStart(null); setDest(null); setStartCityName(""); setDestCityName("");
    setResult(null); setRouteError("");
  }

  return (
    <div className="route-page">
      {/* ── planner panel ── */}
      <div className="route-panel">
        <div className="route-panel__header">
          <div className="route-panel__label"><RouteIcon /> {t('route.title')}</div>
          <div className="route-panel__title">{t('route.plan')}</div>
        </div>

        <div className="route-inputs">
          {/* source */}
          <div className="route-col">
            <label>{t('route.source')}</label>
            <select
              className="ai-select"
              value={startCityName}
              onChange={handleStartChange}
            >
              <option value="">{t('route.selectCity')}</option>
              {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <span className="route-inputs__arrow">→</span>

          {/* destination */}
          <div className="route-col">
            <label>{t('route.dest')}</label>
            <select
              className="ai-select"
              value={destCityName}
              onChange={handleDestChange}
            >
              <option value="">{t('route.selectCity')}</option>
              {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {/* depart at */}
          <div className="route-time">
            <label>{t('route.depart')}</label>
            <input type="time" value={departAt} onChange={e => setDepartAt(e.target.value)} />
          </div>
        </div>

        <div className="route-actions">
          <button className="ai-btn" type="button" onClick={findRoute} disabled={loading}>
            <RouteIcon /> {loading ? t('route.eval') : t('route.btnGet')}
          </button>
          <button className="ai-btn ai-btn--ghost" type="button" onClick={clearAll}>
            {t('route.clear')}
          </button>
        </div>

        {routeError && <p className="status-message status-error" style={{ marginTop: 10 }}>{routeError}</p>}
      </div>

      {/* ── result ── */}
      {result && (
        <div className="route-result">
          <div style={{ fontWeight: 700, marginBottom: 14 }}>{t('route.summary')}</div>
          <div className="route-result__grid">
            <div className="route-result__stat">
              <div className="route-result__stat-label">{t('route.distance')}</div>
              <div className="route-result__stat-val">{result.distance} km</div>
            </div>
            <div className="route-result__stat">
              <div className="route-result__stat-label">{t('route.travelTime')}</div>
              <div className="route-result__stat-val">{result.duration} min</div>
            </div>
            <div className="route-result__stat">
              <div className="route-result__stat-label">{t('route.avgAqi')}</div>
              <div className="route-result__stat-val">{result.avgAqi}</div>
            </div>
            <div className="route-result__stat">
              <div className="route-result__stat-label">{t('route.score')}</div>
              <div className="route-result__stat-val">{result.score}%</div>
            </div>
          </div>
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)" }}>{result.recommendation}</p>
        </div>
      )}

      {/* ── map ── */}
      <div className="map-container" style={{ height: "420px", borderRadius: "12px", overflow: "hidden" }}>
        <MapContainer center={DEFAULT_CENTER} zoom={5} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <FitBounds start={start} dest={dest} />
          {start && <Marker position={[start.lat, start.lng]} />}
          {dest && <Marker position={[dest.lat, dest.lng]} />}
        </MapContainer>
      </div>
    </div>
  );
}
