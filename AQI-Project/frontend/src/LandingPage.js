import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import "./LandingPage.css";

/* ─── Mini sparkline bars used inside the hero AQI card ─── */
function SparkBar({ height, active }) {
  return (
    <div
      className={`spark-bar${active ? " spark-bar--active" : ""}`}
      style={{ height: `${height}%` }}
    />
  );
}

/* ─── Alert pill used in the features section ─── */
function AlertPill({ icon, color, title, body, time }) {
  return (
    <div className={`alert-pill alert-pill--${color}`}>
      <span className="alert-pill__icon">{icon}</span>
      <div className="alert-pill__text">
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
      <span className="alert-pill__time">{time}</span>
    </div>
  );
}

/* ─── Architecture step ─── */
function ArchStep({ tag, label, desc, arrow }) {
  return (
    <div className="arch-step-wrap">
      <div className="arch-step">
        <span className="arch-step__tag">{tag}</span>
        <strong className="arch-step__label">{label}</strong>
        <p className="arch-step__desc">{desc}</p>
      </div>
      {arrow && <span className="arch-arrow">→</span>}
    </div>
  );
}

export default function LandingPage() {
  /* subtle parallax on hero visual */
  const heroVisualRef = useRef(null);
  useEffect(() => {
    const handleScroll = () => {
      if (heroVisualRef.current) {
        heroVisualRef.current.style.transform = `translateY(${window.scrollY * 0.06}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="lp">

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="lp-hero" id="hero">
        <div className="lp-hero__content">
          <span className="lp-eyebrow">
            <span className="lp-eyebrow__dot" /> Forecast model updated 4 min ago
          </span>

          <h1 className="lp-hero__headline">
            Know the air<br />
            <span className="lp-hero__accent">before you breathe it.</span>
          </h1>

          <p className="lp-hero__sub">
            AirAware fuses sensor networks, weather data and machine learning to
            forecast pollution block-by-block — then reroutes you around it and
            warns you before exposure, not after.
          </p>

          <div className="lp-hero__ctas">
            <NavLink to="/auth" className="lp-btn lp-btn--primary">Request a demo →</NavLink>
            <a href="#how-it-works" className="lp-btn lp-btn--ghost">See how it works</a>
          </div>

          <div className="lp-hero__stats">
            <div className="lp-stat">
              <strong>72hr</strong>
              <span>forecast horizon</span>
            </div>
            <div className="lp-stat">
              <strong>±8%</strong>
              <span>PM2.5 model error</span>
            </div>
            <div className="lp-stat">
              <strong>150m</strong>
              <span>grid resolution</span>
            </div>
          </div>
        </div>

        {/* floating AQI card */}
        <div className="lp-hero__visual" ref={heroVisualRef}>
          <div className="lp-aqi-card">
            <div className="lp-aqi-card__header">
              <span className="lp-aqi-card__location">Sector 12 — MG Road corridor</span>
              <span className="lp-aqi-badge lp-aqi-badge--moderate">MODERATE</span>
            </div>

            <div className="lp-aqi-card__value-row">
              <span className="lp-aqi-card__number">96</span>
              <span className="lp-aqi-card__label">US AQI · rising ↑</span>
            </div>

            <div className="lp-sparkline">
              {[30, 42, 38, 55, 60, 72, 68, 80, 74, 82, 96, 90].map((h, i) => (
                <SparkBar key={i} height={h} active={i === 10} />
              ))}
            </div>

            <div className="lp-spark-times">
              {["6AM", "9AM", "12PM", "3PM", "6PM", "9PM"].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>

            <div className="lp-route-compare">
              <div className="lp-route-item lp-route-item--bad">
                <span className="lp-route-dot lp-route-dot--red" />
                Direct route — AQI 142 avg exposure
              </div>
              <div className="lp-route-item lp-route-item--good">
                <span className="lp-route-dot lp-route-dot--green" />
                AirAware route — AQI 61 avg, +6 min
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section className="lp-section lp-how" id="how-it-works">
        <div className="lp-section__header">
          <h2>Sense → Predict → Protect</h2>
          <p>Three stages, running continuously</p>
          <span className="lp-section__sub">
            Each stage feeds the next in a live loop — the model never stops
            learning from what actually happened versus what it forecast.
          </span>
        </div>

        <div className="lp-how__steps">
          <div className="lp-how__step">
            <div className="lp-how__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
            </div>
            <span className="lp-how__num">01 / Sense</span>
            <h3>Ingest ground truth</h3>
            <p>
              Low-cost sensor grids, government monitoring stations, satellite AOD
              readings and live traffic density are pulled in every few minutes and
              cross-calibrated against each other.
            </p>
          </div>

          <div className="lp-how__step">
            <div className="lp-how__icon lp-how__icon--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l18 18M9 9a3 3 0 105.12 2.12"/><path d="M17.94 17.94A8 8 0 014.06 4.06"/></svg>
            </div>
            <span className="lp-how__num">02 / Predict</span>
            <h3>Forecast the next 72 hours</h3>
            <p>
              A spatiotemporal model — trained on meteorology, emissions and
              historical pollution drift — projects PM2.5, PM10, NO₂ and ozone at
              150m resolution across the city.
            </p>
          </div>

          <div className="lp-how__step">
            <div className="lp-how__icon lp-how__icon--purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span className="lp-how__num">03 / Protect</span>
            <h3>Alert and reroute</h3>
            <p>
              Alerts are scored against each user's own sensitivity profile, and
              the routing engine scores every path option by cumulative exposure,
              not just distance or time.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section className="lp-section lp-features" id="features">

        {/* alerts block */}
        <div className="lp-feature-row">
          <div className="lp-feature-row__text">
            <h2>Alerts tuned to your body, not the city average</h2>
            <p>
              A citywide AQI number means little if you have asthma, are pregnant,
              or run outdoors at 6am. AirAware weighs forecasts against a personal
              sensitivity profile before it ever pings you.
            </p>
            <ul className="lp-feature-list">
              <li>Threshold tuned per condition — asthma, COPD, cardiovascular, pregnancy, general</li>
              <li>Pollutant-specific triggers, not just a single blended index</li>
              <li>Quiet hours and activity-aware timing, so alerts land before exposure, not during sleep</li>
            </ul>
          </div>

          <div className="lp-feature-row__visual">
            <AlertPill
              icon="🟠"
              color="orange"
              title="Ozone rising near your evening run route"
              body="O₃ forecast to hit 118 AQI by 5:30pm along your usual loop. Suggested window: before 3pm."
              time="2 MIN AGO"
            />
            <AlertPill
              icon="🔴"
              color="red"
              title="PM2.5 spike expected — asthma profile"
              body="Construction-linked dust event forecast for your commute corridor, 8–10am tomorrow."
              time="14 MIN AGO"
            />
          </div>
        </div>

        {/* routing block */}
        <div className="lp-feature-row lp-feature-row--reverse">
          <div className="lp-feature-row__text">
            <h2>Routes optimized for what you breathe, not just how fast you get there</h2>
            <p>
              The routing engine treats pollution exposure as a real cost function
              alongside time and distance — so you can choose the trade-off that
              fits you.
            </p>
            <ul className="lp-feature-list">
              <li>Every candidate route scored on cumulative pollutant exposure, door to door</li>
              <li>Walking, cycling and driving modes weighted differently — exposure per minute varies by mode</li>
              <li>Live re-routing when a forecast shifts mid-trip</li>
            </ul>
          </div>

          <div className="lp-feature-row__visual">
            <div className="lp-map-mock">
              <div className="lp-map-mock__grid">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className={`lp-map-mock__cell lp-map-mock__cell--${i % 7 === 0 ? "hot" : i % 5 === 0 ? "warm" : "cool"}`} />
                ))}
              </div>
              <svg className="lp-map-mock__route lp-map-mock__route--red" viewBox="0 0 200 140" fill="none">
                <path d="M10 70 Q60 20 100 60 Q140 100 190 50" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5 3"/>
              </svg>
              <svg className="lp-map-mock__route lp-map-mock__route--green" viewBox="0 0 200 140" fill="none">
                <path d="M10 70 Q40 110 80 100 Q130 88 190 50" stroke="#22c55e" strokeWidth="2.5"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ STATS BAR ══════════════════ */}
      <div className="lp-stats-bar">
        <div className="lp-stats-bar__inner">
          {[
            { value: "1.2M+", label: "sensor readings processed daily" },
            { value: "150m", label: "forecast grid resolution" },
            { value: "72hr", label: "rolling prediction horizon" },
            { value: "±8%", label: "mean absolute error, PM2.5" },
          ].map((s) => (
            <div key={s.label} className="lp-stats-bar__item">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════ ARCHITECTURE ══════════════════ */}
      <section className="lp-section lp-arch" id="architecture">
        <div className="lp-section__header">
          <h2>Under the hood</h2>
          <p>A pipeline built for a moving target</p>
          <span className="lp-section__sub">
            Air quality doesn't sit still — the system is built as a continuous
            loop, not a one-off report.
          </span>
        </div>

        <div className="lp-arch__pipeline">
          <ArchStep tag="INPUT"   label="Sensor & satellite feed"   desc="Ground stations, low-cost IoT nodes, AOD satellite data, weather & traffic APIs." arrow />
          <ArchStep tag="PROCESS" label="Calibration layer"         desc="Cross-sensor bias correction and spatial interpolation across the city grid." arrow />
          <ArchStep tag="MODEL"   label="Spatiotemporal forecaster" desc="Learns pollutant drift from meteorology, emissions and historical patterns." arrow />
          <ArchStep tag="SCORE"   label="Exposure engine"           desc="Converts forecasts into per-user risk scores and route exposure costs." arrow />
          <ArchStep tag="OUTPUT"  label="Alerts & routing"          desc="Personalized push alerts and pollution-aware navigation, in real time." arrow={false} />
        </div>
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section className="lp-cta" id="get-started">
        <h2>Get started</h2>
        <p className="lp-cta__lead">Give people a reason to trust the air again.</p>
        <p className="lp-cta__sub">
          Bring AirAware's forecasting and routing engine to your city, campus or app.
        </p>
        <div className="lp-cta__actions">
          <NavLink to="/auth" className="lp-btn lp-btn--primary">Request a demo →</NavLink>
          <a href="#architecture" className="lp-btn lp-btn--ghost">Read the technical brief</a>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <div className="lp-footer__brand">
            <span className="lp-footer__logo">AirAware</span>
          </div>

          <div className="lp-footer__cols">
            <div className="lp-footer__col">
              <strong>PRODUCT</strong>
              <a href="#how-it-works">How it works</a>
              <a href="#features">Features</a>
              <a href="#architecture">Architecture</a>
            </div>
            <div className="lp-footer__col">
              <strong>PROJECT</strong>
              <a href="#architecture">Technical brief</a>
              <a href="#how-it-works">Dataset &amp; methodology</a>
              <NavLink to="/about">Team</NavLink>
            </div>
            <div className="lp-footer__col">
              <strong>CONTACT</strong>
              <NavLink to="/auth">Request a demo</NavLink>
              <a href="mailto:hello@airaware.io">Email us</a>
            </div>
          </div>
        </div>

        <div className="lp-footer__bottom">
          <span>© 2026 AirAware. An AI-based air quality prediction &amp; route optimization project.</span>
          <span>Built for cleaner commutes.</span>
        </div>
      </footer>

    </div>
  );
}
