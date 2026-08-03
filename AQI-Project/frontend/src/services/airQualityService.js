import apiClient from "./apiClient";

export async function fetchAirQualityByCity(city) {
  const response = await apiClient.get("/air-quality", {
    params: { city },
    requiresAuth: true,
  });
  return response.data;
}

export async function fetchStationsByCity(city) {
  const params = city ? { city } : {};
  const response = await apiClient.get("/stations", { params, requiresAuth: true });
  return response.data;
}

export async function fetchAllStations() {
  const response = await apiClient.get("/stations", { requiresAuth: true });
  return response.data;
}

export async function evaluateRoutes(payload) {
  const response = await apiClient.post("/routes", payload, { requiresAuth: true });
  return response.data;
}

export async function predictAirQuality(payload) {
  const response = await apiClient.post("/predict", payload, { requiresAuth: true });
  return response.data;
}

export async function listAlerts() {
  const response = await apiClient.get("/air-quality/alerts", { requiresAuth: true });
  return response.data;
}

export async function createAlert(payload) {
  const response = await apiClient.post("/air-quality/alerts", payload, { requiresAuth: true });
  return response.data;
}

export async function deleteAlert(alertId) {
  await apiClient.delete(`/air-quality/alerts/${alertId}`, { requiresAuth: true });
}
