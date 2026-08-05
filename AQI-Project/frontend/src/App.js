import "./App.css";
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Navbar from "./components/Navbar";
import LandingPage from "./LandingPage";
import Dashboard from "./components/Dashboard";
import RoutePlanner from "./components/RoutePlanner";
import Alerts from "./components/Alerts";
import About from "./components/About";
import Prediction from "./components/Prediction";
import Auth from "./components/Auth";
import Exposure from "./components/Exposure";
import { useAuth } from "./context/AuthContext";

/* demo alert shown at top of every page */
const DEMO_ALERT = "Delhi AQI is 284, above your alert threshold of 170. (Very Unhealthy)";

function GlobalAlertBar({ onClose }) {
  const { t } = useTranslation();
  return (
    <div className="global-alert-bar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span><strong>Delhi</strong> {t('app.demoAlert').replace("Delhi ", "").replace("दिल्ली ", "")}</span>
      <button className="global-alert-bar__close" onClick={onClose}>✕</button>
    </div>
  );
}

/* Works with or without Clerk — redirects to /auth instead of Clerk's component */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="page-wrap"><p style={{ color: "var(--text-muted)", marginTop: 40 }}>Verifying session…</p></div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function LocationPrompt({ onAllow, onClose }) {
  const { t } = useTranslation();
  return (
    <div className="location-prompt">
      <div className="location-prompt__content">
        <div className="location-prompt__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>{t('app.useLive')}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {t('app.shareGps')}
          </div>
        </div>
      </div>
      <div className="location-prompt__actions">
        <button className="ai-btn ai-btn--sm" onClick={onAllow}>{t('app.allowLoc')}</button>
        <button className="location-prompt__close" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}

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

function getNearestCity(lat, lng) {
  let nearest = null;
  let minDist = Infinity;
  for (const c of CITIES) {
    const d = Math.hypot(c.lat - lat, c.lng - lng);
    if (d < minDist) { minDist = d; nearest = c.name; }
  }
  return nearest;
}

function App() {
  const [alertVisible, setAlertVisible] = useState(true);
  const [locationPromptVisible, setLocationPromptVisible] = useState(true);

  const handleAllowLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nearest = getNearestCity(position.coords.latitude, position.coords.longitude);
          console.log("Location fetched:", position.coords, "Nearest:", nearest);
          localStorage.setItem("user_city", nearest);
          setLocationPromptVisible(false);
          alert(`Location found! Your nearest tracked city is ${nearest}.`);
        },
        (error) => {
          console.error("Location error:", error);
          alert("Could not get location. Please check browser permissions.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        {alertVisible && <GlobalAlertBar onClose={() => setAlertVisible(false)} />}
        {locationPromptVisible && <LocationPrompt onAllow={handleAllowLocation} onClose={() => setLocationPromptVisible(false)} />}
        <Routes>
          <Route path="/"              element={<LandingPage />} />
          <Route path="/auth"          element={<Auth />} />
          <Route path="/about"         element={<About />} />
          <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/route-planner" element={<ProtectedRoute><RoutePlanner /></ProtectedRoute>} />
          <Route path="/alerts"        element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/prediction"    element={<ProtectedRoute><Prediction /></ProtectedRoute>} />
          <Route path="/exposure"      element={<ProtectedRoute><Exposure /></ProtectedRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
