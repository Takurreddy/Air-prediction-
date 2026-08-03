import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  const navItems = [
    { path: "/", label: "Overview" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/route-planner", label: "Routes" },
    { path: "/alerts", label: "Alerts" },
    { path: "/prediction", label: "Prediction" },
    { path: "/about", label: "About" },
  ];

  return (
    <nav className="app-nav">
      <div className="nav-brand">
        <span className="brand-badge">AQ</span>
        <div>
          <h2>AirPulse IQ</h2>
          <p>Smart Air Quality Intelligence</p>
        </div>
      </div>

      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink to={item.path} className={({ isActive }) => (isActive ? "active" : "")}>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="nav-auth">
        <NavLink to="/auth" className="auth-link">
          {isAuthenticated ? "Account" : "Sign In"}
        </NavLink>
        {isAuthenticated ? (
          <button className="nav-logout-btn" type="button" onClick={logout}>
            Logout
          </button>
        ) : null}
      </div>
    </nav>
  );
}

export default Navbar;