function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <p className="eyebrow">Urban Air Monitoring Platform</p>
        <h1>Predict AQI, plan cleaner routes, and protect daily health</h1>
        <p className="hero-subtitle">
          Real-time station telemetry, AI-driven forecasting, and personalized alerts in one
          intuitive control center.
        </p>
        <div className="hero-metrics">
          <div className="metric-card">
            <strong>24x7</strong>
            <span>Air quality visibility</span>
          </div>
          <div className="metric-card">
            <strong>AI</strong>
            <span>Prediction-assisted planning</span>
          </div>
          <div className="metric-card">
            <strong>City + Route</strong>
            <span>Public safety insights</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;