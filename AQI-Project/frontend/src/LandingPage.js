import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
            {t('landing.knowAir').split(' ').slice(0, -3).join(' ')}<br />
            <span className="lp-hero__accent">{t('landing.knowAir').split(' ').slice(-3).join(' ')}</span>
          </h1>

          <p className="lp-hero__sub">
            {t('landing.fuses')}
          </p>

          <div className="lp-hero__ctas">
            <NavLink to="/auth" className="lp-btn lp-btn--primary">{t('landing.reqDemo')} →</NavLink>
            <a href="#how-it-works" className="lp-btn lp-btn--ghost">{t('landing.seeHow')}</a>
          </div>

          <div className="lp-hero__stats">
            <div className="lp-stat">
              <strong>72hr</strong>
              <span>{t('landing.forecast72')}</span>
            </div>
            <div className="lp-stat">
              <strong>±8%</strong>
              <span>{t('landing.err8')}</span>
            </div>
            <div className="lp-stat">
              <strong>150m</strong>
              <span>{t('landing.res150')}</span>
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
          <h2>{t('landing.sense')}</h2>
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
            <h3>{t("landing.step1Title")}</h3>
            <p>
              {t("landing.step1Desc")}
            </p>
          </div>

          <div className="lp-how__step">
            <div className="lp-how__icon lp-how__icon--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l18 18M9 9a3 3 0 105.12 2.12"/><path d="M17.94 17.94A8 8 0 014.06 4.06"/></svg>
            </div>
            <span className="lp-how__num">02 / Predict</span>
            <h3>{t("landing.step2Title")}</h3>
            <p>
              {t("landing.step2Desc")}
            </p>
          </div>

          <div className="lp-how__step">
            <div className="lp-how__icon lp-how__icon--purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span className="lp-how__num">03 / Protect</span>
            <h3>{t("landing.step3Title")}</h3>
            <p>
              {t("landing.step3Desc")}
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section className="lp-section lp-features" id="features">

        {/* alerts block */}
        <div className="lp-feature-row">
          <div className="lp-feature-row__text">
            <h2>{t("landing.alertsTuned")}</h2>
            <p>
              {t("landing.alertsTunedDesc")}
            </p>
            <ul className="lp-feature-list">
              <li>{t("landing.li1")}</li>
              <li>{t("landing.li2")}</li>
              <li>{t("landing.li3")}</li>
            </ul>
          </div>

          <div className="lp-feature-row__visual">
            <AlertPill
              icon="🟠"
              color="orange"
              title={t("landing.a1title")}
              body={t("landing.a1body")}
              time={t("landing.a1time")}
            />
            <AlertPill
              icon="🔴"
              color="red"
              title={t("landing.a2title")}
              body={t("landing.a2body")}
              time={t("landing.a2time")}
            />
          </div>
        </div>

        {/* routing block */}
        <div className="lp-feature-row lp-feature-row--reverse">
          <div className="lp-feature-row__text">
            <h2>{t("landing.routesOpt")}</h2>
            <p>
              {t("landing.routesOptDesc")}
            </p>
            <ul className="lp-feature-list">
              <li>{t("landing.li4")}</li>
              <li>{t("landing.li5")}</li>
              <li>{t("landing.li6")}</li>
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
            { value: "1.2M+", label: t("landing.statsSensor") },
            { value: "150m", label: t("landing.statsGrid") },
            { value: "72hr", label: t("landing.statsRolling") },
            { value: "±8%", label: t("landing.statsError") },
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
          <h2>{t("landing.underHood")}</h2>
          <p>{t("landing.pipeline")}</p>
          <span className="lp-section__sub">
            {t("landing.airDoesnt")}
          </span>
        </div>

        <div className="lp-arch__pipeline">
          <ArchStep tag="INPUT"   label={t("landing.arch1lbl")}   desc={t("landing.arch1dsc")} arrow />
          <ArchStep tag="PROCESS" label={t("landing.arch2lbl")}         desc={t("landing.arch2dsc")} arrow />
          <ArchStep tag="MODEL"   label={t("landing.arch3lbl")} desc={t("landing.arch3dsc")} arrow />
          <ArchStep tag="SCORE"   label={t("landing.arch4lbl")}           desc={t("landing.arch4dsc")} arrow />
          <ArchStep tag="OUTPUT"  label={t("landing.arch5lbl")}          desc={t("landing.arch5dsc")} arrow={false} />
        </div>
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section className="lp-cta" id="get-started">
        <h2>{t("landing.getStarted")}</h2>
        <p className="lp-cta__lead">{t("landing.givePeople")}</p>
        <p className="lp-cta__sub">
          {t("landing.bringAir")}
        </p>
        <div className="lp-cta__actions">
          <NavLink to="/auth" className="lp-btn lp-btn--primary">Request a demo →</NavLink>
          <a href="#architecture" className="lp-btn lp-btn--ghost">{t("landing.readTech")}</a>
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
              <strong>{t("landing.product")}</strong>
              <a href="#how-it-works">{t("landing.seeHow")}</a>
              <a href="#features">{t("landing.features")}</a>
              <a href="#architecture">{t("landing.architecture")}</a>
            </div>
            <div className="lp-footer__col">
              <strong>{t("landing.project")}</strong>
              <a href="#architecture">{t("landing.techBrief")}</a>
              <a href="#how-it-works">{t("landing.dataset")}</a>
              <NavLink to="/about">{t("landing.team")}</NavLink>
            </div>
            <div className="lp-footer__col">
              <strong>{t("landing.contact")}</strong>
              <NavLink to="/auth">{t("landing.reqDemo")}</NavLink>
              <a href="mailto:hello@airaware.io">{t("landing.emailUs")}</a>
            </div>
          </div>
        </div>

        <div className="lp-footer__bottom">
          <span>{t("landing.copyright1")}</span>
          <span>{t("landing.copyright2")}</span>
        </div>
      </footer>

    </div>
  );
}
