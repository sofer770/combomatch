import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, MemoryRouter } from 'react-router-dom';
import App from './App';
import { AppProvider } from './state/AppContext';
import '@fontsource/rubik/hebrew-400.css';
import '@fontsource/rubik/hebrew-500.css';
import '@fontsource/rubik/hebrew-600.css';
import '@fontsource/rubik/hebrew-700.css';
import '@fontsource/rubik/latin-400.css';
import '@fontsource/rubik/latin-500.css';
import '@fontsource/rubik/latin-600.css';
import '@fontsource/rubik/latin-700.css';
import './index.css';
import logo from './assets/logo.png';

const icon = document.createElement('link');
icon.rel = 'icon';
icon.href = logo;
document.head.appendChild(icon);

// The single-file build is embedded in hosts that own the URL hash, so it routes in memory.
document.documentElement.lang = 'he';
document.documentElement.dir = 'rtl';

// Offline support + home-screen install on the hosted build (needs https, not the single file).
if (import.meta.env.PROD && import.meta.env.MODE !== 'single' && 'serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

const Router = import.meta.env.MODE === 'single' ? MemoryRouter : HashRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <AppProvider>
        <App />
      </AppProvider>
    </Router>
  </React.StrictMode>,
);
