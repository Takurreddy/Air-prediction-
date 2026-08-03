import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeatureCards from "./components/FeatureCards";
import Dashboard from "./components/Dashboard";
import RoutePlanner from "./components/RoutePlanner";
import Alerts from "./components/Alerts";
import About from "./components/About";
import Prediction from "./components/Prediction";
import Auth from "./components/Auth";
import runtimeConfig from "./config/runtimeConfig";
import { useAuth } from "./context/AuthContext";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

function Home() {
  return (
    <>
      <Hero />
      <FeatureCards />
    </>
  );
}

function ProtectedRoute({ children }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="dashboard dashboard-page">
        <header className="page-header">
          <h1>Loading</h1>
          <p>Checking your authentication status...</p>
        </header>
      </div>
    );
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className={`app-shell template-${runtimeConfig.uiTemplate}`}>
      <Navbar />

      <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/route-planner"
            element={
              <ProtectedRoute>
                <RoutePlanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<About />} />
          <Route
            path="/prediction"
            element={
              <ProtectedRoute>
                <Prediction />
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;