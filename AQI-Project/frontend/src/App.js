import "./App.css";
import { useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Navbar from "./components/Navbar";
import { useAuth } from "./context/AuthContext";
import { getNearestCity } from "./config/cities";

/* ── Lazy-loaded pages with code-splitting ── */
const LandingPage  = lazy(() => import("./LandingPage"));
const Dashboard    = lazy(() => import("./components/Dashboard"));
const RoutePlanner = lazy(() => import("./components/RoutePlanner"));
const Alerts       = lazy(() => import("./components/Alerts"));
const About        = lazy(() => import("./components/About"));
const Prediction   = lazy(() => import("./components/Prediction"));
const Auth         = lazy(() => import("./components/Auth"));
const Exposure     = lazy(() => import("./components/Exposure"));

/* ── Spinner fallback for lazy-loaded routes ── */
function PageSpinner() {
  return (
    <div className="page-spinner">
      <div className="page-spinner__ring" />
      <p>Loading…</p>
    </div>
  );
}

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

/* ── Offline detection banner ── */
function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useState(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  });

  if (!isOffline) return null;
  return (
    <div className="offline-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
        <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>
      <span>You're offline. Some features may be unavailable.</span>
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

/* Redirect already-authenticated users away from /auth */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
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
        <OfflineBanner />
        {alertVisible && <GlobalAlertBar onClose={() => setAlertVisible(false)} />}
        {locationPromptVisible && <LocationPrompt onAllow={handleAllowLocation} onClose={() => setLocationPromptVisible(false)} />}
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/"              element={<LandingPage />} />
            <Route path="/auth"          element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
            <Route path="/about"         element={<About />} />
            <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/route-planner" element={<ProtectedRoute><RoutePlanner /></ProtectedRoute>} />
            <Route path="/alerts"        element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/prediction"    element={<ProtectedRoute><Prediction /></ProtectedRoute>} />
            <Route path="/exposure"      element={<ProtectedRoute><Exposure /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
