import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
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
            <span className="lp-eyebrow__dot" /> AI-POWERED AIR QUALITY INTELLIGENCE
          </span>

          <h1 className="lp-hero__headline">
            Predict Cleaner Journeys <br />
            <span className="lp-hero__accent">Before You Travel</span>
          </h1>

          <p className="lp-hero__sub">
            Know tomorrow's air quality today. AirAware combines AI, environmental intelligence, and route optimization to help you make healthier travel decisions.
          </p>

          <div className="lp-hero__ctas">
            <NavLink to="/auth" className="lp-btn lp-btn--primary">Get Started</NavLink>
            <a href="#product" className="lp-btn lp-btn--ghost">Explore Product</a>
          </div>

          <div className="lp-hero__stats">
            <div className="lp-stat">
              <strong>72hr</strong>
              <span>Rolling AI Forecast</span>
            </div>
            <div className="lp-stat">
              <strong>±8%</strong>
              <span>LSTM Error Margin</span>
            </div>
            <div className="lp-stat">
              <strong>150m</strong>
              <span>Spatial Resolution</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div className="lp-hero__visual" ref={heroVisualRef}>
          <div className="lp-engine-card">
            <div className="lp-engine-card__header">
              <span className="lp-engine-card__status">
                <span className="lp-engine-card__dot" /> AirAware Engine Active
              </span>
              <span className="lp-engine-card__live">Live Prediction</span>
            </div>

            <div className="lp-engine-card__body">
              <div className="lp-engine-card__meta">
                <span className="lp-engine-card__sub">24h Forecast</span>
                <div className="lp-engine-card__aqi">
                  178 <span className="lp-engine-card__trend">+37% Better</span>
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
                      AQI 284<br /><small>Hyderabad</small>
                    </div>
                  </foreignObject>
                  <foreignObject x="220" y="0" width="80" height="40">
                    <div className="lp-graph-badge lp-graph-badge--green">
                      AQI 178<br /><small>Bengaluru</small>
                    </div>
                  </foreignObject>
                </svg>
              </div>

              <div className="lp-engine-card__footer">
                <div className="lp-safety-badge">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <div>
                    <strong>Safe to Travel</strong>
                    <p>Optimal route selected: 18% less exposure.</p>
                  </div>
                </div>
                <NavLink to="/route-planner" className="lp-btn lp-btn--sm lp-btn--primary">Start Route</NavLink>
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
                <span>HAZARDOUS ZONE</span>
                <strong>AQI 342</strong>
              </div>
              <div className="lp-aura-tag lp-aura-tag--bottom">
                <span>UNHEALTHY</span>
                <strong>AQI 185</strong>
              </div>
            </div>
          </div>

          <div className="lp-split-text">
            <span className="lp-tag-red">⚠️ THE REALITY</span>
            <h2>You are navigating blindly through toxic air.</h2>
            <p>
              Every day, millions commute through invisible pollution corridors. Without real-time environmental intelligence, you unknowingly expose yourself to severe respiratory and cardiovascular risks.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════ THE SHIFT ══════════════════ */}
      <section className="lp-section lp-shift" id="shift">
        <div className="lp-split-section lp-split-section--reverse">
          <div className="lp-split-text">
            <span className="lp-tag-blue">⏱ THE SHIFT</span>
            <h2>Current AQI is already obsolete.</h2>
            <p>
              Knowing the air quality <em>right now</em> doesn't help if your commute is in two hours. AirAware uses machine learning to forecast pollution spikes, allowing you to plan ahead instead of reacting too late.
            </p>
          </div>

          <div className="lp-split-visual">
            <div className="lp-forecast-card">
              <div className="lp-forecast-card__header">
                <span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> Hourly Forecast</span>
                <span className="lp-chip-sm">AI MODEL v2</span>
              </div>
              <div className="lp-forecast-card__chart">
                <div className="lp-hazard-line"><span>HAZARD THRESHOLD</span></div>
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
          <h2>Intelligence at a Glance</h2>
          <p>A real-time, interactive dashboard that transforms complex environmental data into actionable travel intelligence.</p>
        </div>

        <div className="lp-dashboard-frame">
          <div className="lp-dashboard-mockup">
            <div className="lp-mockup-header">
              <div className="lp-mockup-search">🔍 Search locations...</div>
              <div className="lp-mockup-actions"><span className="lp-mockup-dot" /><span className="lp-mockup-dot" /></div>
            </div>

            <div className="lp-mockup-grid">
              <div className="lp-mockup-nav">
                <div className="lp-mockup-item active">📊 Overview</div>
                <div className="lp-mockup-item">🗺️ AQI Map</div>
                <div className="lp-mockup-item">🛣️ Route Planner</div>
                <div className="lp-mockup-item">📈 Forecast</div>
              </div>

              <div className="lp-mockup-main">
                <div className="lp-mockup-card">
                  <div className="lp-card-title">AQI Forecast <span className="lp-chip-sm">AI Powered</span></div>
                  <div className="lp-mockup-curve" />
                </div>
                <div className="lp-mockup-card">
                  <div className="lp-card-title">Health Score</div>
                  <div className="lp-mockup-gauge"><strong>82</strong><span>Good</span></div>
                </div>
              </div>
            </div>

            {/* Labeled pins */}
            <div className="lp-callout-pin lp-callout-pin--forecast">
              <span className="lp-pin-dot" /> AQI Forecast
            </div>
            <div className="lp-callout-pin lp-callout-pin--health">
              <span className="lp-pin-dot" /> Health Score
            </div>
            <div className="lp-callout-pin lp-callout-pin--map">
              <span className="lp-pin-dot" /> Live Map
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURE SUITE GRID ══════════════════ */}
      <section className="lp-section lp-suite">
        <div className="lp-section__header">
          <p className="lp-suite-subtitle">AirAware isn't just an air quality monitor. It's a complete environmental intelligence suite.</p>
        </div>

        <div className="lp-suite-grid">
          <div className="lp-suite-card lp-suite-card--wide">
            <h3>Interactive Map</h3>
            <p>High-resolution pollution heatmaps for your city.</p>
            <div className="lp-suite-preview lp-suite-preview--map">
              <div className="lp-preview-pill">AQI 145 · New Delhi</div>
            </div>
          </div>

          <div className="lp-suite-card">
            <h3>AI Forecast</h3>
            <p>Tomorrow: <strong>AQI 110</strong> 📈</p>
          </div>

          <div className="lp-suite-card">
            <h3>Route Planner</h3>
            <p>HYD → BLR <strong>18% Cleaner Route</strong></p>
          </div>

          <div className="lp-suite-card">
            <h3>Moderate Activity</h3>
            <p>😷 Mask Recommended</p>
          </div>

          <div className="lp-suite-card">
            <h3>Smart Alerts</h3>
            <p>🔔 Push notifications active</p>
          </div>

          <div className="lp-suite-card">
            <h3>AQI Trends</h3>
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
            <strong>Dashboard</strong>
            <span>Unified overview</span>
          </div>
          <div className="lp-wf-step">
            <div className="lp-wf-icon">🗺️</div>
            <strong>AQI Map</strong>
            <span>City-wide heatmaps</span>
          </div>
          <div className="lp-wf-step">
            <div className="lp-wf-icon">🛣️</div>
            <strong>Route Planner</strong>
            <span>Healthier directions</span>
          </div>
          <div className="lp-wf-step">
            <div className="lp-wf-icon">🔔</div>
            <strong>Health Alerts</strong>
            <span>Personalized notifications</span>
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA BANNER ══════════════════ */}
      <section className="lp-section lp-cta-banner">
        <div className="lp-cta-card">
          <h2>Ready for cleaner air?</h2>
          <p>Join AirAware today and start making smarter, healthier decisions before you step outside.</p>
          <NavLink to="/auth" className="lp-btn lp-btn--white">Get Started for Free</NavLink>
        </div>
      </section>
    </div>
  );
}

