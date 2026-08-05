import os
import re

with open("src/LandingPage.js", "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    '"Three stages, running continuously"': '{t("landing.threeStages")}',
    '"Each stage feeds the next in a live loop — the model never stops\\n            learning from what actually happened versus what it forecast."': '{t("landing.eachStage")}',
    '<h3>Ingest ground truth</h3>': '<h3>{t("landing.step1Title")}</h3>',
    '<p>\\n              Low-cost sensor grids, government monitoring stations, satellite AOD\\n              readings and live traffic density are pulled in every few minutes and\\n              cross-calibrated against each other.\\n            </p>': '<p>{t("landing.step1Desc")}</p>',
    '<h3>Forecast the next 72 hours</h3>': '<h3>{t("landing.step2Title")}</h3>',
    '<p>\\n              A spatiotemporal model — trained on meteorology, emissions and\\n              historical pollution drift — projects PM2.5, PM10, NO₂ and ozone at\\n              150m resolution across the city.\\n            </p>': '<p>{t("landing.step2Desc")}</p>',
    '<h3>Alert and reroute</h3>': '<h3>{t("landing.step3Title")}</h3>',
    '<p>\\n              Alerts are scored against each user\\\'s own sensitivity profile, and\\n              the routing engine scores every path option by cumulative exposure,\\n              not just distance or time.\\n            </p>': '<p>{t("landing.step3Desc")}</p>',
    '<h2>Alerts tuned to your body, not the city average</h2>': '<h2>{t("landing.alertsTuned")}</h2>',
    '<p>\\n              A citywide AQI number means little if you have asthma, are pregnant,\\n              or run outdoors at 6am. AirAware weighs forecasts against a personal\\n              sensitivity profile before it ever pings you.\\n            </p>': '<p>{t("landing.alertsTunedDesc")}</p>',
    '<li>Threshold tuned per condition — asthma, COPD, cardiovascular, pregnancy, general</li>': '<li>{t("landing.li1")}</li>',
    '<li>Pollutant-specific triggers, not just a single blended index</li>': '<li>{t("landing.li2")}</li>',
    '<li>Quiet hours and activity-aware timing, so alerts land before exposure, not during sleep</li>': '<li>{t("landing.li3")}</li>',
    'title="Ozone rising near your evening run route"': 'title={t("landing.a1title")}',
    'body="O₃ forecast to hit 118 AQI by 5:30pm along your usual loop. Suggested window: before 3pm."': 'body={t("landing.a1body")}',
    'time="2 MIN AGO"': 'time={t("landing.a1time")}',
    'title="PM2.5 spike expected — asthma profile"': 'title={t("landing.a2title")}',
    'body="Construction-linked dust event forecast for your commute corridor, 8–10am tomorrow."': 'body={t("landing.a2body")}',
    'time="14 MIN AGO"': 'time={t("landing.a2time")}',
    '<h2>Routes optimized for what you breathe, not just how fast you get there</h2>': '<h2>{t("landing.routesOpt")}</h2>',
    '<p>\\n              The routing engine treats pollution exposure as a real cost function\\n              alongside time and distance — so you can choose the trade-off that\\n              fits you.\\n            </p>': '<p>{t("landing.routesOptDesc")}</p>',
    '<li>Every candidate route scored on cumulative pollutant exposure, door to door</li>': '<li>{t("landing.li4")}</li>',
    '<li>Walking, cycling and driving modes weighted differently — exposure per minute varies by mode</li>': '<li>{t("landing.li5")}</li>',
    '<li>Live re-routing when a forecast shifts mid-trip</li>': '<li>{t("landing.li6")}</li>',
    '"sensor readings processed daily"': '{t("landing.statsSensor")}',
    '"forecast grid resolution"': '{t("landing.statsGrid")}',
    '"rolling prediction horizon"': '{t("landing.statsRolling")}',
    '"mean absolute error, PM2.5"': '{t("landing.statsError")}',
    '<h2>Under the hood</h2>': '<h2>{t("landing.underHood")}</h2>',
    '<p>A pipeline built for a moving target</p>': '<p>{t("landing.pipeline")}</p>',
    '"Air quality doesn\\\'t sit still — the system is built as a continuous\\n            loop, not a one-off report."': '{t("landing.airDoesnt")}',
    'label="Sensor & satellite feed"': 'label={t("landing.arch1lbl")}',
    'desc="Ground stations, low-cost IoT nodes, AOD satellite data, weather & traffic APIs."': 'desc={t("landing.arch1dsc")}',
    'label="Calibration layer"': 'label={t("landing.arch2lbl")}',
    'desc="Cross-sensor bias correction and spatial interpolation across the city grid."': 'desc={t("landing.arch2dsc")}',
    'label="Spatiotemporal forecaster"': 'label={t("landing.arch3lbl")}',
    'desc="Learns pollutant drift from meteorology, emissions and historical patterns."': 'desc={t("landing.arch3dsc")}',
    'label="Exposure engine"': 'label={t("landing.arch4lbl")}',
    'desc="Converts forecasts into per-user risk scores and route exposure costs."': 'desc={t("landing.arch4dsc")}',
    'label="Alerts & routing"': 'label={t("landing.arch5lbl")}',
    'desc="Personalized push alerts and pollution-aware navigation, in real time."': 'desc={t("landing.arch5dsc")}',
    '<h2>Get started</h2>': '<h2>{t("landing.getStarted")}</h2>',
    'Give people a reason to trust the air again.': '{t("landing.givePeople")}',
    'Bring AirAware\\\'s forecasting and routing engine to your city, campus or app.': '{t("landing.bringAir")}',
    'Read the technical brief': '{t("landing.readTech")}',
    '<strong>PRODUCT</strong>': '<strong>{t("landing.product")}</strong>',
    '<strong>PROJECT</strong>': '<strong>{t("landing.project")}</strong>',
    '<strong>CONTACT</strong>': '<strong>{t("landing.contact")}</strong>',
    'How it works': '{t("landing.seeHow")}',
    '>Features</a>': '>{t("landing.features")}</a>',
    '>Architecture</a>': '>{t("landing.architecture")}</a>',
    '>Technical brief</a>': '>{t("landing.techBrief")}</a>',
    '>Dataset &amp; methodology</a>': '>{t("landing.dataset")}</a>',
    '>Team</NavLink>': '>{t("landing.team")}</NavLink>',
    '>Request a demo</NavLink>': '>{t("landing.reqDemo")}</NavLink>',
    '>Email us</a>': '>{t("landing.emailUs")}</a>',
    '<span>© 2026 AirAware. An AI-based air quality prediction &amp; route optimization project.</span>': '<span>{t("landing.copyright1")}</span>',
    '<span>Built for cleaner commutes.</span>': '<span>{t("landing.copyright2")}</span>',
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open("src/LandingPage.js", "w", encoding="utf-8") as f:
    f.write(content)
