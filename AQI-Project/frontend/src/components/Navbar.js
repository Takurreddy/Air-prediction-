import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

/* ── icons (inline SVG to avoid extra deps) ── */
const WindIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
  </svg>
);
const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

function pad(n) { return String(n).padStart(2, "0"); }

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [theme, setTheme] = useState(document.documentElement.getAttribute("data-theme") || "dark");
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  const currentLangLabel = i18n.language === 'hi' ? 'हिंदी' : 'English';

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const tabs = [
    { to: "/dashboard",     label: "Air\nQuality" },
    { to: "/prediction",    label: "Forecast" },
    { to: "/route-planner", label: "Route\nPlanner" },
    { to: "/alerts",        label: "My\nExposure",    altTo: "/alerts" },
    { to: "/alerts",        label: "Profile &\nAlerts" },
  ];

  return (
    <nav className="app-nav">
      {/* ── Tab links ── */}
      <ul className="nav-tabs">
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
            <span style={{ whiteSpace: 'pre-line' }}>{t('nav.airQuality')}</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/prediction" className={({ isActive }) => isActive ? "active" : ""}>
            <span style={{ whiteSpace: 'pre-line' }}>{t('nav.forecast')}</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/route-planner" className={({ isActive }) => isActive ? "active" : ""}>
            <span style={{ whiteSpace: 'pre-line' }}>{t('nav.routePlanner')}</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/exposure" className={({ isActive }) => isActive ? "active" : ""}>
            <span style={{ whiteSpace: 'pre-line' }}>{t('nav.myExposure')}</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/alerts" className={({ isActive }) => isActive ? "active" : ""}>
            <span style={{ whiteSpace: 'pre-line' }}>{t('nav.profileAlerts')}</span>
          </NavLink>
        </li>
      </ul>

      {/* ── Brand ── */}
      <NavLink to="/" className="nav-brand">
        <span className="nav-brand__icon"><WindIcon /></span>
        <span>
          <div className="nav-brand__name">{t('nav.brandName')}</div>
          <div className="nav-brand__sub">{t('nav.brandSub')}</div>
        </span>
      </NavLink>

      {/* ── Right controls ── */}
      <div className="nav-right">
        <button className="nav-theme-btn" type="button" onClick={() => {
          const isLight = document.documentElement.getAttribute('data-theme') === 'light';
          document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
          setTheme(isLight ? 'dark' : 'light');
        }}>
          {theme === 'light' ? '☀️' : <MoonIcon />} {theme === 'light' ? t('nav.light') : t('nav.dark')} <span style={{ color: "var(--text-muted)" }}>▾</span>
        </button>

        <button className="nav-lang-btn" type="button" onClick={toggleLanguage}>
          {currentLangLabel} <span style={{ color: "var(--text-muted)" }}>▾</span>
        </button>

        <div className="nav-live">
          <span className="nav-live__dot" />
          <span>
            {t('nav.live')} {dateStr}<br />{timeStr}
          </span>
        </div>

        {isAuthenticated ? (
          <button className="nav-guest" type="button" onClick={logout}>
            <span className="nav-guest__icon"><UserIcon /></span>
            {t('nav.signOut')}
          </button>
        ) : (
          <button className="nav-guest" type="button" onClick={() => navigate("/auth")}>
            <span className="nav-guest__icon"><UserIcon /></span>
            {t('nav.guestExplorer')}
            <span style={{ marginLeft: 4, color: "var(--purple-lt)" }}>↗</span>
          </button>
        )}
      </div>
    </nav>
  );
}
