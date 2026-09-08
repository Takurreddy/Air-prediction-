import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./LandingPage.css";

export default function LandingPage() {
  const { t } = useTranslation();
  const heroVisualRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroVisualRef.current) {
        heroVisualRef.current.style.transform = `translateY(${window.scrollY * 0.05}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="lp">
      {/* ══════════════════ HERO SECTION ══════════════════ */}
      <section className="lp-hero" id="hero">
        <div className="lp-hero__content">
          <span className="lp-eyebrow">
            <span className="lp-eyebrow__dot" /> {t('landing.aiPowered')}
          </span>

          <h1 className="lp-hero__headline">
            {t('landing.predictCleaner')} <br />
            <span className="lp-hero__accent">{t('landing.beforeTravel')}</span>
          </h1>

          <p className="lp-hero__sub">
            {t('landing.heroSub')}
          </p>

          <div className="lp-hero__ctas">
            <NavLink to="/auth" className="lp-btn lp-btn--primary">{t('landing.getStarted')}</NavLink>
            <a href="#product" className="lp-btn lp-btn--ghost">{t('landing.exploreProduct')}</a>
          </div>

          <div className="lp-hero__stats">
            <div className="lp-stat">
              <strong>72hr</strong>
              <span>{t('landing.rollingForecast')}</span>
            </div>
            <div className="lp-stat">
              <strong>±8%</strong>
              <span>{t('landing.lstmError')}</span>
            </div>
            <div className="lp-stat">
              <strong>150m</strong>
              <span>{t('landing.spatialRes')}</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div className="lp-hero__visual" ref={heroVisualRef}>
          <div className="lp-engine-card">
            <div className="lp-engine-card__header">
              <span className="lp-engine-card__status">
                <span className="lp-engine-card__dot" /> {t('landing.engineActive')}
              </span>
              <span className="lp-engine-card__live">{t('landing.livePrediction')}</span>
            </div>

            <div className="lp-engine-card__body">
              <div className="lp-engine-card__meta">
                <span className="lp-engine-card__sub">{t('landing.h24Forecast')}</span>
                <div className="lp-engine-card__aqi">
                  178 <span className="lp-engine-card__trend">{t('landing.better37')}</span>
                </div>
              </div>

              {/* Curve Graph */}
              <div className="lp-engine-graph">
                <svg viewBox="0 0 300 120" fill="none" className="lp-graph-svg">
                  <path
                    d="M 10 90 Q 90 80 150 50 T 290 20"
                    stroke="#3b82f6"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="150" cy="50" r="5" fill="#3b82f6" />
                  <foreignObject x="100" y="55" width="80" height="40">
                    <div className="lp-graph-badge lp-graph-badge--red">
                      AQI 284<br /><small>{t('landing.hyderabad')}</small>
                    </div>
                  </foreignObject>
                  <foreignObject x="220" y="0" width="80" height="40">
                    <div className="lp-graph-badge lp-graph-badge--green">
                      AQI 178<br /><small>{t('landing.bengaluru')}</small>
                    </div>
                  </foreignObject>
                </svg>
              </div>

              <div className="lp-engine-card__footer">
                <div className="lp-safety-badge">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <div>
                    <strong>{t('landing.safeTravel')}</strong>
                    <p>{t('landing.optimalRoute')}</p>
                  </div>
                </div>
                <NavLink to="/route-planner" className="lp-btn lp-btn--sm lp-btn--primary">{t('landing.startRoute')}</NavLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ THE REALITY ══════════════════ */}
      <section className="lp-section lp-reality" id="reality">
        <div className="lp-split-section">
          <div className="lp-split-visual">
            <div className="lp-aura-container">
              <div className="lp-aura-blob" />
              <div className="lp-aura-tag lp-aura-tag--top">
                <span>{t('landing.hazardousZone')}</span>
                <strong>AQI 342</strong>
              </div>
              <div className="lp-aura-tag lp-aura-tag--bottom">
                <span>{t('landing.unhealthy')}</span>
                <strong>AQI 185</strong>
              </div>
            </div>
          </div>

          <div className="lp-split-text">
            <span className="lp-tag-red">⚠️ {t('landing.theReality')}</span>
            <h2>{t('landing.navigatingBlindly')}</h2>
            <p>
              {t('landing.millionsCommute')}
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════ THE SHIFT ══════════════════ */}
      <section className="lp-section lp-shift" id="shift">
        <div className="lp-split-section lp-split-section--reverse">
          <div className="lp-split-text">
            <span className="lp-tag-blue">⏱ {t('landing.theShift')}</span>
            <h2>{t('landing.currentAqiObsolete')}</h2>
            <p>
              {t('landing.knowingRightNow')}
            </p>
          </div>

          <div className="lp-split-visual">
            <div className="lp-forecast-card">
              <div className="lp-forecast-card__header">
                <span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> {t('landing.hourlyForecast')}</span>
                <span className="lp-chip-sm">{t('landing.aiModelV2')}</span>
              </div>
              <div className="lp-forecast-card__chart">
                <div className="lp-hazard-line"><span>{t('landing.hazardThreshold')}</span></div>
                <div className="lp-forecast-marker">
                  <span>AQI</span>
                  <strong>310</strong>
                </div>
              </div>
              <div className="lp-forecast-card__times">
                {["1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm"].map(t => <span key={t}>{t}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ INTELLIGENCE AT A GLANCE ══════════════════ */}
      <section className="lp-section lp-glance" id="product">
        <div className="lp-section__header">
          <h2>{t('landing.intelligenceGlance')}</h2>
          <p>{t('landing.dashboardTransforms')}</p>
        </div>

        <div className="lp-dashboard-frame">
          <div className="lp-dashboard-mockup">
            <div className="lp-mockup-header">
              <div className="lp-mockup-search">{t('landing.searchLocations')}</div>
              <div className="lp-mockup-actions"><span className="lp-mockup-dot" /><span className="lp-mockup-dot" /></div>
            </div>

            <div className="lp-mockup-grid">
              <div className="lp-mockup-nav">
                <div className="lp-mockup-item active">{t('landing.overview')}</div>
                <div className="lp-mockup-item">{t('landing.aqiMap')}</div>
                <div className="lp-mockup-item">{t('landing.routePlanner')}</div>
                <div className="lp-mockup-item">{t('landing.forecast')}</div>
              </div>

              <div className="lp-mockup-main">
                <div className="lp-mockup-card">
                  <div className="lp-card-title">{t('landing.aqiForecast')} <span className="lp-chip-sm">{t('landing.aiPowered')}</span></div>
                  <div className="lp-mockup-curve" />
                </div>
                <div className="lp-mockup-card">
                  <div className="lp-card-title">{t('landing.healthScore')}</div>
                  <div className="lp-mockup-gauge"><strong>82</strong><span>{t('landing.good')}</span></div>
                </div>
              </div>
            </div>

            {/* Labeled pins */}
            <div className="lp-callout-pin lp-callout-pin--forecast">
              <span className="lp-pin-dot" /> {t('landing.aqiForecast')}
            </div>
            <div className="lp-callout-pin lp-callout-pin--health">
              <span className="lp-pin-dot" /> {t('landing.healthScore')}
            </div>
            <div className="lp-callout-pin lp-callout-pin--map">
              <span className="lp-pin-dot" /> {t('landing.liveMap')}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURE SUITE GRID ══════════════════ */}
      <section className="lp-section lp-suite">
        <div className="lp-section__header">
          <p className="lp-suite-subtitle">{t('landing.suiteSubtitle')}</p>
        </div>

        <div className="lp-suite-grid">
          <div className="lp-suite-card lp-suite-card--wide">
            <h3>{t('landing.interactiveMap')}</h3>
            <p>{t('landing.highResHeatmaps')}</p>
            <div className="lp-suite-preview lp-suite-preview--map">
              <div className="lp-preview-pill">AQI 145 · {t('landing.newDelhi')}</div>
            </div>
          </div>

          <div className="lp-suite-card">
            <h3>{t('landing.aiForecast')}</h3>
            <p>{t('landing.tomorrowAqi')}</p>
          </div>

          <div className="lp-suite-card">
            <h3>{t('landing.routePlanner')}</h3>
            <p>{t('landing.hydBlrCleaner')}</p>
          </div>

          <div className="lp-suite-card">
            <h3>{t('landing.moderateActivity')}</h3>
            <p>{t('landing.maskRecommended')}</p>
          </div>

          <div className="lp-suite-card">
            <h3>{t('landing.smartAlerts')}</h3>
            <p>{t('landing.pushActive')}</p>
          </div>

          <div className="lp-suite-card">
            <h3>{t('landing.aqiTrends')}</h3>
            <div className="lp-trend-bars">
              <div style={{ height: "40%" }} /><div style={{ height: "60%" }} /><div style={{ height: "80%" }} /><div style={{ height: "50%" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ WORKFLOW STEPS ══════════════════ */}
      <section className="lp-section lp-workflow">
        <div className="lp-workflow-steps">
          <div className="lp-wf-step">
            <div className="lp-wf-icon">📊</div>
            <strong>{t('landing.dashboard')}</strong>
            <span>{t('landing.unifiedOverview')}</span>
          </div>
          <div className="lp-wf-step">
            <div className="lp-wf-icon">🗺️</div>
            <strong>{t('landing.aqiMap')}</strong>
            <span>{t('landing.cityHeatmaps')}</span>
          </div>
          <div className="lp-wf-step">
            <div className="lp-wf-icon">🛣️</div>
            <strong>{t('landing.routePlanner')}</strong>
            <span>{t('landing.healthierDirections')}</span>
          </div>
          <div className="lp-wf-step">
            <div className="lp-wf-icon">🔔</div>
            <strong>{t('landing.healthAlerts')}</strong>
            <span>{t('landing.personalizedNotifs')}</span>
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA BANNER ══════════════════ */}
      <section className="lp-section lp-cta-banner">
        <div className="lp-cta-card">
          <h2>{t('landing.readyCleaner')}</h2>
          <p>{t('landing.joinToday')}</p>
          <NavLink to="/auth" className="lp-btn lp-btn--white">{t('landing.getStartedFree')}</NavLink>
        </div>
      </section>
    </div>
  );
}

