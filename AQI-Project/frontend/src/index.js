import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ClerkProvider } from "@clerk/clerk-react";
import { AuthProvider } from './context/AuthContext';
import runtimeConfig from "./config/runtimeConfig";

const root = ReactDOM.createRoot(document.getElementById('root'));
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || runtimeConfig.clerkPublishableKey;

const appTree = (
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

if (!clerkPubKey) {
  root.render(
    <React.StrictMode>
      <div className="dashboard dashboard-page">
        <header className="page-header">
          <h1>Clerk Configuration Required</h1>
          <p>Set REACT_APP_CLERK_PUBLISHABLE_KEY in frontend .env to enable authentication.</p>
        </header>
      </div>
    </React.StrictMode>
  );
} else {
  root.render(
    <ClerkProvider publishableKey={clerkPubKey}>
      {appTree}
    </ClerkProvider>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
