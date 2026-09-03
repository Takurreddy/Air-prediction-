import "./App.css";
import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Navbar from "./components/Navbar";
import { useAuth } from "./context/AuthContext";

/* ── Lazy-loaded pages with code-splitting ── */
const LandingPage  = lazy(() => import("./LandingPage"));
const Dashboard    = lazy(() => import("./components/Dashboard"));
const RoutePlanner = lazy(() => import("./components/RoutePlanner"));
const Alerts       = lazy(() => import("./components/Alerts"));
const About        = lazy(() => import("./components/About"));
const Prediction   = lazy(() => import("./components/Prediction"));
const Auth         = lazy(() => import("./components/Auth"));
const Exposure     = lazy(() => import("./components/Exposure"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));

/* ── Spinner fallback for lazy-loaded routes ── */
function PageSpinner() {
  const { t } = useTranslation();
  return (
    <div className="page-spinner">
      <div className="page-spinner__ring" />
      <p>{t('app.loading', 'Loading…')}</p>
    </div>
  );
}

function ClickFeedback() {
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    let nextId = 0;
    const handlePointerDown = (event) => {
      const id = nextId++;
      setRipples((current) => [...current.slice(-5), {
        id,
        x: event.clientX,
        y: event.clientY,
      }]);
      window.setTimeout(() => {
        setRipples((current) => current.filter((ripple) => ripple.id !== id));
      }, 650);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div className="click-feedback" aria-hidden="true">
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="click-feedback__ripple"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
    </div>
  );
}

function GlobalAlertBar({ onClose }) {
  const { t } = useTranslation();
  return (
    <div className="global-alert-bar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span><strong>Delhi</strong> {t('app.demoAlert').replace("Delhi ", "").replace("दिल्ली ", "")}</span>
      <button className="global-alert-bar__close" onClick={onClose}>✕</button>
    </div>
  );
}

/* ── Offline detection banner ── */
function OfflineBanner() {
  const { t } = useTranslation();
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
      <span>{t('app.offline', "You're offline. Some features may be unavailable.")}</span>
    </div>
  );
}

/* Works with or without Clerk — redirects to /auth instead of Clerk's component */
function ProtectedRoute({ children }) {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="page-wrap"><p style={{ color: "var(--text-muted)", marginTop: 40 }}>{t('app.verifying', 'Verifying session…')}</p></div>;
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

function App() {
  const [alertVisible, setAlertVisible] = useState(true);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <ClickFeedback />
        <Navbar />
        <OfflineBanner />
        {alertVisible && <GlobalAlertBar onClose={() => setAlertVisible(false)} />}
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/"              element={<LandingPage />} />
            <Route path="/auth"          element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
            <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
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
