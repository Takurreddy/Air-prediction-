import { useCallback, useEffect, useMemo, useState } from "react";
import runtimeConfig from "../config/runtimeConfig";
import {
  fetchAirQualityByCity,
  fetchAllStations,
  fetchStationsByCity,
} from "../services/airQualityService";

function getAqiMeta(aqiValue) {
  if (aqiValue == null) {
    return { label: "Unavailable", tone: "neutral" };
  }
  if (aqiValue <= 50) {
    return { label: "Good", tone: "good" };
  }
  if (aqiValue <= 100) {
    return { label: "Moderate", tone: "moderate" };
  }
  if (aqiValue <= 150) {
    return { label: "Unhealthy for Sensitive Groups", tone: "sensitive" };
  }
  if (aqiValue <= 200) {
    return { label: "Unhealthy", tone: "unhealthy" };
  }
  return { label: "Very Unhealthy", tone: "hazardous" };
}

function Dashboard() {
  const [cityInput, setCityInput] = useState(runtimeConfig.defaultCity);
  const [availableCities, setAvailableCities] = useState([]);
  const [station, setStation] = useState(null);
  const [stationsInCity, setStationsInCity] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const cityOptions = useMemo(
    () => availableCities.filter((city) => city.toLowerCase().includes(cityInput.toLowerCase())),
    [availableCities, cityInput]
  );

  const loadCityAirQuality = useCallback(async (city, stationId = selectedStationId) => {
    try {
      setLoading(true);
      setError("");
      const [stations, readings] = await Promise.all([
        fetchStationsByCity(city),
        fetchAirQualityByCity(city),
      ]);

      setStationsInCity(stations);
      const matchedStation = readings.find((entry) => entry.station_id === stationId);
      const nextStation = matchedStation || readings[0] || null;

      setStation(nextStation);
      setSelectedStationId(nextStation?.station_id || "");
      setLastUpdatedAt(new Date());
    } catch (requestError) {
      setStation(null);
      setStationsInCity([]);
      setSelectedStationId("");
      setError(requestError?.response?.data?.detail || "Failed to load air quality data.");
    } finally {
      setLoading(false);
    }
  }, [selectedStationId]);

  useEffect(() => {
    async function loadAvailableCities() {
      try {
        const stations = await fetchAllStations();
        const uniqueCities = Array.from(
          new Set(stations.map((entry) => entry.city).filter(Boolean))
        ).sort((cityA, cityB) => cityA.localeCompare(cityB));
        setAvailableCities(uniqueCities);
      } catch (requestError) {
        setAvailableCities([]);
        setError(requestError?.response?.data?.detail || "Failed to load city suggestions.");
      }
    }

    loadAvailableCities();
    loadCityAirQuality(runtimeConfig.defaultCity, "");
  }, [loadCityAirQuality]);

  useEffect(() => {
    if (!autoRefresh) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      loadCityAirQuality(cityInput);
    }, 60000);

    return () => window.clearInterval(interval);
  }, [autoRefresh, cityInput, loadCityAirQuality]);

  const aqiValue = station?.aqi;
  const status = station?.category || "Not available";
  const aqiMeta = getAqiMeta(aqiValue);
  const healthTip =
    aqiValue == null
      ? "No AQI data available for this city yet."
      : aqiValue <= 50
      ? "Air quality is good for most outdoor activities."
      : aqiValue <= 100
      ? "Sensitive individuals should limit prolonged outdoor exertion."
      : aqiValue <= 150
      ? "Reduce prolonged outdoor activities and consider a mask."
      : "Avoid outdoor exercise when possible and stay protected.";

  return (
    <div className="dashboard dashboard-page">
      <header className="page-header">
        <h1>Air Quality Dashboard</h1>
        <p>Real-time city AQI monitoring with station-level health guidance.</p>
      </header>

      <section className="panel glass-panel">
        <h2>City & Station Selection</h2>
        <div className="inline-form">
          <input
            className="route-input"
            type="text"
            value={cityInput}
            onChange={(event) => setCityInput(event.target.value)}
            list="city-options"
            placeholder="Enter or select a city"
          />
          <datalist id="city-options">
            {cityOptions.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
          <button className="route-btn" onClick={() => loadCityAirQuality(cityInput, "")}>
            Load City Data
          </button>
        </div>

        <div className="inline-form">
          <select
            className="route-input"
            value={selectedStationId}
            onChange={(event) => {
              const stationId = event.target.value;
              setSelectedStationId(stationId);
              const matchingStation = stationsInCity.find((entry) => entry.station_id === stationId);
              if (matchingStation) {
                setStation((current) => ({
                  ...current,
                  station_id: matchingStation.station_id,
                  city: matchingStation.city,
                  latitude: matchingStation.latitude,
                  longitude: matchingStation.longitude,
                }));
                loadCityAirQuality(cityInput, stationId);
              }
            }}
          >
            <option value="">Select Station</option>
            {stationsInCity.map((entry) => (
              <option key={entry.station_id} value={entry.station_id}>
                {entry.station_id}
              </option>
            ))}
          </select>

          <label className="refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(event) => setAutoRefresh(event.target.checked)}
            />
            Auto refresh every 60s
          </label>
        </div>

        <p className="last-updated">
          Last updated: {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString() : "Not yet loaded"}
        </p>
      </section>

      <section className={`aqi-card aqi-tone-${aqiMeta.tone}`}>
        <div>
          <h2>Current AQI</h2>
          <p className="aqi-status">{aqiMeta.label}</p>
        </div>

        {loading ? (
          <p>Loading AQI...</p>
        ) : station ? (
          <div className="aqi-value-group">
            <h1>{aqiValue ?? "N/A"}</h1>
            <p>{status}</p>
          </div>
        ) : (
          <p>{error || "No AQI data available."}</p>
        )}
      </section>

      <section className="panel glass-panel">
        <h2>Station Details</h2>

        {station ? (
          <div className="stats-grid">
            <p>
              <strong>Station ID</strong>
              <span>{station.station_id}</span>
            </p>
            <p>
              <strong>City</strong>
              <span>{station.city}</span>
            </p>
            <p>
              <strong>Latitude</strong>
              <span>{station.latitude}</span>
            </p>
            <p>
              <strong>Longitude</strong>
              <span>{station.longitude}</span>
            </p>
            <p>
              <strong>PM2.5</strong>
              <span>{station.pm25 ?? "N/A"}</span>
            </p>
            <p>
              <strong>PM10</strong>
              <span>{station.pm10 ?? "N/A"}</span>
            </p>
            <p>
              <strong>NO2</strong>
              <span>{station.no2 ?? "N/A"}</span>
            </p>
            <p>
              <strong>Temperature</strong>
              <span>{station.temperature ?? "N/A"}</span>
            </p>
            <p>
              <strong>Humidity</strong>
              <span>{station.humidity ?? "N/A"}</span>
            </p>
          </div>
        ) : (
          <p>{loading ? "Loading station details..." : "No station details available."}</p>
        )}
      </section>

      <section className="health-tip panel glass-panel">
        <h2>Health Recommendation</h2>
        <p>{healthTip}</p>
      </section>
      {error && !station ? <p className="status-message status-error">{error}</p> : null}
    </div>
  );
}

export default Dashboard;
