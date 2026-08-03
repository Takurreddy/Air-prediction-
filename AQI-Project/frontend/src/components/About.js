function About() {
  return (
    <div className="dashboard dashboard-page">
      <header className="page-header">
        <h1>About the Platform</h1>
        <p>
          This project combines real-time air monitoring, AI-based prediction, route quality
          evaluation, and personalized alerts to support healthier daily decisions.
        </p>
      </header>
      <section className="panel">
        <h2>What this solution offers</h2>
        <ul className="about-list">
          <li>City-level AQI tracking with pollutant and weather indicators</li>
          <li>AI-powered AQI forecasting from station telemetry sequences</li>
          <li>Pollution-aware route scoring for safer commuting</li>
          <li>User-defined alert thresholds for proactive protection</li>
        </ul>
      </section>
    </div>
  );
}

export default About;