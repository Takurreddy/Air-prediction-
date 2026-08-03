import React, { useState, useRef } from "react";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  LoadScript,
} from "@react-google-maps/api";
import { evaluateRoutes } from "../services/airQualityService";

const libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "500px",
};

const center = {
  lat: 17.6868,
  lng: 83.2185,
};

function RoutePlanner() {
  const [start, setStart] = useState(null);
  const [destination, setDestination] = useState(null);

  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [score, setScore] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [routeError, setRouteError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startRef = useRef(null);
  const destinationRef = useRef(null);
  const mapRef = useRef(null);

  const onMapLoad = (map) => {
    mapRef.current = map;
  };

  const findRoute = async () => {
    if (!start || !destination) {
      setRouteError("Please select both starting location and destination.");
      return;
    }
    try {
      setIsSubmitting(true);
      setRouteError("");
      const result = await evaluateRoutes({
        origin_lat: start.lat,
        origin_lon: start.lng,
        dest_lat: destination.lat,
        dest_lon: destination.lng,
        alternatives: 3,
        use_predictions: true,
      });

      const recommended = result.alternatives?.[result.recommended_index];
      const distanceKm =
        recommended?.distance_m != null ? (recommended.distance_m / 1000).toFixed(2) : "";
      const durationMin =
        recommended?.duration_s != null ? Math.round(recommended.duration_s / 60).toString() : "";
      const avgAqi = recommended?.avg_aqi != null ? Math.max(0, 100 - recommended.avg_aqi).toFixed(0) : "";

      setDistance(distanceKm);
      setDuration(durationMin);
      setScore(avgAqi);
      setRecommendation(result.recommendation || "Route evaluated.");

      if (mapRef.current) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(start);
        bounds.extend(destination);
        mapRef.current.fitBounds(bounds);
      }
    } catch (error) {
      setRouteError(error?.response?.data?.detail || "Failed to evaluate route.");
      setDistance("");
      setDuration("");
      setScore("");
      setRecommendation("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearRoute = () => {
    setStart(null);
    setDestination(null);
    setDistance("");
    setDuration("");
    setScore("");
    setRecommendation("");
    setRouteError("");
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
    >
      <div className="dashboard">
        <header className="page-header">
          <h1>AI Route Planner</h1>
          <p>Evaluate routes by distance, travel time, and predicted pollution exposure.</p>
        </header>

        <section className="panel">
          <h2>Find Cleaner Route</h2>
          <div className="inline-form-column">

          <Autocomplete
            onLoad={(autocomplete) => (startRef.current = autocomplete)}
            onPlaceChanged={() => {
              const place = startRef.current.getPlace();

              if (!place.geometry) return;

              setStart({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              });
            }}
          >
            <input
              className="route-input"
              type="text"
              placeholder="Starting Location"
            />
          </Autocomplete>

          <Autocomplete
            onLoad={(autocomplete) =>
              (destinationRef.current = autocomplete)
            }
            onPlaceChanged={() => {
              const place = destinationRef.current.getPlace();

              if (!place.geometry) return;

              setDestination({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              });
            }}
          >
            <input
              className="route-input"
              type="text"
              placeholder="Destination"
            />
          </Autocomplete>
          <div className="inline-actions">
            <button className="route-btn" onClick={findRoute} disabled={isSubmitting}>
              {isSubmitting ? "Checking Route..." : "Find Route"}
            </button>
            <button className="route-btn route-btn-secondary" onClick={clearRoute} type="button">
              Clear
            </button>
          </div>
          </div>
        </section>

        {(distance || duration) && (
          <section className="health-tip panel">
            <h2>Route Information</h2>
            <div className="stats-grid">
              <p>
                <strong>Distance</strong>
                <span>{distance} km</span>
              </p>
              <p>
                <strong>Estimated Time</strong>
                <span>{duration} mins</span>
              </p>
              <p>
                <strong>Cleaner Route Score</strong>
                <span>{score || "N/A"}%</span>
              </p>
              <p>
                <strong>Status</strong>
                <span>{recommendation || "Recommended Route"}</span>
              </p>
            </div>
          </section>
        )}
        {routeError ? (
          <p className="status-message status-error">{routeError}</p>
        ) : null}
        <section className="panel map-panel">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={12}
            center={center}
            onLoad={onMapLoad}
          >
            {start && <Marker position={start} />}
            {destination && <Marker position={destination} />}
          </GoogleMap>
        </section>

      </div>
    </LoadScript>
  );
}

export default RoutePlanner;