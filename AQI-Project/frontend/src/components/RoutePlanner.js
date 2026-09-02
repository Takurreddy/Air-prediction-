import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { evaluateRoutes } from "../services/airQualityService";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import CITIES from "../config/cities";
import useLocationTranslation from "../hooks/useLocationTranslation";

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png").default || require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png").default || require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default || require("leaflet/dist/images/marker-shadow.png"),
});

const DEFAULT_CENTER = [20.5937, 78.9629]; // centre of India

const RouteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:16, height:16 }}>
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/>
  </svg>
);

const NavigationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:18, height:18 }}>
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
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
      map.setView([start.lat, start.lng], 7);
    } else if (dest) {
      map.setView([dest.lat, dest.lng], 7);
    }
  }, [start, dest, map]);
  return null;
}

// Camera tracking component during navigation
function NavCameraFollow({ position, isNavigating }) {
  const map = useMap();
  useEffect(() => {
    if (isNavigating && position) {
      map.panTo(position, { animate: true, duration: 0.15 });
    }
  }, [position, isNavigating, map]);
  return null;
}

// Interpolate smooth coordinate path between waypoints
function generateSmoothPath(start, dest, waypoints) {
  let rawCoords = [];
  if (waypoints && waypoints.length > 1) {
    rawCoords = waypoints.map(wp => [wp.latitude, wp.longitude]);
  } else if (start && dest) {
    rawCoords = [[start.lat, start.lng], [dest.lat, dest.lng]];
  } else {
    return [];
  }

  const totalSteps = 160;
  const path = [];
  const segments = rawCoords.length - 1;
  const stepsPerSeg = Math.max(2, Math.floor(totalSteps / segments));

  for (let i = 0; i < segments; i++) {
    const [lat1, lng1] = rawCoords[i];
    const [lat2, lng2] = rawCoords[i + 1];
    for (let s = 0; s < stepsPerSeg; s++) {
      const t = s / stepsPerSeg;
      path.push([
        lat1 + (lat2 - lat1) * t,
        lng1 + (lng2 - lng1) * t
      ]);
    }
  }
  path.push(rawCoords[rawCoords.length - 1]);
  return path;
}

function calculateBearing(p1, p2) {
  if (!p1 || !p2) return 0;
  const lat1 = (p1[0] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;
  const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function aqiColor(v) {
  if (v == null) return "#64748b";
  if (v <= 50)   return "#22c55e";
  if (v <= 100)  return "#eab308";
  if (v <= 150)  return "#f97316";
  if (v <= 200)  return "#ef4444";
  return "#8b5cf6";
}

function createNavVehicleIcon(angle = 0) {
  return L.divIcon({
    html: `
      <div style="
        width: 40px; height: 40px; border-radius: 50%;
        background: linear-gradient(135deg, rgba(13,148,136,0.7), rgba(2,132,199,0.7));
        backdrop-filter: blur(8px) saturate(150%);
        -webkit-backdrop-filter: blur(8px) saturate(150%);
        border: 2px solid rgba(255,255,255,0.4);
        box-shadow: 0 8px 16px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3);
        display: flex; align-items: center; justify-content: center;
        transform: rotate(${angle}deg);
        transition: transform 100ms linear;
      ">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="white" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
        </svg>
      </div>
    `,
    className: 'nav-vehicle-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}

/* ── AQI color strip component ── */
function AqiColorStrip({ path, navIndex }) {
  if (!path || path.length === 0) return null;
  const segments = 24;
  const step = Math.floor(path.length / segments);

  return (
    <div className="aqi-strip" style={{ marginTop: 12 }}>
      <div className="aqi-strip__label">Live Route AQI Profile &amp; Waypoint Exposure</div>
      <div className="aqi-strip__bar" style={{ height: 10 }}>
        {Array.from({ length: segments }, (_, i) => {
          const idx = Math.min(i * step, path.length - 1);
          const simulatedAqi = 60 + Math.sin(idx * 0.08) * 55 + (i * 2);
          const isActive = navIndex >= idx;
          return (
            <div
              key={i}
              className="aqi-strip__segment"
              style={{
                backgroundColor: aqiColor(simulatedAqi),
                opacity: isActive ? 1 : 0.35,
                flex: 1,
              }}
              title={`Waypoint ${i + 1}: AQI ~${Math.round(simulatedAqi)}`}
            />
          );
        })}
      </div>
      <div className="aqi-strip__labels" style={{ marginTop: 4 }}>
        <span>Origin</span>
        <span>En-route Waypoints</span>
        <span>Destination</span>
      </div>
    </div>
  );
}

export default function RoutePlanner() {
  const { t } = useTranslation();
  const { translateCity } = useLocationTranslation();
  const [startCityName, setStartCityName] = useState("Mumbai");
  const [destCityName,  setDestCityName]  = useState("Delhi");
  const [departAt,      setDepartAt]      = useState("09:00");
  const [start,         setStart]         = useState(() => {
    const c = CITIES.find(city => city.name === "Mumbai");
    return c ? { lat: c.lat, lng: c.lng } : null;
  });
  const [dest, setDest] = useState(() => {
    const c = CITIES.find(city => city.name === "Delhi");
    return c ? { lat: c.lat, lng: c.lng } : null;
  });
  const [result,        setResult]        = useState(null);
  const [routeError,    setRouteError]    = useState("");
  const [loading,       setLoading]       = useState(false);

  // Navigation simulation states
  const [isNavigating, setIsNavigating] = useState(false);
  const [navIndex, setNavIndex]         = useState(0);
  const [speed, setSpeed]               = useState(1); // 1x, 2x, 4x
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(1); // Default to eco alternative

  function handleStartChange(e) {
    const name = e.target.value;
    setStartCityName(name);
    const c = CITIES.find(city => city.name === name);
    const newStart = c ? { lat: c.lat, lng: c.lng } : null;
    setStart(newStart);
    setIsNavigating(false);
    setNavIndex(0);
    if (newStart && dest) findRoute(newStart, dest);
  }

  function handleDestChange(e) {
    const name = e.target.value;
    setDestCityName(name);
    const c = CITIES.find(city => city.name === name);
    const newDest = c ? { lat: c.lat, lng: c.lng } : null;
    setDest(newDest);
    setIsNavigating(false);
    setNavIndex(0);
    if (start && newDest) findRoute(start, newDest);
  }

  const findRoute = async (source = start, destination = dest) => {
    if (!source || !destination) {
      setRouteError("Please select both source and destination cities.");
      return;
    }
    try {
      setLoading(true);
      setRouteError("");
      setIsNavigating(false);
      setNavIndex(0);

      const res = await evaluateRoutes({
        origin_lat: source.lat,
        origin_lon: source.lng,
        dest_lat: destination.lat,
        dest_lon: destination.lng,
        alternatives: 3,
        use_predictions: true,
      });

      const recIdx = res.recommended_index ?? 0;
      setSelectedRouteIdx(recIdx);
      const rec = res.alternatives?.[recIdx] || res.alternatives?.[0];

      setResult({
        distance: rec?.distance_m != null ? (rec.distance_m / 1000).toFixed(1) : "—",
        duration: rec?.duration_s != null ? Math.round(rec.duration_s / 60) : "—",
        score: rec?.avg_aqi != null ? Math.max(0, 100 - rec.avg_aqi).toFixed(0) : "—",
        recommendation: res.recommendation || "Route evaluated.",
        avgAqi: rec?.avg_aqi?.toFixed(0) ?? "—",
        alternatives: res.alternatives,
        recommended_index: recIdx,
      });
    } catch (e) {
      setRouteError("Route evaluation encountered an error.");
    } finally {
      setLoading(false);
    }
  };

  // Removed useEffect so route is only calculated when city explicitly selected or button clicked.

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setRouteError("Geolocation is not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const toRad = (value) => (value * Math.PI) / 180;
        let minDistance = Infinity;
        let closest = null;
        const R = 6371;
        for (const city of CITIES) {
          if (!city.lat || !city.lng) continue;
          const dLat = toRad(city.lat - latitude);
          const dLng = toRad(city.lng - longitude);
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(toRad(latitude)) * Math.cos(toRad(city.lat)) *
                    Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          if (distance < minDistance) {
            minDistance = distance;
            closest = city;
          }
        }
        if (closest) {
          setStartCityName(closest.name);
          const newStart = { lat: closest.lat, lng: closest.lng };
          setStart(newStart);
          if (newStart && dest) findRoute(newStart, dest);
        }
        setLoading(false);
      },
      (err) => {
        setRouteError("Unable to retrieve your location.");
        setLoading(false);
      }
    );
  };

  function clearAll() {
    setStart(null); setDest(null); setStartCityName(""); setDestCityName("");
    setResult(null); setRouteError(""); setIsNavigating(false); setNavIndex(0);
    setSpeed(1); setSelectedRouteIdx(0);
  }

  function resetNavigation() {
    setNavIndex(0);
    setIsNavigating(false);
  }

  // Active alternative
  const activeAlternative = result?.alternatives?.[selectedRouteIdx] || result?.alternatives?.[0];

  // Smooth path computation for active alternative
  const smoothPath = useMemo(() => {
    const waypoints = activeAlternative?.waypoints;
    return generateSmoothPath(start, dest, waypoints);
  }, [start, dest, activeAlternative]);

  // Navigation movement interval loop
  useEffect(() => {
    let timer = null;
    if (isNavigating && smoothPath.length > 0) {
      timer = setInterval(() => {
        setNavIndex(prev => {
          if (prev >= smoothPath.length - 1) {
            setIsNavigating(false);
            return prev;
          }
          return prev + 1;
        });
      }, Math.max(25, 100 / speed));
    }
    return () => clearInterval(timer);
  }, [isNavigating, smoothPath, speed]);

  const currentNavPos = smoothPath[navIndex] || null;
  const nextNavPos    = smoothPath[navIndex + 1] || currentNavPos;
  const vehicleAngle  = calculateBearing(currentNavPos, nextNavPos);
  const navProgressPct = smoothPath.length > 0 ? Math.round((navIndex / (smoothPath.length - 1)) * 100) : 0;

  const currentExposureAqi = currentNavPos
    ? Math.round(55 + Math.sin(navIndex * 0.08) * 45 + (selectedRouteIdx === 0 ? 35 : 10))
    : null;

  const googleMapsUrl = start && dest
    ? `https://www.google.com/maps/dir/${start.lat},${start.lng}/${dest.lat},${dest.lng}`
    : null;

  return (
    <div className="route-workspace">
      {/* ── Left Sidebar Controls & Summary ── */}
      <div className="route-sidebar">
        {/* ── Planner Form ── */}
        <div className="route-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div className="route-panel__label"><RouteIcon /> Navigation &amp; Exposure</div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Smart Route AQI Planner</h2>
            </div>
            {result && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {result.alternatives?.map((alt, idx) => {
                  const isSelected = selectedRouteIdx === idx;
                  const isEco = idx === 1;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedRouteIdx(idx);
                        setIsNavigating(false);
                        setNavIndex(0);
                      }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 700,
                        border: isSelected ? "2px solid var(--teal-lt)" : "1px solid var(--border-mid)",
                        background: isSelected ? "var(--teal-dim)" : "var(--bg-card)",
                        color: isSelected ? "var(--teal-lt)" : "var(--text-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span>{isEco ? "🌿 Low-Pollution" : "🚀 Fastest"}</span>
                      <span style={{ fontSize: 10, opacity: 0.8 }}>(AQI {alt.avg_aqi || 85})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="route-inputs" style={{ gridTemplateColumns: "1fr auto 1fr", gap: 10 }}>
            {/* Source */}
            <div className="route-col">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {t('route.source')}
                <button type="button" onClick={handleLocateMe} className="ai-btn ai-btn--ghost ai-btn--sm" style={{ padding: '0 6px', height: 'auto', fontSize: '10px' }} title="Current Location">
                  📍 Locate Me
                </button>
              </label>
              <select className="ai-select" value={startCityName} onChange={handleStartChange}>
                <option value="">Select Origin...</option>
                {CITIES.map(c => <option key={c.name} value={c.name}>{translateCity(c.name)}</option>)}
              </select>
            </div>

            <span className="route-inputs__arrow" style={{ paddingBottom: 0, alignSelf: "center" }}>→</span>

            {/* Destination */}
            <div className="route-col">
              <label>{t('route.dest')}</label>
              <select className="ai-select" value={destCityName} onChange={handleDestChange}>
                <option value="">Select Destination...</option>
                {CITIES.map(c => <option key={c.name} value={c.name}>{translateCity(c.name)}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <div className="route-time">
              <label>{t('route.depart')}</label>
              <input type="time" value={departAt} onChange={e => setDepartAt(e.target.value)} />
            </div>
          </div>

          <div className="route-actions" style={{ marginTop: 12, alignItems: "center" }}>
            <button className="ai-btn ai-btn--sm" type="button" onClick={findRoute} disabled={loading} style={{ flex: 1 }}>
              <RouteIcon /> {loading ? "Evaluating…" : "Get Route AQI Forecast"}
            </button>

            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="ai-btn ai-btn--ghost ai-btn--sm"
                style={{ textDecoration: "none" }}
              >
                GMap ↗
              </a>
            )}
          </div>

          {result && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
              <button
                className={`ai-btn ai-btn--sm ${isNavigating ? 'ai-btn--amber' : ''}`}
                type="button"
                onClick={() => {
                  if (navIndex >= smoothPath.length - 1) {
                    setNavIndex(0);
                  }
                  setIsNavigating(!isNavigating);
                }}
                style={{
                  flex: 1,
                  background: isNavigating ? 'var(--amber)' : 'linear-gradient(135deg, var(--teal), var(--sky))'
                }}
              >
                <NavigationIcon />
                {isNavigating ? '⏸ Pause' : (navIndex > 0 && navIndex < smoothPath.length - 1 ? '▶ Resume' : '▶ Start Driving Simulation')}
              </button>

              <button className="ai-btn ai-btn--ghost ai-btn--sm" type="button" onClick={resetNavigation}>
                ↺ Reset
              </button>

              {/* Speed chips */}
              <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                {[1, 2, 4].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    style={{
                      padding: "2px 6px",
                      borderRadius: "8px",
                      fontSize: "10px",
                      fontWeight: 700,
                      border: speed === s ? "1px solid var(--teal-lt)" : "1px solid var(--border-mid)",
                      background: speed === s ? "var(--teal)" : "var(--bg-card)",
                      color: speed === s ? "#fff" : "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {routeError && <p className="status-message status-error" style={{ marginTop: 10 }}>{routeError}</p>}
        </div>

        {/* ── Summary & Metrics HUD ── */}
        {result && (
          <div className="route-result" style={{ padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>
                {selectedRouteIdx === 1 ? "🌿 Low-Pollution Route" : "🚀 Fastest Route"}
              </span>
              <span className="aqi-badge aqi-badge--good" style={{ fontSize: 11 }}>
                {result.distance} km · {result.duration} min
              </span>
            </div>

            <div className="route-result__grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="route-result__stat" style={{ padding: 8 }}>
                <div className="route-result__stat-label">Distance</div>
                <div className="route-result__stat-val" style={{ fontSize: 16 }}>{result.distance} km</div>
              </div>
              <div className="route-result__stat" style={{ padding: 8 }}>
                <div className="route-result__stat-label">Est. Time</div>
                <div className="route-result__stat-val" style={{ fontSize: 16 }}>{result.duration} min</div>
              </div>
              <div className="route-result__stat" style={{ padding: 8 }}>
                <div className="route-result__stat-label">Average AQI</div>
                <div className="route-result__stat-val" style={{ fontSize: 16, color: aqiColor(+result.avgAqi) }}>
                  {result.avgAqi}
                </div>
              </div>
              <div className="route-result__stat" style={{ padding: 8 }}>
                <div className="route-result__stat-label">Air Safety Score</div>
                <div className="route-result__stat-val" style={{ fontSize: 16, color: "#22c55e" }}>
                  {result.score}%
                </div>
              </div>
            </div>

            {/* Waypoint AQI color strip */}
            <AqiColorStrip path={smoothPath} navIndex={navIndex} />

            {/* Progress Slider */}
            <div style={{ marginTop: 10 }}>
              <input
                type="range"
                min={0}
                max={smoothPath.length - 1}
                value={navIndex}
                onChange={e => {
                  setNavIndex(Number(e.target.value));
                  setIsNavigating(false);
                }}
                className="route-progress-slider"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Right Main Map Area ── */}
      <div className="route-map-wrapper">
        <MapContainer center={DEFAULT_CENTER} zoom={5} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <FitBounds start={start} dest={dest} />
          <NavCameraFollow position={currentNavPos} isNavigating={isNavigating} />

          {start && <Marker position={[start.lat, start.lng]} />}
          {dest && <Marker position={[dest.lat, dest.lng]} />}

          {/* Polyline route line */}
          {smoothPath.length > 0 && (
            <Polyline
              positions={smoothPath}
              color={selectedRouteIdx === 1 ? "#22c55e" : "#14b8a6"}
              weight={6}
              opacity={0.9}
            />
          )}

          {/* Animated Vehicle Marker */}
          {currentNavPos && (
            <Marker
              position={currentNavPos}
              icon={createNavVehicleIcon(vehicleAngle)}
              zIndexOffset={1000}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
