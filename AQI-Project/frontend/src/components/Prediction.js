import { useEffect, useState } from "react";
import runtimeConfig from "../config/runtimeConfig";
import {
  fetchAirQualityByCity,
  fetchAllStations,
  fetchStationsByCity,
  predictAirQuality,
} from "../services/airQualityService";

function getPredictionTone(aqi) {
  if (aqi == null) {
    return "neutral";
  }
  if (aqi <= 50) {
    return "good";
  }
  if (aqi <= 100) {
    return "moderate";
  }
  if (aqi <= 150) {
    return "sensitive";
  }
  if (aqi <= 200) {
    return "unhealthy";
  }
  return "hazardous";
}

function Prediction() {
  const [city, setCity] = useState(runtimeConfig.defaultCity);
  const [availableCities, setAvailableCities] = useState([]);
  const [cityStations, setCityStations] = useState([]);
  const [station, setStation] = useState(null);
  const [selectedStationId, setSelectedStationId] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function bootstrapPredictionPage() {
      try {
        setError("");
        const [allStations, stationResult] = await Promise.all([
          fetchAllStations(),
          fetchStationsByCity(runtimeConfig.defaultCity),
        ]);
        const uniqueCities = Array.from(
          new Set(allStations.map((entry) => entry.city).filter(Boolean))
        ).sort((cityA, cityB) => cityA.localeCompare(cityB));
        setAvailableCities(uniqueCities);
        setCityStations(stationResult);
        if (stationResult.length > 0) {
          setStation(stationResult[0]);
          setSelectedStationId(stationResult[0].station_id);
        }
      } catch (stationError) {
        setError(stationError?.response?.data?.detail || "Failed to load stations.");
      }
    }

    bootstrapPredictionPage();
  }, []);

  function buildSequence(latest) {
    const now = new Date();
    const pm25 = latest?.pm25 ?? 50;
    const pm10 = latest?.pm10 ?? 90;
    const no2 = latest?.no2 ?? 30;
    const temperature = latest?.temperature ?? 28;
    const humidity = latest?.humidity ?? 60;

    return Array.from({ length: 24 }, (_, index) => {
      const stepDate = new Date(now.getTime() - (23 - index) * 60 * 60 * 1000);
      return {
        pm25,
        pm10,
        no: Math.max(5, no2 / 4),
        no2,
        nox: no2 * 1.4,
        nh3: 15,
        so2: 12,
        rh: humidity,
        wd: 180,
        at: temperature,
        ws: 2.5,
        wd2: 180,
        hour: stepDate.getHours(),
        day_of_week: stepDate.getDay(),
        month: stepDate.getMonth() + 1,
      };
    });
  }

  async function loadStationForCity() {
    try {
      setError("");
      const stationResult = await fetchStationsByCity(city);
      setCityStations(stationResult);
      if (stationResult.length === 0) {
        setStation(null);
        setSelectedStationId("");
        setError("No stations found for this city.");
        return;
      }
      setStation(stationResult[0]);
      setSelectedStationId(stationResult[0].station_id);
    } catch (stationError) {
      setStation(null);
      setCityStations([]);
      setSelectedStationId("");
      setError(stationError?.response?.data?.detail || "Failed to load stations.");
    }
  }

  async function predictAQI() {
    if (!station) {
      setError("Please load a city with at least one station first.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const cityReadings = await fetchAirQualityByCity(city);
      const stationReading =
        cityReadings.find((entry) => entry.station_id === station.station_id) || cityReadings[0];

      const predictionPayload = {
        station_id: station.station_id,
        latitude: station.latitude,
        longitude: station.longitude,
        sequence: buildSequence(stationReading),
      };

      const result = await predictAirQuality(predictionPayload);
      setPrediction({
        aqi: result.predicted_aqi,
        status: result.category,
        pm25: result.pm25,
        pm10: result.pm10,
        no2: result.no2,
        so2: result.so2,
      });
    } catch (predictError) {
      setPrediction(null);
      setError(predictError?.response?.data?.detail || "Prediction request failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dashboard dashboard-page">
      <header className="page-header">
        <h1>AI AQI Prediction</h1>
        <p>Generate model-backed AQI forecasts from the selected city station data.</p>
      </header>

      <section className="panel">
        <h2>Prediction Inputs</h2>
        <div className="inline-form-column">
          <input
            className="route-input"
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            list="prediction-city-options"
            placeholder="Enter city name"
          />
          <datalist id="prediction-city-options">
            {availableCities.map((entry) => (
              <option key={entry} value={entry} />
            ))}
          </datalist>
          <select
            className="route-input"
            value={selectedStationId}
            onChange={(event) => {
              const stationId = event.target.value;
              setSelectedStationId(stationId);
              const selected = cityStations.find((entry) => entry.station_id === stationId) || null;
              setStation(selected);
            }}
          >
            <option value="">Select Station</option>
            {cityStations.map((entry) => (
              <option key={entry.station_id} value={entry.station_id}>
                {entry.station_id}
              </option>
            ))}
          </select>
          <button className="route-btn" onClick={loadStationForCity} type="button">
            Load Station
          </button>
        </div>
        <p>
          <strong>Selected Station:</strong> {station?.station_id || "None"}
        </p>
      </section>

      <button className="route-btn" onClick={predictAQI} disabled={isSubmitting}>
        {isSubmitting ? "Predicting..." : "Predict Air Quality"}
      </button>

      {error ? <p className="status-message status-error">{error}</p> : null}

      {prediction && (
        <div className={`aqi-card aqi-tone-${getPredictionTone(prediction.aqi)}`}>
          <h2>Predicted AQI</h2>
          <div className="aqi-value-group">
            <h1>{Math.round(prediction.aqi)}</h1>
            <p>{prediction.status}</p>
          </div>
          <div className="stats-grid">
            <p>
              <strong>PM2.5</strong>
              <span>{prediction.pm25.toFixed(2)}</span>
            </p>
            <p>
              <strong>PM10</strong>
              <span>{prediction.pm10.toFixed(2)}</span>
            </p>
            <p>
              <strong>NO2</strong>
              <span>{prediction.no2.toFixed(2)}</span>
            </p>
            <p>
              <strong>SO2</strong>
              <span>{prediction.so2.toFixed(2)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Prediction;