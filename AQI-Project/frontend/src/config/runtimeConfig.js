const clerkPublishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || "";

const runtimeConfig = {
  apiBaseUrl: process.env.REACT_APP_API_URL || "https://air-prediction-production.up.railway.app",
  defaultCity: process.env.REACT_APP_DEFAULT_CITY || "Delhi",
  uiTemplate: process.env.REACT_APP_UI_TEMPLATE || "default",
  clerkPublishableKey,
  clerkJwtTemplate: process.env.REACT_APP_CLERK_JWT_TEMPLATE || "",
};

export default runtimeConfig;
