import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createAlert, deleteAlert, listAlerts } from "../services/airQualityService";

function Alerts() {
  const { isAuthenticated } = useAuth();
  const [stationId, setStationId] = useState("");
  const [thresholdAqi, setThresholdAqi] = useState(100);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");

  async function loadAlerts() {
    try {
      const data = await listAlerts();
      setAlerts(data);
      setError("");
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || "Failed to load alerts.");
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadAlerts();
    }
  }, [isAuthenticated]);

  async function handleCreateAlert(event) {
    event.preventDefault();
    try {
      await createAlert({
        station_id: stationId,
        threshold_aqi: Number(thresholdAqi),
        notify_email: true,
        notify_push: false,
      });
      setStationId("");
      await loadAlerts();
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || "Failed to create alert.");
    }
  }

  async function handleDeleteAlert(alertId) {
    try {
      await deleteAlert(alertId);
      await loadAlerts();
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || "Failed to delete alert.");
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="dashboard dashboard-page">
        <header className="page-header">
          <h1>Alerts</h1>
          <p>Please sign in to manage personalized AQI notifications.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="dashboard dashboard-page">
      <header className="page-header">
        <h1>Alerts</h1>
        <p>Set threshold-based warnings for specific monitoring stations.</p>
      </header>

      <section className="panel">
        <h2>Create Alert</h2>
        <form onSubmit={handleCreateAlert}>
          <input
            className="route-input"
            type="text"
            placeholder="Station ID (e.g., delhi-anand-vihar)"
            value={stationId}
            onChange={(event) => setStationId(event.target.value)}
            required
          />
          <input
            className="route-input"
            type="number"
            min="1"
            max="500"
            value={thresholdAqi}
            onChange={(event) => setThresholdAqi(event.target.value)}
            required
          />
          <button className="route-btn" type="submit">
            Save Alert
          </button>
        </form>
      </section>
      {error ? <p className="status-message status-error">{error}</p> : null}
      <section className="health-tip panel">
        <h2>My Alerts</h2>
        {alerts.length === 0 ? (
          <p>No active alerts yet.</p>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="alert-item">
              <div>
                <strong>{alert.station_id}</strong>
                <p>AQI threshold {alert.threshold_aqi}</p>
              </div>
              <button
                className="route-btn"
                type="button"
                onClick={() => handleDeleteAlert(alert.id)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default Alerts;