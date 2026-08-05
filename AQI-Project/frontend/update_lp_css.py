import os

lp_css_append = """
/* ═══════════════════════════════════════════════
   LIGHT MODE OVERRIDES FOR LANDING PAGE
   ═══════════════════════════════════════════════ */
[data-theme="light"] .lp {
  color: #0f172a;
  background: #f8fafc;
}
[data-theme="light"] .lp-eyebrow {
  color: #0f766e;
  background: rgba(13,148,136,.1); border-color: rgba(13,148,136,.2);
}
[data-theme="light"] .lp-hero__sub { color: #475569; }
[data-theme="light"] .lp-btn--ghost {
  background: rgba(0,0,0,.05); color: #0f172a;
  border-color: rgba(15,23,42,.15);
}
[data-theme="light"] .lp-btn--ghost:hover { background: rgba(0,0,0,.08); }
[data-theme="light"] .lp-stat span { color: #64748b; }
[data-theme="light"] .lp-aqi-card {
  background: rgba(255,255,255,.9); border-color: rgba(13,148,136,.15);
  box-shadow: 0 20px 50px rgba(0,0,0,.1), inset 0 0 0 1px rgba(13,148,136,.05);
}
[data-theme="light"] .lp-aqi-card__location { color: #64748b; }
[data-theme="light"] .lp-aqi-card__label { color: #64748b; }
[data-theme="light"] .lp-spark-times { color: #64748b; }
[data-theme="light"] .lp-section__header p { color: #64748b; }
[data-theme="light"] .lp-section__sub { color: #475569; }
[data-theme="light"] .lp-how__step {
  background: rgba(255,255,255,.9); border-color: rgba(15,23,42,.1);
}
[data-theme="light"] .lp-how__num { color: #64748b; }
[data-theme="light"] .lp-how__step p { color: #475569; }
[data-theme="light"] .lp-feature-row__text p { color: #475569; }
[data-theme="light"] .lp-feature-list li { color: #475569; }
[data-theme="light"] .alert-pill__text p { color: #475569; }
[data-theme="light"] .alert-pill__time { color: #64748b; }
[data-theme="light"] .lp-map-mock {
  border-color: rgba(15,23,42,.15); background: rgba(241,245,249,.8);
}
[data-theme="light"] .lp-stats-bar {
  border-color: rgba(15,23,42,.1); background: rgba(255,255,255,.8);
}
[data-theme="light"] .lp-stats-bar__item span { color: #64748b; }
[data-theme="light"] .arch-step {
  background: rgba(255,255,255,.9); border-color: rgba(15,23,42,.1);
}
[data-theme="light"] .arch-step__desc { color: #475569; }
[data-theme="light"] .lp-cta {
  background: radial-gradient(ellipse 58% 48% at 50% 50%, rgba(13,148,136,.06) 0%, transparent 68%);
}
[data-theme="light"] .lp-cta__lead { color: #0f172a; }
[data-theme="light"] .lp-cta__sub { color: #475569; }
[data-theme="light"] .lp-footer {
  border-color: rgba(15,23,42,.1); background: #f1f5f9;
}
[data-theme="light"] .lp-footer__col strong { color: #64748b; }
[data-theme="light"] .lp-footer__col a { color: #0f172a; }
[data-theme="light"] .lp-footer__bottom {
  border-color: rgba(15,23,42,.1); color: #64748b;
}
"""

with open("src/LandingPage.css", "a", encoding="utf-8") as f:
    f.write(lp_css_append)
