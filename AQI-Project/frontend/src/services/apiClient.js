import axios from "axios";
import runtimeConfig from "../config/runtimeConfig";

let clerkTokenProvider = null;

export function setClerkTokenProvider(provider) {
  clerkTokenProvider = provider;
}

const apiClient = axios.create({
  baseURL: runtimeConfig.apiBaseUrl,
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const nextConfig = { ...config };

  if (nextConfig.requiresAuth && typeof clerkTokenProvider === "function") {
    const token = await clerkTokenProvider();
    if (token && !nextConfig.headers?.Authorization) {
      nextConfig.headers = {
        ...nextConfig.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  return nextConfig;
});

export default apiClient;
