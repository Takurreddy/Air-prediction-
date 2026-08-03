function FeatureCards() {
  const features = [
    {
      title: "Live AQI Dashboard",
      description: "Track station-level AQI, PM2.5, PM10, NO2, and weather indicators in real time.",
      icon: "🌫",
    },
    {
      title: "Cleaner Route Intelligence",
      description: "Compare alternate routes and choose paths with lower pollution exposure.",
      icon: "🗺",
    },
    {
      title: "Personalized Alerts",
      description: "Set AQI thresholds for specific stations and get notified before conditions worsen.",
      icon: "🚨",
    },
    {
      title: "AI AQI Forecasting",
      description: "Predict near-term air quality trends using station history and model signals.",
      icon: "🧠",
    },
  ];

  return (
    <section className="feature-section">
      <div className="section-heading">
        <h2>Built for citizens, analysts, and city operators</h2>
        <p>
          A modern interface inspired by smart-city command centers, tailored for this project&apos;s
          prediction and route optimization workflow.
        </p>
      </div>
      <div className="features">
        {features.map((feature) => (
          <article className="card" key={feature.title}>
            <h3>
              <span>{feature.icon}</span> {feature.title}
            </h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FeatureCards;