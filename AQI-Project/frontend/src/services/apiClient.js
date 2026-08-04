/**
 * apiClient — Axios instance pre-configured for the FastAPI backend.
 *
 * Authentication:
 *   - Reads the JWT from localStorage (key: "aq_access_token")
 *   - Attaches it as "Authorization: Bearer <token>" on every request
 *     that has `requiresAuth: true` in its config
 */
import axios from "axios";
import runtimeConfig from "../config/runtimeConfig";

const TOKEN_KEY = "aq_access_token";

const apiClient = axios.create({
  baseURL: runtimeConfig.apiBaseUrl,
  timeout: 15000,
});

/* ── Request interceptor — attach JWT when present ── */
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token && !config.headers?.Authorization) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

/* ── Response interceptor — handle 401 globally ── */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      /* Token expired or invalid — clear it and let the app redirect */
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("aq_user");
    }
    return Promise.reject(error);
  }
);

export default apiClient;

/* Legacy export kept so existing callers don't break */
export function setClerkTokenProvider() {}
